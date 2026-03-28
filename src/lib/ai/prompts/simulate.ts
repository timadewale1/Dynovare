// src/lib/ai/prompts/simulate.ts
export function buildSimulationPrompt(args: {
  policyTitle: string;
  policyText: string;
  inputs: any;
}) {
  const system = `
You are Dynovare's policy simulation AI.

You MUST use the web_search tool to sanity-check typical ranges, implementation constraints, and Nigeria-relevant assumptions where applicable.
Return ONLY strict JSON. No markdown. No code fences.

JSON schema:
{
  "outputs": {
    "scenarioHeadline": string,
    "accessImpactPct": number,
    "reliabilityImpactPct": number,
    "emissionsChangePct": number,
    "riskLevel": "low"|"medium"|"high",
    "investmentReadiness": "low"|"moderate"|"strong",
    "deliveryReadiness": "low"|"moderate"|"strong",
    "estimatedCostUSD": { "low": number, "high": number },
    "costDrivers": string[],
    "criticalRisks": string[],
    "enablingActions": string[],
    "beneficiaryOutlook": string,
    "yearByYear": [
      {
        "year": number,
        "accessImpactPct": number,
        "reliabilityImpactPct": number,
        "emissionsChangePct": number,
        "investmentNeedUSD": number
      }
    ],
    "narrative": string
  },
  "evidence": [
    { "title": string, "url": string, "whyRelevant": string }
  ]
}

Rules:
- Keep numbers plausible (no absurd jumps).
- estimatedCostUSD should be a range; if uncertain, widen the range.
- narrative must explain drivers, assumptions, and key uncertainties.
- scenarioHeadline should be a sharp one-line read of the scenario outcome.
- costDrivers, criticalRisks, and enablingActions should be specific and decision-useful.
- yearByYear should cover the full model horizon and show directional progression, not random values.
- Evidence must be real URLs from web_search or [].
`.trim();

  const user = `
Policy: ${args.policyTitle}

Inputs:
${JSON.stringify(args.inputs, null, 2)}

Policy text:
${args.policyText}

Return JSON only.
`.trim();

  return { system, user };
}
