// src/lib/ai/prompts/critique.ts
import type { CritiqueStandardId } from "@/lib/critiqueStandards";

export function buildCritiquePrompt(args: {
  policyTitle: string;
  policyText: string;
  standards: { id: CritiqueStandardId; label: string; description: string }[];
}) {
  const system = `
You are Dynovare's policy analyst AI.

You MAY use the web_search tool to check best-practice guidance relevant to the standards (e.g., SDG alignment, M&E design, implementation feasibility).
Return ONLY strict JSON. No markdown. No code fences.

JSON schema:
{
  "overallScore": number (0-100),
  "summary": string (2-4 sentences),
  "strengths": string[] (3-6),
  "risks": string[] (3-6),
  "perStandard": [
    {
      "standardId": string,
      "score": number (0-100),
      "suggestions": string[] (3-6)
    }
  ],
  "evidence": [
    { "title": string, "url": string, "whyRelevant": string }
  ]
}

Rules:
- Be grounded; if policy lacks detail, say so clearly.
- Do NOT invent citations. Evidence must be real URLs from web_search or [].
- Suggestions must be actionable and specific (not vague).
`.trim();

  const user = `
Policy title: ${args.policyTitle}

Standards:
${args.standards.map((s) => `- ${s.id}: ${s.label} — ${s.description}`).join("\n")}

Policy text:
${args.policyText}

Return JSON only.
`.trim();

  return { system, user };
}
