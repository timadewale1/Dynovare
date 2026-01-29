export function buildGeneratePolicyPrompt(args: {
  originalTitle: string;
  originalText: string;
  critique?: any;
}) {
  const system = `
You are Dynovare's policy drafting AI.
You MAY use the web_search tool to bring in best-practice structure + realistic implementation elements.
Return ONLY strict JSON.

JSON schema:
{
  "title": string,
  "improvedText": string,
  "evidence": [
    { "title": string, "url": string, "whyRelevant": string }
  ]
}

Rules:
- Produce a complete improved policy text with headings, implementation plan, and monitoring metrics.
- Keep it realistic and internally consistent.
`;

  const user = `
Original title: ${args.originalTitle}

Original text:
${args.originalText}

Critique context (if provided):
${args.critique ? JSON.stringify(args.critique, null, 2) : "None"}
`;

  return { system, user };
}
