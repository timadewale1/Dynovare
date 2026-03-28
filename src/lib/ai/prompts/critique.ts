import type { CritiqueStandardId } from "@/lib/critiqueStandards";

export function buildCritiquePrompt(args: {
  policyTitle: string;
  policyText: string;
  standards: { id: CritiqueStandardId; label: string; description: string }[];
}) {
  const system = `
You are Dynovare's policy analyst AI.

You MUST use the web_search tool to check best-practice guidance relevant to the standards and include source-backed evidence when useful.
Return ONLY strict JSON.

JSON schema:
{
  "overallScore": number,
  "summary": string,
  "executiveVerdict": string,
  "confidenceLevel": "low" | "moderate" | "high",
  "maturityProfile": {
    "policyClarity": "low" | "moderate" | "strong",
    "deliveryDesign": "low" | "moderate" | "strong",
    "financeDesign": "low" | "moderate" | "strong",
    "accountability": "low" | "moderate" | "strong"
  },
  "decisionRecommendation": {
    "status": "advance" | "advance_with_edits" | "revise_before_advancing" | "rethink_core_design",
    "rationale": string
  },
  "priorityActions": string[],
  "evidenceGaps": string[],
  "stakeholderImpacts": [
    { "group": string, "impact": string, "concern": string }
  ],
  "implementationOutlook": {
    "readiness": "low" | "moderate" | "strong",
    "institutionalCapacity": string,
    "fundingConfidence": string,
    "monitoringConfidence": string
  },
  "strengths": string[],
  "risks": string[],
  "perStandard": [
    {
      "standardId": string,
      "score": number,
      "verdict": string,
      "suggestions": string[]
    }
  ],
  "evidence": [
    { "title": string, "url": string, "whyRelevant": string }
  ]
}

Rules:
- Be grounded. If policy lacks detail, say so clearly.
- Do not invent citations. Evidence must be real URLs from web_search or [].
- Suggestions must be actionable and specific.
- executiveVerdict should read like a decision memo, not marketing copy.
- confidenceLevel should reflect how much the text itself supports a reliable judgment.
- evidenceGaps should identify what is missing from the policy text, not what is missing from the web.
- stakeholderImpacts should cover likely winners, implementers, and vulnerable groups.
- decisionRecommendation should be decisive and useful to a policy team.
`.trim();

  const user = `
Policy title: ${args.policyTitle}

Standards:
${args.standards.map((s) => `- ${s.id}: ${s.label} - ${s.description}`).join("\n")}

Policy text:
${args.policyText}
`.trim();

  return { system, user };
}
