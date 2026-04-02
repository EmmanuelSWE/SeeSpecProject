using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Entities;
using Abp.Domain.Repositories;
using Abp.Extensions;
using Abp.IdentityFramework;
using Abp.Linq.Extensions;
using Abp.Localization;
using Abp.Runtime.Session;
using Abp.UI;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SeeSpec.Authorization;
using SeeSpec.Authorization.Accounts;
using SeeSpec.Authorization.Roles;
using SeeSpec.Authorization.Users;
using SeeSpec.Roles.Dto;
using SeeSpec.Users.Dto;

namespace SeeSpec.Users
{
    [AbpAuthorize]
    public class UserAppService : AsyncCrudAppService<User, UserDto, long, PagedUserResultRequestDto, CreateUserDto, UserDto>, IUserAppService
    {
        public const string MustChangePasswordClaimType = "SeeSpec.MustChangePassword";

        private static readonly string[] RestrictedManagerAssignableRoles =
        {
            StaticRoleNames.Tenants.BusinessAnalyst,
            StaticRoleNames.Tenants.SystemArchitect,
            StaticRoleNames.Tenants.TeamMember
        };

        private readonly UserManager _userManager;
        private readonly RoleManager _roleManager;
        private readonly IRepository<Role> _roleRepository;
        private readonly IPasswordHasher<User> _passwordHasher;
        private readonly IAbpSession _abpSession;
        private readonly LogInManager _logInManager;

        public UserAppService(
            IRepository<User, long> repository,
            UserManager userManager,
            RoleManager roleManager,
            IRepository<Role> roleRepository,
            IPasswordHasher<User> passwordHasher,
            IAbpSession abpSession,
            LogInManager logInManager)
            : base(repository)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _roleRepository = roleRepository;
            _passwordHasher = passwordHasher;
            _abpSession = abpSession;
            _logInManager = logInManager;
        }

        public override async Task<UserDto> CreateAsync(CreateUserDto input)
        {
            CheckCreatePermission();

            var user = ObjectMapper.Map<User>(input);
            var resolvedRoleNames = await ResolveRequestedRoleNamesAsync(input.RoleNames, isCreateOperation: true);

            user.TenantId = AbpSession.TenantId;
            user.IsEmailConfirmed = true;

            await _userManager.InitializeOptionsAsync(AbpSession.TenantId);
            CheckErrors(await _userManager.CreateAsync(user, User.DefaultPassword));

            if (resolvedRoleNames.Length > 0)
            {
                CheckErrors(await _userManager.SetRolesAsync(user, resolvedRoleNames));
            }

            await SetMustChangePasswordAsync(user, true);
            CurrentUnitOfWork.SaveChanges();

            return MapToEntityDto(user);
        }

        public override async Task<UserDto> UpdateAsync(UserDto input)
        {
            CheckUpdatePermission();

            var user = await _userManager.GetUserByIdAsync(input.Id);
            await EnsureCanManageTargetUserAsync(user);

            var preserveActivationState = !PermissionChecker.IsGranted(PermissionNames.Pages_Users_Edit);
            var currentActivationState = user.IsActive;

            MapToEntity(input, user);
            if (preserveActivationState)
            {
                user.IsActive = currentActivationState;
            }

            CheckErrors(await _userManager.UpdateAsync(user));

            if (input.RoleNames != null)
            {
                var resolvedRoleNames = await ResolveRequestedRoleNamesAsync(input.RoleNames, isCreateOperation: false);
                CheckErrors(await _userManager.SetRolesAsync(user, resolvedRoleNames));
            }

            return await GetAsync(input);
        }

        public override async Task DeleteAsync(EntityDto<long> input)
        {
            CheckDeletePermission();

            var user = await _userManager.GetUserByIdAsync(input.Id);
            await EnsureCanManageTargetUserAsync(user);
            await _userManager.DeleteAsync(user);
        }

        [AbpAuthorize(PermissionNames.Pages_Users_Edit)]
        public async Task Activate(EntityDto<long> user)
        {
            await Repository.UpdateAsync(user.Id, entity =>
            {
                entity.IsActive = true;
                return Task.CompletedTask;
            });
        }

        [AbpAuthorize(PermissionNames.Pages_Users_Edit)]
        public async Task DeActivate(EntityDto<long> user)
        {
            await Repository.UpdateAsync(user.Id, entity =>
            {
                entity.IsActive = false;
                return Task.CompletedTask;
            });
        }

        public async Task<ListResultDto<RoleDto>> GetRoles()
        {
            CheckGetAllPermission();

            var roles = await _roleRepository.GetAll()
                .Where(role => role.TenantId == AbpSession.TenantId)
                .ToListAsync();

            if (!PermissionChecker.IsGranted(PermissionNames.Pages_Users_AssignRoles))
            {
                roles = roles.Where(role => RestrictedManagerAssignableRoles.Contains(role.Name)).ToList();
            }

            return new ListResultDto<RoleDto>(ObjectMapper.Map<List<RoleDto>>(roles));
        }

        public async Task ChangeLanguage(ChangeUserLanguageDto input)
        {
            await SettingManager.ChangeSettingForUserAsync(
                AbpSession.ToUserIdentifier(),
                LocalizationSettingNames.DefaultLanguage,
                input.LanguageName
            );
        }

        public async Task<bool> ChangePassword(ChangePasswordDto input)
        {
            await _userManager.InitializeOptionsAsync(AbpSession.TenantId);

            var user = await _userManager.FindByIdAsync(AbpSession.GetUserId().ToString());
            if (user == null)
            {
                throw new Exception("There is no current user!");
            }

            if (await _userManager.CheckPasswordAsync(user, input.CurrentPassword))
            {
                CheckErrors(await _userManager.ChangePasswordAsync(user, input.NewPassword));
                await SetMustChangePasswordAsync(user, false);
            }
            else
            {
                CheckErrors(IdentityResult.Failed(new IdentityError { Description = "Incorrect password." }));
            }

            return true;
        }

        public async Task<bool> ResetPassword(ResetPasswordDto input)
        {
            PermissionChecker.Authorize(PermissionNames.Pages_Users_ResetPassword);

            if (_abpSession.UserId == null)
            {
                throw new UserFriendlyException("Please log in before attempting to reset password.");
            }

            var currentUser = await _userManager.GetUserByIdAsync(_abpSession.GetUserId());
            var loginAsync = await _logInManager.LoginAsync(currentUser.UserName, input.AdminPassword, shouldLockout: false);
            if (loginAsync.Result != AbpLoginResultType.Success)
            {
                throw new UserFriendlyException("Your 'Admin Password' did not match the one on record.  Please try again.");
            }

            if (currentUser.IsDeleted || !currentUser.IsActive)
            {
                return false;
            }

            var user = await _userManager.GetUserByIdAsync(input.UserId);
            if (user != null)
            {
                user.Password = _passwordHasher.HashPassword(user, input.NewPassword);
                await CurrentUnitOfWork.SaveChangesAsync();
            }

            return true;
        }

        public async Task<bool> GetMustChangePasswordAsync(User user)
        {
            var claims = await _userManager.GetClaimsAsync(user);
            return claims.Any(claim => claim.Type == MustChangePasswordClaimType && string.Equals(claim.Value, "true", StringComparison.OrdinalIgnoreCase));
        }

        protected override User MapToEntity(CreateUserDto createInput)
        {
            var user = ObjectMapper.Map<User>(createInput);
            user.SetNormalizedNames();
            return user;
        }

        protected override void MapToEntity(UserDto input, User user)
        {
            ObjectMapper.Map(input, user);
            user.SetNormalizedNames();
        }

        protected override UserDto MapToEntityDto(User user)
        {
            var roleIds = user.Roles.Select(item => item.RoleId).ToArray();
            var roles = _roleManager.Roles.Where(role => roleIds.Contains(role.Id)).Select(role => role.Name);

            var userDto = base.MapToEntityDto(user);
            userDto.RoleNames = roles.ToArray();
            return userDto;
        }

        protected override IQueryable<User> CreateFilteredQuery(PagedUserResultRequestDto input)
        {
            return Repository.GetAllIncluding(item => item.Roles)
                .WhereIf(!input.Keyword.IsNullOrWhiteSpace(), item => item.UserName.Contains(input.Keyword) || item.Name.Contains(input.Keyword) || item.EmailAddress.Contains(input.Keyword))
                .WhereIf(input.IsActive.HasValue, item => item.IsActive == input.IsActive);
        }

        protected override async Task<User> GetEntityByIdAsync(long id)
        {
            var user = await Repository.GetAllIncluding(item => item.Roles).FirstOrDefaultAsync(item => item.Id == id);
            if (user == null)
            {
                throw new EntityNotFoundException(typeof(User), id);
            }

            return user;
        }

        protected override IQueryable<User> ApplySorting(IQueryable<User> query, PagedUserResultRequestDto input)
        {
            return query.OrderBy(item => item.UserName);
        }

        protected override void CheckCreatePermission()
        {
            if (PermissionChecker.IsGranted(PermissionNames.Pages_Users_Create) || PermissionChecker.IsGranted(PermissionNames.Pages_Team_AddPeople))
            {
                return;
            }

            throw new AbpAuthorizationException("You are not allowed to add people in this tenant.");
        }

        protected override void CheckUpdatePermission()
        {
            if (PermissionChecker.IsGranted(PermissionNames.Pages_Users_Edit) || PermissionChecker.IsGranted(PermissionNames.Pages_Team_EditPeople))
            {
                return;
            }

            throw new AbpAuthorizationException("You are not allowed to edit people in this tenant.");
        }

        protected override void CheckDeletePermission()
        {
            if (PermissionChecker.IsGranted(PermissionNames.Pages_Users_Delete) || PermissionChecker.IsGranted(PermissionNames.Pages_Team_RemovePeople))
            {
                return;
            }

            throw new AbpAuthorizationException("You are not allowed to remove people in this tenant.");
        }

        protected override void CheckGetAllPermission()
        {
            if (PermissionChecker.IsGranted(PermissionNames.Pages_Users) ||
                PermissionChecker.IsGranted(PermissionNames.Pages_Team_ViewAll) ||
                PermissionChecker.IsGranted(PermissionNames.Pages_Team_View) ||
                PermissionChecker.IsGranted(PermissionNames.Pages_Team_AddPeople) ||
                PermissionChecker.IsGranted(PermissionNames.Pages_Team_EditPeople))
            {
                return;
            }

            throw new AbpAuthorizationException("You are not allowed to view people in this tenant.");
        }

        protected override void CheckGetPermission()
        {
            CheckGetAllPermission();
        }

        protected virtual void CheckErrors(IdentityResult identityResult)
        {
            identityResult.CheckErrors(LocalizationManager);
        }

        private async Task<string[]> ResolveRequestedRoleNamesAsync(IEnumerable<string> requestedRoleNames, bool isCreateOperation)
        {
            var normalizedRoleNames = (requestedRoleNames ?? Array.Empty<string>())
                .Where(roleName => !roleName.IsNullOrWhiteSpace())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();

            if (PermissionChecker.IsGranted(PermissionNames.Pages_Users_AssignRoles))
            {
                return normalizedRoleNames;
            }

            if (normalizedRoleNames.Any(roleName => !RestrictedManagerAssignableRoles.Contains(roleName)))
            {
                throw new UserFriendlyException("Project Leads may only assign Business Analyst, System Architect, or Team Member roles.");
            }

            if (isCreateOperation && normalizedRoleNames.Length == 0)
            {
                return new[] { StaticRoleNames.Tenants.TeamMember };
            }

            return normalizedRoleNames;
        }

        private async Task EnsureCanManageTargetUserAsync(User user)
        {
            if (PermissionChecker.IsGranted(PermissionNames.Pages_Users_Edit) ||
                PermissionChecker.IsGranted(PermissionNames.Pages_Users_Delete) ||
                PermissionChecker.IsGranted(PermissionNames.Pages_Users_AssignRoles))
            {
                return;
            }

            var currentRoles = await _userManager.GetRolesAsync(user);
            if (currentRoles.Any(roleName => !RestrictedManagerAssignableRoles.Contains(roleName)))
            {
                throw new UserFriendlyException("This user has an administrative role that only tenant administrators may manage.");
            }
        }

        private async Task SetMustChangePasswordAsync(User user, bool mustChangePassword)
        {
            var currentClaims = await _userManager.GetClaimsAsync(user);
            var existingClaims = currentClaims.Where(claim => claim.Type == MustChangePasswordClaimType).ToList();

            if (existingClaims.Count > 0)
            {
                CheckErrors(await _userManager.RemoveClaimsAsync(user, existingClaims));
            }

            if (mustChangePassword)
            {
                CheckErrors(await _userManager.AddClaimAsync(user, new Claim(MustChangePasswordClaimType, "true")));
            }
        }
    }
}
