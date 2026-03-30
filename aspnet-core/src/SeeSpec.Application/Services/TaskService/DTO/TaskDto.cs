using System;
using System.ComponentModel.DataAnnotations;
using Abp.Application.Services.Dto;
using Abp.AutoMapper;
using SeeSpec.Domains.ProjectManagement;

namespace SeeSpec.Services.TaskService.DTO
{
    [AutoMap(typeof(Task))]
    public class TaskDto : EntityDto<Guid>
    {
        public Guid BackendId { get; set; }

        [Required]
        [StringLength(256)]
        public string Title { get; set; }

        [StringLength(4000)]
        public string Description { get; set; }

        public TaskStatus Status { get; set; }

        public TaskPriority Priority { get; set; }

        public long CreatedByUserId { get; set; }

        public long? AssignedToUserId { get; set; }

        public Guid? TeamId { get; set; }

        public Guid? SpecSectionId { get; set; }

        public DateTime? DueAt { get; set; }
    }
}

