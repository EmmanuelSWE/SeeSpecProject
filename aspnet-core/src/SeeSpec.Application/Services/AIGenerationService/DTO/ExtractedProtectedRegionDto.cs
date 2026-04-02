namespace SeeSpec.Services.AIGenerationService.DTO
{
    public class ExtractedProtectedRegionDto
    {
        public string Name { get; set; }

        public string Content { get; set; }

        public int StartIndex { get; set; }

        public int EndIndex { get; set; }
    }
}
