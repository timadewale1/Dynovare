import "server-only";
import { NextResponse } from "next/server";
import { llmJSON } from "@/lib/ai/llmClient";
import { buildSectionsFromText, composePolicyText, normalizePolicySections } from "@/lib/policyEditor";

export const runtime = "nodejs";

function countWords(text: string) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function buildGenerateFromPrompt(args: {
  title: string;
  country: string;
  jurisdictionLevel: "federal" | "state";
  state?: string | null;
  policyYear?: number | null;
  sector?: string | null;
  energySource?: string | null;
  domain?: string | null;
  tags?: string[];
  targetPages?: number | null;
  goals: string;
  context?: string;
  constraints?: string;
  references?: string;
}) {
  const requestedPages = Number(args.targetPages ?? 0);
  const targetPages = Number.isFinite(requestedPages) && requestedPages > 0
    ? Math.min(100, requestedPages)
    : 12;
  const minimumWords = targetPages * 320;
  const targetWords = targetPages * 430;
  const system = `
You are Dynovare's policy drafting AI.

You MUST use the web_search tool to ground best practices, recent implementation guidance, and realistic Nigeria-relevant implementation details.
Return ONLY strict JSON.

JSON schema:
{
  "title": string,
  "summary": string,
  "draftingNotes": string[],
  "implementationChecklist": string[],
  "revisionPrompts": string[],
  "riskControls": string[],
  "sections": [
    { "title": string, "body": string }
  ],
  "evidence": [
    { "title": string, "url": string, "whyRelevant": string }
  ]
}

HARD REQUIREMENTS:
- Produce a long-form policy draft intended to be about ${targetPages} pages, at least ${minimumWords.toLocaleString()} words and ideally around ${targetWords.toLocaleString()} words.
- Use clean headings and spacing.
- Include: Executive Summary, Background, Problem Statement, Objectives, Scope and Definitions,
  Policy Measures, Implementation Plan, Roles and Responsibilities, Financing and Budget,
  Legal and Regulatory Alignment, Inclusion and Safeguards, Stakeholder Engagement,
  Monitoring and Evaluation, Risk Register, and Annexes.
- Nigeria-first realism where applicable.
- Do not put URLs inside section bodies. Put URLs only in evidence.
- Avoid fake citations. If unsure, be cautious.
- Always include a useful evidence array with real web URLs.
- draftingNotes should explain the strongest design choices in the draft.
- implementationChecklist should list concrete actions before approval or release.
- revisionPrompts should give short prompts for improving weak sections later.
- riskControls should name practical safeguards for execution.
`.trim();

  const user = `
Draft a policy using this brief:

Title: ${args.title}
Country: ${args.country}
Jurisdiction: ${args.jurisdictionLevel}
State: ${args.state ?? "N/A"}
Year: ${args.policyYear ?? "N/A"}
Sector: ${args.sector ?? "N/A"}
Energy source: ${args.energySource ?? "N/A"}
Domain: ${args.domain ?? "N/A"}
Tags: ${(args.tags ?? []).join(", ") || "N/A"}
Target pages: ${targetPages}

Goals:
${args.goals}

Context / problem:
${args.context ?? "N/A"}

Constraints:
${args.constraints ?? "N/A"}

Reference links:
${args.references ?? "N/A"}
`.trim();

  return { system, user };
}

function buildExpandDraftPrompt(args: {
  title: string;
  country: string;
  jurisdictionLevel: "federal" | "state";
  state?: string | null;
  policyYear?: number | null;
  energySource?: string | null;
  domain?: string | null;
  targetPages: number;
  targetWords: number;
  currentWords: number;
  sections: { title: string; body: string }[];
  evidence: any[];
}) {
  const system = `
You are Dynovare's policy drafting AI.

You MUST use the web_search tool to deepen and expand an existing policy draft.
Return ONLY strict JSON.

JSON schema:
{
  "summary": string,
  "sections": [
    { "title": string, "body": string }
  ],
  "evidence": [
    { "title": string, "url": string, "whyRelevant": string }
  ],
  "draftingNotes": string[],
  "implementationChecklist": string[],
  "revisionPrompts": string[],
  "riskControls": string[]
}

HARD REQUIREMENTS:
- Expand the draft substantially toward about ${args.targetPages} pages and around ${args.targetWords.toLocaleString()} words.
- The current draft is only about ${args.currentWords.toLocaleString()} words, so you must add detail, operational specificity, implementation sequencing, financing detail, institutional detail, safeguards, and monitoring detail.
- Keep the same section structure, but make each section much fuller and more publication-grade.
- Preserve Nigeria relevance.
- Do not use filler. Add useful substance.
- Do not put URLs inside section bodies. Put URLs only in evidence.
- Include at least 12 strong sections with substantial bodies.
- Keep evidence URLs real and useful.
`.trim();

  const user = `
Expand this policy draft so it is much closer to the requested document length.

Title: ${args.title}
Country: ${args.country}
Jurisdiction: ${args.jurisdictionLevel}
State: ${args.state ?? "N/A"}
Year: ${args.policyYear ?? "N/A"}
Energy source: ${args.energySource ?? "N/A"}
Domain: ${args.domain ?? "N/A"}
Requested pages: ${args.targetPages}
Requested words: ${args.targetWords}
Current words: ${args.currentWords}

Current sections:
${JSON.stringify(args.sections, null, 2)}

Current evidence:
${JSON.stringify(args.evidence ?? [], null, 2)}
`.trim();

  return { system, user };
}

function buildSectionExpansionPrompt(args: {
  title: string;
  targetPages: number;
  targetWords: number;
  currentWords: number;
  batchLabel: string;
  sections: { title: string; body: string }[];
}) {
  const sectionTarget = Math.max(700, Math.round(args.targetWords / 15));
  const system = `
You are Dynovare's policy drafting AI.

Return ONLY strict JSON.

JSON schema:
{
  "sections": [
    { "title": string, "body": string }
  ]
}

HARD REQUIREMENTS:
- Expand each provided section into a much more detailed, policy-grade section.
- The full document is targeting about ${args.targetPages} pages and about ${args.targetWords.toLocaleString()} words.
- The current full draft is only about ${args.currentWords.toLocaleString()} words, so this batch must be expanded aggressively.
- For each section in this batch, aim for roughly ${sectionTarget.toLocaleString()} or more words unless the section title naturally requires less.
- Add operational detail, implementation sequencing, financing detail, legal alignment, delivery mechanisms, institutional roles, monitoring detail, safeguards, and context where relevant.
- Keep section titles unchanged.
- Return only the expanded sections from this batch.
`.trim();

  const user = `
Policy title: ${args.title}
Batch: ${args.batchLabel}

Expand these sections substantially:
${JSON.stringify(args.sections, null, 2)}
`.trim();

  return { system, user };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const title = String(body?.title || "").trim();
    const goals = String(body?.goals || "").trim();
    const country = String(body?.country || "Nigeria").trim();
    const jurisdictionLevel = body?.jurisdictionLevel === "state" ? "state" : "federal";
    const state = jurisdictionLevel === "state" ? String(body?.state || "").trim() : null;
    const policyYear = typeof body?.policyYear === "number" ? body.policyYear : null;
    const sector = body?.sector ? String(body.sector) : null;
    const energySource = body?.energySource ? String(body.energySource) : null;
    const domain = body?.domain ? String(body.domain) : null;
    const targetPages = typeof body?.targetPages === "number" && Number.isFinite(body.targetPages) ? body.targetPages : null;
    const tags = Array.isArray(body?.tags) ? body.tags.map(String) : [];

    if (!title) return NextResponse.json({ error: "Missing title" }, { status: 400 });
    if (!goals) return NextResponse.json({ error: "Missing goals" }, { status: 400 });
    if (jurisdictionLevel === "state" && !state) {
      return NextResponse.json({ error: "Missing state" }, { status: 400 });
    }

    const { system, user } = buildGenerateFromPrompt({
      title,
      country,
      jurisdictionLevel,
      state,
      policyYear,
      sector,
      energySource,
      domain,
      tags,
      targetPages,
      goals,
      context: body?.context ? String(body.context) : "",
      constraints: body?.constraints ? String(body.constraints) : "",
      references: body?.references ? String(body.references) : "",
    });

    const out = await llmJSON<any>({
      system,
      user,
      temperature: 0.4,
      webSearch: true,
      maxOutputTokens: Math.min(32000, Math.max(10000, targetPages * 850)),
    });

    const rawGeneratedText = String(out?.generatedText || out?.draft || out?.content || "").trim();
    let sections = normalizePolicySections(out?.sections, rawGeneratedText, title);
    if ((sections.length === 0 || sections.every((section) => !section.body.trim())) && rawGeneratedText) {
      sections = buildSectionsFromText(rawGeneratedText, title);
    }

    let generatedText = composePolicyText(sections).trim();
    let evidence = Array.isArray(out?.evidence) ? out.evidence : [];
    let guidance = {
      draftingNotes: Array.isArray(out?.draftingNotes) ? out.draftingNotes : [],
      implementationChecklist: Array.isArray(out?.implementationChecklist) ? out.implementationChecklist : [],
      revisionPrompts: Array.isArray(out?.revisionPrompts) ? out.revisionPrompts : [],
      riskControls: Array.isArray(out?.riskControls) ? out.riskControls : [],
    };

    const currentWords = countWords(generatedText);
    const requestedPages = Math.max(5, Math.min(100, Number(targetPages ?? 12)));
    const requestedWords = requestedPages * 430;

    if (currentWords < requestedWords * 0.72) {
      const expandPrompt = buildExpandDraftPrompt({
        title,
        country,
        jurisdictionLevel,
        state,
        policyYear,
        energySource,
        domain,
        targetPages: requestedPages,
        targetWords: requestedWords,
        currentWords,
        sections: sections.map((section) => ({ title: section.title, body: section.body })),
        evidence,
      });

      const expanded = await llmJSON<any>({
        system: expandPrompt.system,
        user: expandPrompt.user,
        temperature: 0.35,
        webSearch: true,
        maxOutputTokens: Math.min(32000, Math.max(12000, requestedPages * 950)),
      });

      const expandedSections = normalizePolicySections(expanded?.sections, generatedText, title);
      const expandedText = composePolicyText(expandedSections).trim();

      if (countWords(expandedText) > currentWords) {
        sections = expandedSections;
        generatedText = expandedText;
        evidence = Array.isArray(expanded?.evidence) && expanded.evidence.length > 0 ? expanded.evidence : evidence;
        guidance = {
          draftingNotes: Array.isArray(expanded?.draftingNotes) ? expanded.draftingNotes : guidance.draftingNotes,
          implementationChecklist: Array.isArray(expanded?.implementationChecklist) ? expanded.implementationChecklist : guidance.implementationChecklist,
          revisionPrompts: Array.isArray(expanded?.revisionPrompts) ? expanded.revisionPrompts : guidance.revisionPrompts,
          riskControls: Array.isArray(expanded?.riskControls) ? expanded.riskControls : guidance.riskControls,
        };
      }
    }

    let expandedWords = countWords(generatedText);
    if (expandedWords < requestedWords * 0.88 && sections.length > 0) {
      const batchSize = 5;
      const rebuiltSections = [...sections];

      for (let start = 0; start < rebuiltSections.length; start += batchSize) {
        if (expandedWords >= requestedWords * 0.94) break;

        const batch = rebuiltSections.slice(start, start + batchSize);
        const batchPrompt = buildSectionExpansionPrompt({
          title,
          targetPages: requestedPages,
          targetWords: requestedWords,
          currentWords: expandedWords,
          batchLabel: `sections ${start + 1}-${Math.min(start + batchSize, rebuiltSections.length)}`,
          sections: batch.map((section) => ({ title: section.title, body: section.body })),
        });

        const batchOut = await llmJSON<any>({
          system: batchPrompt.system,
          user: batchPrompt.user,
          temperature: 0.35,
          webSearch: false,
          maxOutputTokens: 18000,
        });

        const expandedBatch = normalizePolicySections(batchOut?.sections, composePolicyText(batch), title);
        if (expandedBatch.length === batch.length) {
          for (let i = 0; i < expandedBatch.length; i += 1) {
            if (countWords(expandedBatch[i].body) > countWords(rebuiltSections[start + i].body)) {
              rebuiltSections[start + i] = {
                ...rebuiltSections[start + i],
                body: expandedBatch[i].body,
              };
            }
          }
          sections = rebuiltSections;
          generatedText = composePolicyText(sections).trim();
          expandedWords = countWords(generatedText);
        }
      }
    }

    const hasUsableStructure = sections.filter((section) => section.body.trim()).length >= 6;
    const hasUsableText = generatedText.length >= 1200;

    if (!hasUsableStructure || !hasUsableText) {
      return NextResponse.json({ error: "Generated text too short", code: "TEXT_TOO_SHORT" }, { status: 400 });
    }

    return NextResponse.json({
      title: out?.title ?? title,
      summary: String(out?.summary || "").trim(),
      sections,
      generatedText,
      evidence,
      guidance,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "AI generate-from-prompt failed" }, { status: 500 });
  }
}
