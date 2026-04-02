using System;
using System.ComponentModel.DataAnnotations;

namespace SeeSpec.Services.AIGenerationService.DTO
{
    public class CleanupGenerationWorkspaceRequestDto
    {
        [Required]
        public Guid BackendId { get; set; }
    }
}
