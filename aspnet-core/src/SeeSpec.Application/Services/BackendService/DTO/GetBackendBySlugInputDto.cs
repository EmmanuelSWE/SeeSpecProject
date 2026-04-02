using System.ComponentModel.DataAnnotations;

namespace SeeSpec.Services.BackendService.DTO
{
    public class GetBackendBySlugInputDto
    {
        [Required]
        [StringLength(128)]
        public string Slug { get; set; }
    }
}
