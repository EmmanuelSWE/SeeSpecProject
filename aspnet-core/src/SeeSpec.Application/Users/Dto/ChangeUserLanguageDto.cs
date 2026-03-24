using System.ComponentModel.DataAnnotations;

namespace SeeSpec.Users.Dto
{
    public class ChangeUserLanguageDto
    {
        [Required]
        public string LanguageName { get; set; }
    }
}