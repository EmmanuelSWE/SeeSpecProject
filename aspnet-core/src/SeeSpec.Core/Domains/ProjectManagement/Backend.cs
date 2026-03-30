using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using SeeSpec.Domains.CodingManagement;
using SeeSpec.Domains.SpecManagement;

namespace SeeSpec.Domains.ProjectManagement
{
    public class Backend : FullAuditedEntity<Guid>, IMustHaveTenant
    {
        public Backend()
        {
            Assignments = new HashSet<Assignment>();
            Teams = new HashSet<Team>();
            Tasks = new HashSet<Task>();
            Notes = new HashSet<Note>();
            DiagramElements = new HashSet<DiagramElement>();
            GenerationSnapshots = new HashSet<GenerationSnapshot>();
            ValidationResults = new HashSet<SeeSpec.Domains.CodingManagement.ValidationResult>();
        }

        public int TenantId { get; set; }

        [Required]
        [StringLength(128)]
        public string Name { get; set; }

        [Required]
        [StringLength(128)]
        public string Slug { get; set; }

        [Required]
        [StringLength(64)]
        public string Framework { get; set; }

        [StringLength(32)]
        public string RuntimeVersion { get; set; }

        [StringLength(2000)]
        public string Description { get; set; }

        public BackendStatus Status { get; set; }

        [StringLength(512)]
        public string RepositoryUrl { get; set; }

        public virtual Spec Spec { get; set; }

        public virtual ICollection<Assignment> Assignments { get; set; }

        public virtual ICollection<Team> Teams { get; set; }

        public virtual ICollection<Task> Tasks { get; set; }

        public virtual ICollection<Note> Notes { get; set; }

        public virtual ICollection<DiagramElement> DiagramElements { get; set; }

        public virtual ICollection<GenerationSnapshot> GenerationSnapshots { get; set; }

        public virtual ICollection<SeeSpec.Domains.CodingManagement.ValidationResult> ValidationResults { get; set; }
    }
}
