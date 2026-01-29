import type { CritiqueStandardId } from "@/lib/critiqueStandards";

export function buildCritiquePrompt(args: {
  policyTitle: string;
  policyText: string;
  standards: { id: CritiqueStandardId; label: string; description: string }[];
}) {
  const system = `
You are Dynovare's policy analyst AI.
You MAY use the web_search tool to gather context (Nigeria-first when relevant).
Return ONLY strict JSON. No markdown. No extra text.

If you used web_search, include "evidence" with up to 5 sources.

JSON schema:
{
  "overallScore": number (0-100),
  "summary": string (2-4 sentences),
  "strengths": string[] (3-6),
  "risks": string[] (3-6),
  "perStandard": [
    { "standardId": string, "score": number (0-100), "suggestions": string[] (3-6) }
  ],
  "evidence": [
    { "title": string, "url": string, "whyRelevant": string }
  ]
}
`;

  const user = `
Policy title: ${args.policyTitle}

Standards:
${args.standards.map((s) => `- ${s.id}: ${s.label} — ${s.description}`).join("\n")}

Policy text:
${args.policyText}
`;

  return { system, user };
}
