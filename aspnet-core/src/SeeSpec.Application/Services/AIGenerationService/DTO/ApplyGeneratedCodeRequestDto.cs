using System;
using System.ComponentModel.DataAnnotations;

namespace SeeSpec.Services.AIGenerationService.DTO
{
    public class ApplyGeneratedCodeRequestDto
    {
        [Required]
        public Guid SpecId { get; set; }

        [Required]
        [StringLength(256)]
        public string WorkspaceKey { get; set; }

        public bool ConfirmApply { get; set; }

        public bool ConfirmOverwriteExisting { get; set; }
    }
}
