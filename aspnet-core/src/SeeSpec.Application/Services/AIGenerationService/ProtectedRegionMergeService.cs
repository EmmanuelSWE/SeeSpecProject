using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Abp.Dependency;
using SeeSpec.Services.AIGenerationService.DTO;

namespace SeeSpec.Services.AIGenerationService
{
    public class ProtectedRegionMergeService : IProtectedRegionMergeService, ITransientDependency
    {
        public ProtectedRegionExtractionResultDto Extract(
            string existingContent,
            string targetFilePath,
            IReadOnlyList<ProtectedRegionDefinitionDto> protectedRegions)
        {
            if (string.IsNullOrWhiteSpace(targetFilePath))
            {
                throw new ArgumentException("Target file path is required for protected-region extraction.");
            }

            ProtectedRegionExtractionResultDto result = new ProtectedRegionExtractionResultDto
            {
                TargetFilePath = targetFilePath
            };

            if (string.IsNullOrEmpty(existingContent) || protectedRegions == null || protectedRegions.Count == 0)
            {
                return result;
            }

            foreach (ProtectedRegionDefinitionDto region in protectedRegions)
            {
                RegionParseResult parseResult = ParseRegion(existingContent, region);
                if (parseResult.ExtractedRegion != null)
                {
                    result.HasProtectedRegions = true;
                    result.Regions.Add(parseResult.ExtractedRegion);
                }

                if (parseResult.MalformedRegion != null)
                {
                    result.HasMalformedRegions = true;
                    result.MalformedRegions.Add(parseResult.MalformedRegion);
                }
            }

            return result;
        }

        public ProtectedRegionMergeResultDto Reinject(
            string generatedContent,
            string targetFilePath,
            IReadOnlyList<ProtectedRegionDefinitionDto> protectedRegions,
            ProtectedRegionExtractionResultDto extractionResult)
        {
            if (string.IsNullOrWhiteSpace(targetFilePath))
            {
                throw new ArgumentException("Target file path is required for protected-region reinjection.");
            }

            if (generatedContent == null)
            {
                throw new ArgumentException("Generated content is required for protected-region reinjection.");
            }

            ProtectedRegionMergeResultDto result = new ProtectedRegionMergeResultDto
            {
                TargetFilePath = targetFilePath,
                MergedContent = generatedContent,
                ProtectedRegionsReinjected = false
            };

            if (protectedRegions == null || protectedRegions.Count == 0 || extractionResult?.Regions.Count == 0)
            {
                return result;
            }

            string mergedContent = generatedContent;
            foreach (ExtractedProtectedRegionDto preservedRegion in extractionResult.Regions.OrderByDescending(item => item.StartIndex))
            {
                ProtectedRegionDefinitionDto regionDefinition = protectedRegions.FirstOrDefault(item => item.Name == preservedRegion.Name);
                if (regionDefinition == null)
                {
                    continue;
                }

                int generatedStart = mergedContent.IndexOf(regionDefinition.StartMarker, StringComparison.Ordinal);
                int generatedEnd = mergedContent.IndexOf(regionDefinition.EndMarker, StringComparison.Ordinal);
                if (generatedStart < 0 || generatedEnd < 0 || generatedEnd < generatedStart)
                {
                    result.HasConsistencyErrors = true;
                    result.MissingRegionNames.Add(preservedRegion.Name);
                    continue;
                }

                int replaceStart = generatedStart + regionDefinition.StartMarker.Length;
                mergedContent = mergedContent.Substring(0, replaceStart)
                    + preservedRegion.Content
                    + mergedContent.Substring(generatedEnd);
                result.ProtectedRegionsReinjected = true;
            }

            result.MergedContent = mergedContent;
            return result;
        }

        public ProtectedRegionMergeResultDto AppendConflictedManualCode(
            string generatedContent,
            string targetFilePath,
            ProtectedRegionExtractionResultDto extractionResult)
        {
            if (string.IsNullOrWhiteSpace(targetFilePath))
            {
                throw new ArgumentException("Target file path is required for conflicted protected-region preservation.");
            }

            if (generatedContent == null)
            {
                throw new ArgumentException("Generated content is required for conflicted protected-region preservation.");
            }

            ProtectedRegionMergeResultDto result = new ProtectedRegionMergeResultDto
            {
                TargetFilePath = targetFilePath,
                MergedContent = generatedContent
            };

            if (extractionResult?.MalformedRegions == null || extractionResult.MalformedRegions.Count == 0)
            {
                return result;
            }

            string conflictBlock = BuildConflictPreservationBlock(extractionResult.MalformedRegions);
            if (string.IsNullOrWhiteSpace(conflictBlock))
            {
                return result;
            }

            result.MergedContent = string.Concat(generatedContent.TrimEnd(), Environment.NewLine, Environment.NewLine, conflictBlock);
            result.ConflictedManualCodeAppended = true;
            return result;
        }

        private static RegionParseResult ParseRegion(
            string existingContent,
            ProtectedRegionDefinitionDto region)
        {
            int firstStartIndex = existingContent.IndexOf(region.StartMarker, StringComparison.Ordinal);
            int secondStartIndex = firstStartIndex < 0
                ? -1
                : existingContent.IndexOf(region.StartMarker, firstStartIndex + region.StartMarker.Length, StringComparison.Ordinal);
            int firstEndIndex = existingContent.IndexOf(region.EndMarker, StringComparison.Ordinal);
            int secondEndIndex = firstEndIndex < 0
                ? -1
                : existingContent.IndexOf(region.EndMarker, firstEndIndex + region.EndMarker.Length, StringComparison.Ordinal);

            if (firstStartIndex < 0 && firstEndIndex < 0)
            {
                return new RegionParseResult();
            }

            if (firstStartIndex >= 0 && secondStartIndex < 0 && firstEndIndex >= 0 && secondEndIndex < 0)
            {
                int contentStart = firstStartIndex + region.StartMarker.Length;
                if (firstEndIndex >= contentStart)
                {
                    return new RegionParseResult
                    {
                        ExtractedRegion = new ExtractedProtectedRegionDto
                        {
                            Name = region.Name,
                            Content = existingContent.Substring(contentStart, firstEndIndex - contentStart),
                            StartIndex = firstStartIndex,
                            EndIndex = firstEndIndex
                        }
                    };
                }
            }

            int recoveredStart = firstStartIndex >= 0 ? firstStartIndex + region.StartMarker.Length : 0;
            int recoveredEnd = firstEndIndex >= recoveredStart && firstEndIndex >= 0
                ? firstEndIndex
                : existingContent.Length;
            string recoveredContent = recoveredEnd >= recoveredStart
                ? existingContent.Substring(recoveredStart, recoveredEnd - recoveredStart).Trim('\r', '\n')
                : string.Empty;

            string failureReason = firstStartIndex < 0
                ? "Protected region end marker exists without a matching start marker."
                : firstEndIndex < 0
                    ? "Protected region start marker exists without a matching end marker."
                    : secondStartIndex >= 0 || secondEndIndex >= 0
                        ? "Protected region markers appear multiple times."
                        : "Protected region markers are out of order.";

            return new RegionParseResult
            {
                MalformedRegion = new MalformedProtectedRegionDto
                {
                    Name = region.Name,
                    FailureReason = failureReason,
                    RecoveredContent = recoveredContent
                }
            };
        }

        private static string BuildConflictPreservationBlock(IEnumerable<MalformedProtectedRegionDto> malformedRegions)
        {
            StringBuilder builder = new StringBuilder();
            builder.AppendLine("/* =========================================================");
            builder.AppendLine("   PRESERVED MANUAL CODE (CONFLICTED REGION)");
            builder.AppendLine("   ---------------------------------------------------------");
            builder.AppendLine("   This code was preserved because protected regions were");
            builder.AppendLine("   malformed and the user declined automatic repair.");
            builder.AppendLine();
            builder.AppendLine("   Review and manually reintegrate if needed.");
            builder.AppendLine("   ========================================================= */");
            builder.AppendLine();

            bool hasContent = false;
            foreach (MalformedProtectedRegionDto malformedRegion in malformedRegions)
            {
                if (string.IsNullOrWhiteSpace(malformedRegion.RecoveredContent))
                {
                    continue;
                }

                hasContent = true;
                builder.AppendLine(string.Format("    // region: {0}", malformedRegion.Name));
                foreach (string line in malformedRegion.RecoveredContent.Replace("\r\n", "\n").Split('\n'))
                {
                    builder.AppendLine(string.Format("    {0}", line));
                }

                builder.AppendLine();
            }

            return hasContent ? builder.ToString().TrimEnd() : string.Empty;
        }

        private class RegionParseResult
        {
            public ExtractedProtectedRegionDto ExtractedRegion { get; set; }

            public MalformedProtectedRegionDto MalformedRegion { get; set; }
        }
    }
}
