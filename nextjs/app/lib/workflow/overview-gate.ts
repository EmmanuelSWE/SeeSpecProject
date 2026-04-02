import type { SpecSectionDto } from "@/app/lib/utils/services/spec-section-service";

export function selectOverviewSection(sections: SpecSectionDto[], backendSlug?: string | null) {
  const preferredSlug = backendSlug ? `${backendSlug}-overview` : null;

  return (
    sections.find((item) => item.type === "overview" && preferredSlug !== null && item.slug === preferredSlug) ??
    sections.find((item) => item.type === "overview" && item.slug === "overview") ??
    sections.find((item) => item.type === "overview") ??
    null
  );
}

export function hasOverviewChanged(
  overviewSection: SpecSectionDto | null,
  nextContent: [string, string, string]
) {
  if (!overviewSection) {
    return true;
  }

  const currentContent: [string, string, string] = [
    overviewSection.content[0] ?? overviewSection.summary ?? "",
    overviewSection.content[1] ?? "",
    overviewSection.content[2] ?? ""
  ];

  return currentContent.some((value, index) => value !== nextContent[index]);
}
