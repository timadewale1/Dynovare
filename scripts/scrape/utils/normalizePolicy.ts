import { inferSector } from "./sectorMap";

export function normalizeIEAPolicy(raw: {
  title: string;
  summary: string;
  url: string;
  year?: number;
  fullText: string;
}) {
  return {
    title: raw.title.trim(),
    summary: raw.summary.trim(),
    country: "Nigeria",
    jurisdictionLevel: "federal" as const,
    state: "Federal",
    policyYear: raw.year ?? null,
    tags: ["iea", "energy", inferSector(raw.title + " " + raw.summary)],
    sector: inferSector(raw.title + " " + raw.summary),
    source: {
      publisher: "International Energy Agency (IEA)",
      url: raw.url,
      licenseNote:
        "Scraped from IEA public policy repository. Text extracted where PDF download is restricted.",
    },
    contentText: raw.fullText,
  };
}
