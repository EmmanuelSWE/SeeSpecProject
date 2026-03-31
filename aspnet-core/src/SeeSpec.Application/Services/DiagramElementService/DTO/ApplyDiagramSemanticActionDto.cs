using System;
using System.ComponentModel.DataAnnotations;

namespace SeeSpec.Services.DiagramElementService.DTO
{
    public class ApplyDiagramSemanticActionDto
    {
        public Guid DiagramElementId { get; set; }

        [Required]
        [StringLength(64)]
        public string ActionType { get; set; }

        [Required]
        [StringLength(64)]
        public string TargetKind { get; set; }

        [StringLength(128)]
        public string TargetId { get; set; }

        [StringLength(128)]
        public string RelatedId { get; set; }

        [StringLength(4000)]
        public string Value { get; set; }

        [StringLength(64)]
        public string NodeType { get; set; }

        [StringLength(64)]
        public string EdgeType { get; set; }

        [StringLength(64)]
        public string MemberKind { get; set; }
    }
}
