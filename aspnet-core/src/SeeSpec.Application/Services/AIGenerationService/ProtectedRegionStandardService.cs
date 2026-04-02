using System;
using System.Collections.Generic;
using Abp.Dependency;
using SeeSpec.Services.AIGenerationService.DTO;

namespace SeeSpec.Services.AIGenerationService
{
    public class ProtectedRegionStandardService : IProtectedRegionStandardService, ITransientDependency
    {
        private static readonly IReadOnlyList<string> InterfaceRegionNames = new[]
        {
            "custom-usings",
            "custom-interface-members"
        };

        private static readonly IReadOnlyList<string> StructuredTypeRegionNames = new[]
        {
            "custom-usings",
            "custom-members",
            "custom-methods"
        };

        private static readonly IReadOnlyList<string> DtoRegionNames = new[]
        {
            "custom-usings",
            "custom-members"
        };

        public IReadOnlyList<ProtectedRegionDefinitionDto> GetRegions(GenerationArtifactType artifactType, string targetFilePath)
        {
            if (string.IsNullOrWhiteSpace(targetFilePath))
            {
                throw new ArgumentException("Target file path is required to resolve deterministic protected regions.");
            }

            IReadOnlyList<string> regionNames = artifactType switch
            {
                GenerationArtifactType.AppServiceInterface => InterfaceRegionNames,
                GenerationArtifactType.Dto => DtoRegionNames,
                GenerationArtifactType.AppServiceClass => StructuredTypeRegionNames,
                GenerationArtifactType.Repository => StructuredTypeRegionNames,
                GenerationArtifactType.DomainEntity => StructuredTypeRegionNames,
                GenerationArtifactType.PermissionSeed => StructuredTypeRegionNames,
                _ => Array.Empty<string>()
            };

            List<ProtectedRegionDefinitionDto> regions = new List<ProtectedRegionDefinitionDto>();
            foreach (string regionName in regionNames)
            {
                regions.Add(new ProtectedRegionDefinitionDto
                {
                    Name = regionName,
                    StartMarker = BuildStartMarker(regionName),
                    EndMarker = BuildEndMarker(regionName),
                    Language = "csharp",
                    IsManualOwnedRegion = true,
                    GeneratorOwnedAreas = BuildGeneratorOwnedAreas(artifactType)
                });
            }

            return regions;
        }

        public string BuildStartMarker(string regionName)
        {
            string normalizedName = NormalizeRegionName(regionName);
            return $"// <protected-region name=\"{normalizedName}\">";
        }

        public string BuildEndMarker(string regionName)
        {
            string normalizedName = NormalizeRegionName(regionName);
            return $"// </protected-region name=\"{normalizedName}\">";
        }

        private static string NormalizeRegionName(string regionName)
        {
            if (string.IsNullOrWhiteSpace(regionName))
            {
                throw new ArgumentException("Protected region name is required.");
            }

            return regionName.Trim().ToLowerInvariant();
        }

        private static List<string> BuildGeneratorOwnedAreas(GenerationArtifactType artifactType)
        {
            List<string> ownedAreas = new List<string>
            {
                "file-structure",
                "type-signature",
                "generated-imports"
            };

            switch (artifactType)
            {
                case GenerationArtifactType.Dto:
                    ownedAreas.Add("generated-dto-fields");
                    break;
                case GenerationArtifactType.AppServiceInterface:
                    ownedAreas.Add("generated-interface-signatures");
                    break;
                case GenerationArtifactType.AppServiceClass:
                    ownedAreas.Add("generated-service-methods");
                    break;
                case GenerationArtifactType.Repository:
                    ownedAreas.Add("generated-repository-members");
                    break;
                case GenerationArtifactType.DomainEntity:
                    ownedAreas.Add("generated-domain-members");
                    break;
                case GenerationArtifactType.PermissionSeed:
                    ownedAreas.Add("generated-seed-members");
                    break;
            }

            return ownedAreas;
        }
    }
}
