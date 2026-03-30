using System;
using System.ComponentModel.DataAnnotations.Schema;
using Abp.Domain.Entities.Auditing;
using SeeSpec.Authorization.Users;

namespace SeeSpec.Domains.ProjectManagement
{
    public class Assignment : FullAuditedEntity<Guid>
    {
        public Guid BackendId { get; set; }

        [ForeignKey(nameof(BackendId))]
        public virtual Backend Backend { get; set; }

        public Guid? TeamId { get; set; }

        [ForeignKey(nameof(TeamId))]
        public virtual Team Team { get; set; }

        public long UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public virtual User User { get; set; }

        public bool IsActive { get; set; }

        public DateTime JoinedAt { get; set; }
    }
}
