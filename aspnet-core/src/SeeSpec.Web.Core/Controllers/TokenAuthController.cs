using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Abp.Authorization;
using Abp.Authorization.Users;
using Abp.MultiTenancy;
using Abp.Runtime.Security;
using Abp.UI;
using SeeSpec.Authentication.JwtBearer;
using SeeSpec.Authorization;
using SeeSpec.Authorization.Roles;
using SeeSpec.Authorization.Users;
using SeeSpec.Models.TokenAuth;
using SeeSpec.MultiTenancy;

namespace SeeSpec.Controllers
{
    [Route("api/[controller]/[action]")]
    public class TokenAuthController : SeeSpecControllerBase
    {
        private const string AuthCookieName = "seespec_auth_token";
        private const string SessionCookieName = "seespec_user_session";

        private readonly LogInManager _logInManager;
        private readonly UserManager _userManager;
        private readonly RoleManager _roleManager;
        private readonly UserClaimsPrincipalFactory _claimsPrincipalFactory;
        private readonly TenantManager _tenantManager;
        private readonly ITenantCache _tenantCache;
        private readonly AbpLoginResultTypeHelper _abpLoginResultTypeHelper;
        private readonly TokenAuthConfiguration _configuration;

        public TokenAuthController(
            LogInManager logInManager,
            UserManager userManager,
            RoleManager roleManager,
            UserClaimsPrincipalFactory claimsPrincipalFactory,
            TenantManager tenantManager,
            ITenantCache tenantCache,
            AbpLoginResultTypeHelper abpLoginResultTypeHelper,
            TokenAuthConfiguration configuration)
        {
            _logInManager = logInManager;
            _userManager = userManager;
            _roleManager = roleManager;
            _claimsPrincipalFactory = claimsPrincipalFactory;
            _tenantManager = tenantManager;
            _tenantCache = tenantCache;
            _abpLoginResultTypeHelper = abpLoginResultTypeHelper;
            _configuration = configuration;
        }

        [HttpPost]
        public async Task<AuthenticateResultModel> Authenticate([FromBody] AuthenticateModel model)
        {
            var authenticatedSession = await GetAuthenticatedSessionAsync(
                model.UserNameOrEmailAddress,
                model.Password,
                !string.IsNullOrWhiteSpace(model.TenancyName) ? model.TenancyName : GetTenancyNameOrNull()
            );

            var accessToken = CreateAccessToken(CreateJwtClaims(authenticatedSession.Identity));
            var fullName = $"{authenticatedSession.User.Name} {authenticatedSession.User.Surname}".Trim();

            var result = new AuthenticateResultModel
            {
                AccessToken = accessToken,
                EncryptedAccessToken = GetEncryptedAccessToken(accessToken),
                ExpireInSeconds = (int)_configuration.Expiration.TotalSeconds,
                UserId = authenticatedSession.User.Id,
                TenantId = authenticatedSession.User.TenantId,
                UserName = authenticatedSession.User.UserName,
                FullName = fullName,
                EmailAddress = authenticatedSession.User.EmailAddress
            };

            AppendAuthCookies(result);

            return result;
        }

        [HttpPost]
        public IActionResult Logout()
        {
            Response.Cookies.Delete(AuthCookieName, BuildCookieOptions(httpOnly: true, expiresInSeconds: 0));
            Response.Cookies.Delete(SessionCookieName, BuildCookieOptions(httpOnly: false, expiresInSeconds: 0));
            return Ok();
        }

        private string GetTenancyNameOrNull()
        {
            if (!AbpSession.TenantId.HasValue)
            {
                return null;
            }

            return _tenantCache.GetOrNull(AbpSession.TenantId.Value)?.TenancyName;
        }

        private async Task<AuthenticatedSession> GetAuthenticatedSessionAsync(string usernameOrEmailAddress, string password, string tenancyName)
        {
            var loginResult = await _logInManager.LoginAsync(usernameOrEmailAddress, password, tenancyName);

            if (loginResult.Result == AbpLoginResultType.Success)
            {
                return new AuthenticatedSession(loginResult.User, loginResult.Identity);
            }

            if (!string.IsNullOrWhiteSpace(tenancyName))
            {
                var hostLoginResult = await _logInManager.LoginAsync(usernameOrEmailAddress, password, null);

                if (hostLoginResult.Result == AbpLoginResultType.Success &&
                    await _userManager.IsInRoleAsync(hostLoginResult.User, StaticRoleNames.Host.Admin))
                {
                    var tenantAdminSession = await CreateTenantAdminSessionAsync(tenancyName);

                    if (tenantAdminSession != null)
                    {
                        return tenantAdminSession;
                    }

                    throw new UserFriendlyException(
                        $"The tenant \"{tenancyName}\" exists, but no active tenant admin account is available for automatic sign-in."
                    );
                }
            }

            throw _abpLoginResultTypeHelper.CreateExceptionForFailedLoginAttempt(loginResult.Result, usernameOrEmailAddress, tenancyName);
        }

        private async Task<AuthenticatedSession> CreateTenantAdminSessionAsync(string tenancyName)
        {
            var tenant = await _tenantManager.FindByTenancyNameAsync(tenancyName);

            if (tenant == null || !tenant.IsActive)
            {
                return null;
            }

            var adminRole = await _roleManager.Roles
                .AsNoTracking()
                .FirstOrDefaultAsync(role => role.TenantId == tenant.Id && role.Name == StaticRoleNames.Tenants.Admin);

            if (adminRole == null)
            {
                return null;
            }

            var tenantAdminUser = await _userManager.Users
                .FirstOrDefaultAsync(user => user.TenantId == tenant.Id && user.UserName == AbpUserBase.AdminUserName);

            if (tenantAdminUser == null || !tenantAdminUser.IsActive)
            {
                tenantAdminUser = await _userManager.Users
                    .Include(user => user.Roles)
                    .Where(user => user.TenantId == tenant.Id && user.IsActive)
                    .OrderBy(user => user.Id)
                    .FirstOrDefaultAsync(user => user.Roles.Any(userRole => userRole.RoleId == adminRole.Id));
            }

            if (tenantAdminUser == null || !tenantAdminUser.IsActive)
            {
                return null;
            }

            var principal = await _claimsPrincipalFactory.CreateAsync(tenantAdminUser);
            var identity = principal.Identity as ClaimsIdentity;
            if (identity == null)
            {
                return null;
            }

            return new AuthenticatedSession(tenantAdminUser, identity);
        }

        private string CreateAccessToken(IEnumerable<Claim> claims, TimeSpan? expiration = null)
        {
            var now = DateTime.UtcNow;

            var jwtSecurityToken = new JwtSecurityToken(
                issuer: _configuration.Issuer,
                audience: _configuration.Audience,
                claims: claims,
                notBefore: now,
                expires: now.Add(expiration ?? _configuration.Expiration),
                signingCredentials: _configuration.SigningCredentials
            );

            return new JwtSecurityTokenHandler().WriteToken(jwtSecurityToken);
        }

        private static List<Claim> CreateJwtClaims(ClaimsIdentity identity)
        {
            var claims = identity.Claims.ToList();
            var nameIdClaim = claims.First(c => c.Type == ClaimTypes.NameIdentifier);

            // Specifically add the jti (random nonce), iat (issued timestamp), and sub (subject/user) claims.
            claims.AddRange(new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, nameIdClaim.Value),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.Now.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
            });

            return claims;
        }

        private string GetEncryptedAccessToken(string accessToken)
        {
            return SimpleStringCipher.Instance.Encrypt(accessToken);
        }

        private void AppendAuthCookies(AuthenticateResultModel result)
        {
            Response.Cookies.Append(
                AuthCookieName,
                result.AccessToken,
                BuildCookieOptions(httpOnly: true, expiresInSeconds: result.ExpireInSeconds)
            );

            var sessionPayload = JsonSerializer.Serialize(new
            {
                userId = result.UserId,
                tenantId = result.TenantId,
                userName = result.UserName,
                fullName = result.FullName,
                emailAddress = result.EmailAddress,
                expireInSeconds = result.ExpireInSeconds
            });

            Response.Cookies.Append(
                SessionCookieName,
                sessionPayload,
                BuildCookieOptions(httpOnly: false, expiresInSeconds: result.ExpireInSeconds)
            );
        }

        private CookieOptions BuildCookieOptions(bool httpOnly, int expiresInSeconds)
        {
            var isSecureRequest = Request.IsHttps;

            return new CookieOptions
            {
                HttpOnly = httpOnly,
                Secure = isSecureRequest,
                SameSite = isSecureRequest ? SameSiteMode.None : SameSiteMode.Lax,
                Path = "/",
                Expires = DateTimeOffset.UtcNow.AddSeconds(expiresInSeconds)
            };
        }

        private sealed class AuthenticatedSession
        {
            public AuthenticatedSession(User user, ClaimsIdentity identity)
            {
                User = user;
                Identity = identity;
            }

            public User User { get; }

            public ClaimsIdentity Identity { get; }
        }
    }
}
