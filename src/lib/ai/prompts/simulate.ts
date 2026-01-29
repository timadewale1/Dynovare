export function buildSimulationPrompt(args: {
  policyTitle: string;
  policyText: string;
  inputs: any;
}) {
  const system = `
You are Dynovare's policy simulation AI.
You MAY use the web_search tool to calibrate plausible ranges (Nigeria-first when relevant).
Return ONLY strict JSON. No markdown.

JSON schema:
{
  "outputs": {
    "accessImpactPct": number,
    "reliabilityImpactPct": number,
    "emissionsChangePct": number,
    "riskLevel": "low"|"medium"|"high",
    "estimatedCostUSD": { "low": number, "high": number },
    "narrative": string
  },
  "evidence": [
    { "title": string, "url": string, "whyRelevant": string }
  ]
}

Rules:
- Keep numbers plausible.
- If uncertainty is high, reflect it in narrative and riskLevel.
`;

  const user = `
Policy: ${args.policyTitle}

Inputs:
${JSON.stringify(args.inputs, null, 2)}

Policy text:
${args.policyText}
`;

  return { system, user };
}
