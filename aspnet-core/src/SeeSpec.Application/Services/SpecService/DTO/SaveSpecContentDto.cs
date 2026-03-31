using System;
using System.ComponentModel.DataAnnotations;
using SeeSpec.Domains.SpecManagement;

namespace SeeSpec.Services.SpecService.DTO
{
    public class SaveSpecContentDto
    {
        [Required]
        public Guid SpecId { get; set; }

        public Guid? SpecSectionId { get; set; }

        [Required]
        [StringLength(64)]
        public string InputType { get; set; }

        public DiagramType? DiagramType { get; set; }

        [StringLength(256)]
        public string Title { get; set; }

        [StringLength(128)]
        public string Slug { get; set; }

        public int? Order { get; set; }

        [Required]
        public string Content { get; set; }
    }
}
