using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Abp.Dependency;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SeeSpec.Services.SpecService.DTO;

namespace SeeSpec.Services.PromptBuilderService
{
    public class SpecPromptBuilder : ITransientDependency, ISpecPromptBuilder
    {
        public string BuildPrompt(AssembledSpecDto spec)
        {
            if (spec == null)
            {
                throw new ArgumentException("A canonical spec payload is required.");
            }

            IReadOnlyList<AssembledSpecSectionDto> orderedSections = (spec.Sections ?? Array.Empty<AssembledSpecSectionDto>())
                .OrderBy(section => section.Order)
                .ThenBy(section => section.Id)
                .ToList();

            var builder = new StringBuilder();
            builder.AppendLine("GENERATION INSTRUCTIONS");
            builder.AppendLine("Generate code only for the target backend/system described by this specification.");
            builder.AppendLine("Do not use SeeSpec product names, namespaces, comments, base classes, DTO names, or implementation details unless they already exist in the uploaded backend itself.");
            builder.AppendLine("Use the specification's domain language and backend context as the source of truth.");
            builder.AppendLine();
            builder.AppendLine("SPECIFICATION CONTEXT");
            builder.AppendLine(string.Format("SpecId: {0}", spec.Id));
            builder.AppendLine(string.Format("BackendId: {0}", spec.BackendId));
            builder.AppendLine(string.Format("Title: {0}", spec.Title ?? string.Empty));
            builder.AppendLine(string.Format("Version: {0}", spec.Version ?? string.Empty));
            builder.AppendLine(string.Format("Status: {0}", spec.Status));
            builder.AppendLine();

            // Prompt building is deterministic and contains no AI logic. It only projects the
            // canonical Spec -> SpecSection -> SectionItem structure into stable plain text.
            foreach (AssembledSpecSectionDto section in orderedSections)
            {
                AppendSection(builder, section);
            }

            return builder.ToString().TrimEnd();
        }

        private static void AppendSection(StringBuilder builder, AssembledSpecSectionDto section)
        {
            builder.AppendLine("SECTION");
            builder.AppendLine(string.Format("SectionId: {0}", section.Id));
            builder.AppendLine(string.Format("Order: {0}", section.Order));
            builder.AppendLine(string.Format("Title: {0}", section.Title ?? string.Empty));
            builder.AppendLine(string.Format("Slug: {0}", section.Slug ?? string.Empty));
            builder.AppendLine(string.Format("InputType: {0}", section.InputType ?? string.Empty));
            builder.AppendLine(string.Format("SectionType: {0}", section.SectionType));
            builder.AppendLine(string.Format("OwnerRole: {0}", section.OwnerRole));
            builder.AppendLine(string.Format("Version: {0}", section.Version));
            builder.AppendLine(string.Format("DiagramType: {0}", section.DiagramType?.ToString() ?? string.Empty));
            builder.AppendLine(string.Format("Dependencies: {0}", JoinIds(section.DependencySectionIds)));

            IReadOnlyList<AssembledSectionItemDto> orderedItems = (section.Items ?? Array.Empty<AssembledSectionItemDto>())
                .OrderBy(item => item.Position)
                .ThenBy(item => item.Id)
                .ToList();

            foreach (AssembledSectionItemDto item in orderedItems)
            {
                AppendItem(builder, item);
            }

            builder.AppendLine();
        }

        private static void AppendItem(StringBuilder builder, AssembledSectionItemDto item)
        {
            builder.AppendLine("ITEM");
            builder.AppendLine(string.Format("ItemId: {0}", item.Id));
            builder.AppendLine(string.Format("Position: {0}", item.Position));
            builder.AppendLine(string.Format("Label: {0}", item.Label ?? string.Empty));
            builder.AppendLine(string.Format("ItemType: {0}", item.ItemType));
            builder.AppendLine("Content:");
            builder.AppendLine(NormalizeContent(item.Content));
        }

        private static string JoinIds(IReadOnlyList<Guid> ids)
        {
            if (ids == null || ids.Count == 0)
            {
                return string.Empty;
            }

            return string.Join(", ", ids.OrderBy(id => id));
        }

        private static string NormalizeContent(JToken content)
        {
            if (content == null || content.Type == JTokenType.Null)
            {
                return string.Empty;
            }

            JToken normalized = NormalizeToken(content);
            return normalized.Type == JTokenType.String
                ? normalized.Value<string>() ?? string.Empty
                : normalized.ToString(Formatting.None);
        }

        private static JToken NormalizeToken(JToken token)
        {
            switch (token.Type)
            {
                case JTokenType.Object:
                    var sourceObject = (JObject)token;
                    var normalizedObject = new JObject();

                    foreach (JProperty property in sourceObject.Properties().OrderBy(property => property.Name, StringComparer.Ordinal))
                    {
                        normalizedObject[property.Name] = NormalizeToken(property.Value);
                    }

                    return normalizedObject;
                case JTokenType.Array:
                    var sourceArray = (JArray)token;
                    var normalizedArray = new JArray();

                    foreach (JToken arrayItem in sourceArray)
                    {
                        normalizedArray.Add(NormalizeToken(arrayItem));
                    }

                    return normalizedArray;
                default:
                    return token.DeepClone();
            }
        }
    }
}
