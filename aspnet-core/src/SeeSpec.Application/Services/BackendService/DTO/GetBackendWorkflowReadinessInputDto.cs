using System;
using System.ComponentModel.DataAnnotations;

namespace SeeSpec.Services.BackendService.DTO
{
    public class GetBackendWorkflowReadinessInputDto
    {
        [Required]
        public Guid BackendId { get; set; }
    }
}
