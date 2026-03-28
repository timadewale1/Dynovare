export type PolicySection = {
  id: string;
  title: string;
  body: string;
};

export type PolicyEvidence = {
  title: string;
  url: string;
  whyRelevant?: string;
};

const DEFAULT_SECTION_TITLES = [
  "Executive Summary",
  "Background",
  "Problem Statement",
  "Objectives",
  "Scope and Definitions",
  "Policy Measures",
  "Implementation Plan",
  "Roles and Responsibilities",
  "Financing and Budget",
  "Legal and Regulatory Alignment",
  "Inclusion, Equity, and Safeguards",
  "Stakeholder Engagement",
  "Monitoring and Evaluation",
  "Risk Register",
  "Annexes",
];

function toSectionId(value: string, fallbackIndex: number) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || `section-${fallbackIndex + 1}`;
}

export function summarizePolicyText(text: string, fallbackTitle?: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return fallbackTitle ? `${fallbackTitle} policy draft.` : "";
  return clean.length > 220 ? `${clean.slice(0, 217).trim()}...` : clean;
}

export function composePolicyText(sections: PolicySection[]) {
  return sections
    .map((section) => `${section.title}\n\n${section.body.trim()}`)
    .join("\n\n");
}

export function normalizePolicySections(
  input: Array<Partial<PolicySection>> | null | undefined,
  fallbackText = "",
  fallbackTitle?: string
) {
  const sections = Array.isArray(input)
    ? input
        .map((section, index) => ({
          id: String(section?.id || toSectionId(String(section?.title || ""), index)),
          title: String(section?.title || `Section ${index + 1}`).trim(),
          body: String(section?.body || "").trim(),
        }))
        .filter((section) => section.title && section.body)
    : [];

  if (sections.length > 0) return sections;
  return buildSectionsFromText(fallbackText, fallbackTitle);
}

export function buildSectionsFromText(text: string, fallbackTitle?: string) {
  const clean = String(text || "").replace(/\r/g, "").trim();
  if (!clean) {
    return DEFAULT_SECTION_TITLES.slice(0, 4).map((title, index) => ({
      id: toSectionId(title, index),
      title,
      body: "",
    }));
  }

  const parts = clean
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  const sections: PolicySection[] = [];
  let currentTitle = fallbackTitle ? `${fallbackTitle} Overview` : "Overview";
  let currentBody: string[] = [];

  const pushSection = () => {
    const body = currentBody.join("\n\n").trim();
    if (!body) return;
    sections.push({
      id: toSectionId(currentTitle, sections.length),
      title: currentTitle,
      body,
    });
  };

  for (const part of parts) {
    const lines = part.split("\n").map((line) => line.trim()).filter(Boolean);
    const firstLine = lines[0] || "";
    const isHeading =
      lines.length > 1 &&
      firstLine.length <= 80 &&
      /^[A-Z0-9][A-Za-z0-9 ,/&()-:]+$/.test(firstLine);

    if (isHeading) {
      pushSection();
      currentTitle = firstLine;
      currentBody = [lines.slice(1).join("\n")];
      continue;
    }

    currentBody.push(part);
  }

  pushSection();

  if (sections.length > 1) return sections;

  const chunkSize = Math.max(3, Math.ceil(parts.length / DEFAULT_SECTION_TITLES.length));
  const chunked: PolicySection[] = [];

  for (let index = 0; index < parts.length; index += chunkSize) {
    const title = DEFAULT_SECTION_TITLES[chunked.length] || `Section ${chunked.length + 1}`;
    chunked.push({
      id: toSectionId(title, chunked.length),
      title,
      body: parts.slice(index, index + chunkSize).join("\n\n"),
    });
  }

  return chunked;
}
