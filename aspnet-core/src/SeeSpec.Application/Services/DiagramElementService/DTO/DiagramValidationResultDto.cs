using System.Collections.Generic;

namespace SeeSpec.Services.DiagramElementService.DTO
{
    public class DiagramValidationResultDto
    {
        public bool IsValid { get; set; }

        public List<string> Errors { get; set; } = new List<string>();
    }
}
