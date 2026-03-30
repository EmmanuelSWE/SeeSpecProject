using System;
using System.ComponentModel.DataAnnotations;
using Abp.Application.Services.Dto;
using Abp.AutoMapper;
using SeeSpec.Domains.ProjectManagement;

namespace SeeSpec.Services.NotesService.DTO
{
    [AutoMap(typeof(Note))]
    public class NotesDto : EntityDto<Guid>
    {
        public Guid BackendId { get; set; }

        public Guid? TaskId { get; set; }

        public Guid? GenerationSnapshotId { get; set; }

        public long AuthorUserId { get; set; }

        public NoteType NoteType { get; set; }

        [Required]
        [StringLength(4000)]
        public string Body { get; set; }

        [StringLength(1000)]
        public string OutcomeSummary { get; set; }
    }
}

