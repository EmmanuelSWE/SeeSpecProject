using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using Abp.Dependency;
using SeeSpec.Services.AIGenerationService.DTO;

namespace SeeSpec.Services.AIGenerationService
{
    public class GenerationArtifactSkeletonService : IGenerationArtifactSkeletonService, ITransientDependency
    {
        public string BuildSkeleton(
            GenerationArtifactType artifactType,
            string targetFilePath,
            string projectPath,
            string projectName,
            IReadOnlyList<ProtectedRegionDefinitionDto> protectedRegions)
        {
            string typeName = Path.GetFileNameWithoutExtension(targetFilePath) ?? "GeneratedArtifact";
            string namespaceName = BuildNamespace(targetFilePath, projectPath, projectName);

            return artifactType switch
            {
                GenerationArtifactType.AppServiceInterface => BuildAppServiceInterface(typeName, namespaceName, protectedRegions),
                GenerationArtifactType.AppServiceClass => BuildAppServiceClass(typeName, namespaceName, protectedRegions),
                GenerationArtifactType.Dto => BuildDto(typeName, namespaceName, protectedRegions),
                GenerationArtifactType.Repository => BuildRepository(typeName, namespaceName, protectedRegions),
                GenerationArtifactType.DomainEntity => BuildDomainEntity(typeName, namespaceName, protectedRegions),
                GenerationArtifactType.PermissionSeed => BuildPermissionSeed(typeName, namespaceName, protectedRegions),
                _ => throw new ArgumentException("A supported artifact type is required for skeleton generation.")
            };
        }

        private static string BuildAppServiceInterface(
            string typeName,
            string namespaceName,
            IReadOnlyList<ProtectedRegionDefinitionDto> protectedRegions)
        {
            StringBuilder builder = new StringBuilder();
            builder.AppendLine("using Abp.Application.Services;");
            builder.AppendLine();
            AppendUsingsRegion(builder, protectedRegions);
            builder.AppendLine($"namespace {namespaceName};");
            builder.AppendLine();
            builder.AppendLine($"public interface {typeName} : IApplicationService");
            builder.AppendLine("{");
            AppendRegionBlock(builder, protectedRegions, "custom-interface-members", 1);
            builder.AppendLine("}");
            return builder.ToString();
        }

        private static string BuildAppServiceClass(
            string typeName,
            string namespaceName,
            IReadOnlyList<ProtectedRegionDefinitionDto> protectedRegions)
        {
            string interfaceName = BuildInterfaceName(typeName);
            StringBuilder builder = new StringBuilder();
            builder.AppendLine("using System.Threading.Tasks;");
            builder.AppendLine();
            AppendUsingsRegion(builder, protectedRegions);
            builder.AppendLine($"namespace {namespaceName};");
            builder.AppendLine();
            builder.AppendLine($"public class {typeName} : {interfaceName}");
            builder.AppendLine("{");
            AppendRegionBlock(builder, protectedRegions, "custom-members", 1);
            builder.AppendLine();
            AppendRegionBlock(builder, protectedRegions, "custom-methods", 1);
            builder.AppendLine("}");
            return builder.ToString();
        }

        private static string BuildDto(
            string typeName,
            string namespaceName,
            IReadOnlyList<ProtectedRegionDefinitionDto> protectedRegions)
        {
            StringBuilder builder = new StringBuilder();
            AppendUsingsRegion(builder, protectedRegions);
            builder.AppendLine($"namespace {namespaceName};");
            builder.AppendLine();
            builder.AppendLine($"public class {typeName}");
            builder.AppendLine("{");
            AppendRegionBlock(builder, protectedRegions, "custom-members", 1);
            builder.AppendLine("}");
            return builder.ToString();
        }

        private static string BuildRepository(
            string typeName,
            string namespaceName,
            IReadOnlyList<ProtectedRegionDefinitionDto> protectedRegions)
        {
            StringBuilder builder = new StringBuilder();
            builder.AppendLine("using System;");
            builder.AppendLine();
            AppendUsingsRegion(builder, protectedRegions);
            builder.AppendLine($"namespace {namespaceName};");
            builder.AppendLine();
            builder.AppendLine($"public class {typeName}");
            builder.AppendLine("{");
            AppendRegionBlock(builder, protectedRegions, "custom-members", 1);
            builder.AppendLine();
            AppendRegionBlock(builder, protectedRegions, "custom-methods", 1);
            builder.AppendLine("}");
            return builder.ToString();
        }

        private static string BuildDomainEntity(
            string typeName,
            string namespaceName,
            IReadOnlyList<ProtectedRegionDefinitionDto> protectedRegions)
        {
            StringBuilder builder = new StringBuilder();
            builder.AppendLine("using System;");
            builder.AppendLine();
            AppendUsingsRegion(builder, protectedRegions);
            builder.AppendLine($"namespace {namespaceName};");
            builder.AppendLine();
            builder.AppendLine($"public class {typeName}");
            builder.AppendLine("{");
            AppendRegionBlock(builder, protectedRegions, "custom-members", 1);
            builder.AppendLine();
            AppendRegionBlock(builder, protectedRegions, "custom-methods", 1);
            builder.AppendLine("}");
            return builder.ToString();
        }

        private static string BuildPermissionSeed(
            string typeName,
            string namespaceName,
            IReadOnlyList<ProtectedRegionDefinitionDto> protectedRegions)
        {
            StringBuilder builder = new StringBuilder();
            builder.AppendLine("using System;");
            builder.AppendLine();
            AppendUsingsRegion(builder, protectedRegions);
            builder.AppendLine($"namespace {namespaceName};");
            builder.AppendLine();
            builder.AppendLine($"public class {typeName}");
            builder.AppendLine("{");
            AppendRegionBlock(builder, protectedRegions, "custom-members", 1);
            builder.AppendLine();
            builder.AppendLine("    public void Configure()");
            builder.AppendLine("    {");
            AppendRegionBlock(builder, protectedRegions, "custom-methods", 2);
            builder.AppendLine("    }");
            builder.AppendLine("}");
            return builder.ToString();
        }

        private static void AppendUsingsRegion(
            StringBuilder builder,
            IReadOnlyList<ProtectedRegionDefinitionDto> protectedRegions)
        {
            ProtectedRegionDefinitionDto usingRegion = protectedRegions.FirstOrDefault(region => region.Name == "custom-usings");
            if (usingRegion == null)
            {
                return;
            }

            builder.AppendLine(usingRegion.StartMarker);
            builder.AppendLine(usingRegion.EndMarker);
            builder.AppendLine();
        }

        private static void AppendRegionBlock(
            StringBuilder builder,
            IReadOnlyList<ProtectedRegionDefinitionDto> protectedRegions,
            string regionName,
            int indentLevel)
        {
            ProtectedRegionDefinitionDto region = protectedRegions.FirstOrDefault(item => item.Name == regionName);
            if (region == null)
            {
                return;
            }

            string indent = new string(' ', indentLevel * 4);
            builder.AppendLine(indent + region.StartMarker);
            builder.AppendLine(indent + region.EndMarker);
        }

        private static string BuildNamespace(string targetFilePath, string projectPath, string projectName)
        {
            string rootProjectName = (projectName ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(rootProjectName))
            {
                rootProjectName = "GeneratedProject";
            }

            string projectDirectory = Path.GetDirectoryName(projectPath ?? string.Empty) ?? string.Empty;
            string targetDirectory = Path.GetDirectoryName(targetFilePath ?? string.Empty) ?? string.Empty;
            if (string.IsNullOrWhiteSpace(projectDirectory) || string.IsNullOrWhiteSpace(targetDirectory))
            {
                return rootProjectName;
            }

            string relativePath = Path.GetRelativePath(projectDirectory, targetDirectory);
            if (string.IsNullOrWhiteSpace(relativePath) || relativePath == ".")
            {
                return rootProjectName;
            }

            IEnumerable<string> parts = relativePath
                .Split(new[] { Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar }, StringSplitOptions.RemoveEmptyEntries)
                .Select(NormalizeNamespaceSegment)
                .Where(segment => !string.IsNullOrWhiteSpace(segment));

            string suffix = string.Join(".", parts);
            return string.IsNullOrWhiteSpace(suffix) ? rootProjectName : string.Format("{0}.{1}", rootProjectName, suffix);
        }

        private static string NormalizeNamespaceSegment(string segment)
        {
            StringBuilder builder = new StringBuilder(segment.Length);
            foreach (char character in segment)
            {
                if (char.IsLetterOrDigit(character) || character == '_')
                {
                    builder.Append(character);
                }
            }

            if (builder.Length == 0)
            {
                return string.Empty;
            }

            if (char.IsDigit(builder[0]))
            {
                builder.Insert(0, '_');
            }

            return builder.ToString();
        }

        private static string BuildInterfaceName(string typeName)
        {
            return typeName.StartsWith("I", StringComparison.Ordinal) ? typeName : string.Format("I{0}", typeName);
        }
    }
}
