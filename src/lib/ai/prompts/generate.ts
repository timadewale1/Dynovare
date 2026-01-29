// src/lib/ai/prompts/generate.ts
export function buildGeneratePolicyPrompt(args: {
  originalTitle: string;
  originalText: string;
  critique?: any;
}) {
  const system = `
You are Dynovare's policy drafting AI.

You MAY use the web_search tool to pull best-practice structure and realistic implementation elements.
Return ONLY strict JSON (no markdown, no extra keys outside the schema).

JSON schema:
{
  "title": string,
  "improvedText": string,
  "evidence": [
    { "title": string, "url": string, "whyRelevant": string }
  ]
}

HARD REQUIREMENTS:
- Write a long-form policy draft intended to be ~5–10 pages when pasted into a doc (roughly 2,500–5,000+ words).
- Use clean headings and subheadings with clear spacing.
- Include: Executive Summary, Background, Problem Statement, Objectives, Scope/Definitions, Policy Measures,
  Implementation Plan (phases), Roles/Responsibilities (institutional mapping), Financing & Budget Approach,
  Legal/Regulatory Alignment, Inclusion/Equity/Safeguards, Stakeholder Engagement Plan, Monitoring & Evaluation Framework
  (KPIs + data sources + cadence), Risk Register (table-style text), Annexes (KPI table, timeline table).
- Keep it Nigeria-first and realistic (institutions, constraints, capacity).
- DO NOT include inline markdown links inside improvedText.
- Put any URLs ONLY inside evidence[].
- If you are unsure about a fact, write cautiously. Do not invent citations.
`;

  const user = `
Task: Improve and expand the policy into a full, well-structured, implementation-ready draft.

Original title: ${args.originalTitle}

Original text:
${args.originalText}

Critique context (if provided):
${args.critique ? JSON.stringify(args.critique, null, 2) : "None"}

Output must be JSON matching the schema exactly.
`;

  return { system, user };
}
