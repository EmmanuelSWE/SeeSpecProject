using System;
using System.IO;
using Abp.Dependency;
using SeeSpec.Services.AIGenerationService.DTO;

namespace SeeSpec.Services.AIGenerationService
{
    public class GenerationStandardsEnforcementService : IGenerationStandardsEnforcementService, ITransientDependency
    {
        private const string GenericArchitectureTemplate = "00_Generic_Backend_Architecture_Standards_Template.md";
        private const string DomainModelingTemplate = "01_Domain_Modeling_Template.md";
        private const string ApplicationServicesTemplate = "02_Application_Services_Use_Case_Template.md";
        private const string ValidationTemplate = "06_Validation_Enforcement_Template.md";

        public GenerationStandardsValidationResultDto Validate(
            GenerationArtifactType artifactType,
            string targetFilePath,
            string generatedContent)
        {
            GenerationStandardsValidationResultDto result = new GenerationStandardsValidationResultDto
            {
                IsValid = true
            };

            if (string.IsNullOrWhiteSpace(targetFilePath))
            {
                AddError(result, "Target file path is required.");
                return result;
            }

            if (string.IsNullOrWhiteSpace(generatedContent))
            {
                AddError(result, "Generated content cannot be empty.");
                return result;
            }

            string fileName = Path.GetFileName(targetFilePath) ?? string.Empty;
            string typeName = Path.GetFileNameWithoutExtension(targetFilePath) ?? string.Empty;
            string normalizedPath = targetFilePath.Replace(Path.AltDirectorySeparatorChar, Path.DirectorySeparatorChar);

            // Templates are rule sources, not injected output. These checks encode the deterministic
            // folder, naming, and file-shape constraints required by the backend template set.
            ValidateCommonCSharpShape(result, generatedContent, typeName);

            switch (artifactType)
            {
                case GenerationArtifactType.AppServiceInterface:
                    ValidatePathContains(result, normalizedPath, "Services", GenericArchitectureTemplate);
                    ValidateFileName(result, fileName, "I", "AppService.cs", ApplicationServicesTemplate);
                    RequireContains(result, generatedContent, string.Format("interface {0}", typeName), ApplicationServicesTemplate);
                    RequireContains(result, generatedContent, "IApplicationService", ApplicationServicesTemplate);
                    break;

                case GenerationArtifactType.AppServiceClass:
                    ValidatePathContains(result, normalizedPath, "Services", GenericArchitectureTemplate);
                    ValidateFileName(result, fileName, string.Empty, "AppService.cs", ApplicationServicesTemplate);
                    RequireContains(result, generatedContent, string.Format("class {0}", typeName), ApplicationServicesTemplate);
                    RequireContains(result, generatedContent, string.Format("I{0}", typeName), ApplicationServicesTemplate);
                    RequireContains(result, generatedContent, "AppService", ApplicationServicesTemplate);
                    break;

                case GenerationArtifactType.Dto:
                    ValidatePathContains(result, normalizedPath, "Dto", ApplicationServicesTemplate);
                    ValidateFileName(result, fileName, string.Empty, "Dto.cs", ApplicationServicesTemplate);
                    RequireContains(result, generatedContent, typeName, ApplicationServicesTemplate);
                    break;

                case GenerationArtifactType.Repository:
                    ValidatePathContains(result, normalizedPath, "Repositories", GenericArchitectureTemplate);
                    ValidateFileName(result, fileName, string.Empty, "Repository.cs", GenericArchitectureTemplate);
                    RequireContains(result, generatedContent, typeName, GenericArchitectureTemplate);
                    RequireContains(result, generatedContent, "Repository", GenericArchitectureTemplate);
                    break;

                case GenerationArtifactType.DomainEntity:
                    ValidatePathContains(result, normalizedPath, "Domain", DomainModelingTemplate);
                    RequireContains(result, generatedContent, string.Format("class {0}", typeName), DomainModelingTemplate);
                    RejectContains(result, typeName, "Dto", DomainModelingTemplate);
                    RejectContains(result, typeName, "AppService", DomainModelingTemplate);
                    break;

                case GenerationArtifactType.PermissionSeed:
                    ValidatePathContains(result, normalizedPath, "Authorization", GenericArchitectureTemplate);
                    ValidateFileName(result, fileName, string.Empty, "AuthorizationProvider.cs", GenericArchitectureTemplate);
                    RequireContains(result, generatedContent, typeName, GenericArchitectureTemplate);
                    RequireContains(result, generatedContent, "Authorization", GenericArchitectureTemplate);
                    break;

                default:
                    AddError(result, "Unsupported generation artifact type for standards enforcement.");
                    break;
            }

            if (!ContainsIgnoreCase(generatedContent, "namespace "))
            {
                AddError(result, string.Format(
                    "{0} requires an explicit namespace declaration.",
                    ValidationTemplate));
            }

            return result;
        }

        private static void ValidateCommonCSharpShape(
            GenerationStandardsValidationResultDto result,
            string generatedContent,
            string typeName)
        {
            if (!ContainsIgnoreCase(generatedContent, "public "))
            {
                AddError(result, string.Format(
                    "{0} requires explicit public type visibility.",
                    GenericArchitectureTemplate));
            }

            if (!ContainsIgnoreCase(generatedContent, typeName))
            {
                AddError(result, string.Format(
                    "{0} requires the generated file to declare a type matching the file name `{1}`.",
                    GenericArchitectureTemplate,
                    typeName));
            }
        }

        private static void ValidatePathContains(
            GenerationStandardsValidationResultDto result,
            string normalizedPath,
            string requiredSegment,
            string templateName)
        {
            string marker = Path.DirectorySeparatorChar + requiredSegment + Path.DirectorySeparatorChar;
            if (!normalizedPath.Contains(marker, StringComparison.OrdinalIgnoreCase)
                && !normalizedPath.EndsWith(Path.DirectorySeparatorChar + requiredSegment, StringComparison.OrdinalIgnoreCase))
            {
                AddError(result, string.Format(
                    "{0} requires this artifact to live under a `{1}` folder.",
                    templateName,
                    requiredSegment));
            }
        }

        private static void ValidateFileName(
            GenerationStandardsValidationResultDto result,
            string fileName,
            string requiredPrefix,
            string requiredSuffix,
            string templateName)
        {
            if (!string.IsNullOrEmpty(requiredPrefix) && !fileName.StartsWith(requiredPrefix, StringComparison.Ordinal))
            {
                AddError(result, string.Format(
                    "{0} requires the file name `{1}` to start with `{2}`.",
                    templateName,
                    fileName,
                    requiredPrefix));
            }

            if (!fileName.EndsWith(requiredSuffix, StringComparison.Ordinal))
            {
                AddError(result, string.Format(
                    "{0} requires the file name `{1}` to end with `{2}`.",
                    templateName,
                    fileName,
                    requiredSuffix));
            }
        }

        private static void RequireContains(
            GenerationStandardsValidationResultDto result,
            string generatedContent,
            string expectedFragment,
            string templateName)
        {
            if (!ContainsIgnoreCase(generatedContent, expectedFragment))
            {
                AddError(result, string.Format(
                    "{0} requires generated content to include `{1}`.",
                    templateName,
                    expectedFragment));
            }
        }

        private static void RejectContains(
            GenerationStandardsValidationResultDto result,
            string value,
            string forbiddenFragment,
            string templateName)
        {
            if (value.Contains(forbiddenFragment, StringComparison.OrdinalIgnoreCase))
            {
                AddError(result, string.Format(
                    "{0} forbids domain artifact names that include `{1}`.",
                    templateName,
                    forbiddenFragment));
            }
        }

        private static bool ContainsIgnoreCase(string value, string expectedFragment)
        {
            return value?.IndexOf(expectedFragment, StringComparison.OrdinalIgnoreCase) >= 0;
        }

        private static void AddError(GenerationStandardsValidationResultDto result, string error)
        {
            result.IsValid = false;
            result.Errors.Add(error);
        }
    }
}
