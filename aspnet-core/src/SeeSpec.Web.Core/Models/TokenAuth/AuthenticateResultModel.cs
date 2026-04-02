using Abp.Authorization.Users;
using System.Collections.Generic;

namespace SeeSpec.Models.TokenAuth
{
    public class AuthenticateResultModel
    {
        public string AccessToken { get; set; }

        public string EncryptedAccessToken { get; set; }

        public int ExpireInSeconds { get; set; }

        public long UserId { get; set; }

        public int? TenantId { get; set; }

        public string UserName { get; set; }

        public ICollection<UserRole> Roles { get; set; }

        public string[] RoleNames { get; set; }

        public string[] GrantedPermissions { get; set; }

        public string FullName { get; set; }

        public string EmailAddress { get; set; }

        public bool MustChangePassword { get; set; }
    }
}
