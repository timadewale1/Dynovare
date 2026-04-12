import "server-only";
import { NextResponse } from "next/server";
import { llmJSON } from "@/lib/ai/llmClient";
import { buildGeneratePolicyPrompt } from "@/lib/ai/prompts/generate";
import { composePolicyText, normalizePolicySections } from "@/lib/policyEditor";
import { resolvePolicyForAction } from "@/lib/policyStoreAdmin";

export const runtime = "nodejs";

function countWords(text: string) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function buildExpandImprovedPolicyPrompt(args: {
  title: string;
  originalWordCount: number;
  minimumWords: number;
  targetWords: number;
  currentWords: number;
  sections: { title: string; body: string }[];
  critique?: any;
  evidence: any[];
}) {
  const system = `
You are Dynovare's policy drafting AI.

You MUST use the web_search tool to deepen and expand an improved policy draft.
Return ONLY strict JSON.

JSON schema:
{
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
- The original policy was about ${args.originalWordCount.toLocaleString()} words.
- The improved draft must be at least ${args.minimumWords.toLocaleString()} words and should aim for about ${args.targetWords.toLocaleString()} words.
- The current draft is only about ${args.currentWords.toLocaleString()} words, so you must expand it substantially.
- Keep the improved section structure, but add materially more implementation detail, financing detail, sequencing, legal alignment, delivery detail, safeguards, stakeholder handling, monitoring design, and annex depth.
- Do not use filler. Add useful, publication-grade substance.
- Do not put URLs in section bodies. Put URLs only in evidence.
- Keep the policy Nigeria-relevant and critique-responsive.
`.trim();

  const user = `
Expand this improved policy draft so it is at least as substantial as the original and closer to the requested target length.

Title: ${args.title}
Original words: ${args.originalWordCount}
Required minimum words: ${args.minimumWords}
Target words: ${args.targetWords}
Current words: ${args.currentWords}

Critique context:
${JSON.stringify(args.critique ?? null, null, 2)}

Current sections:
${JSON.stringify(args.sections, null, 2)}

Current evidence:
${JSON.stringify(args.evidence ?? [], null, 2)}
`.trim();

  return { system, user };
}

function buildSectionExpansionPrompt(args: {
  title: string;
  minimumWords: number;
  targetWords: number;
  currentWords: number;
  batchLabel: string;
  sections: { title: string; body: string }[];
}) {
  const sectionTarget = Math.max(900, Math.round(args.targetWords / Math.max(8, args.sections.length * 2)));
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
- The improved draft still needs to reach at least ${args.minimumWords.toLocaleString()} words and is currently only about ${args.currentWords.toLocaleString()} words.
- Expand every section in this batch aggressively while keeping section titles unchanged.
- Each section should gain more concrete policy substance, especially implementation sequencing, financing, legal alignment, delivery design, safeguards, monitoring, stakeholder management, and annex detail where relevant.
- Aim for roughly ${sectionTarget.toLocaleString()} words or more for each section in this batch unless the section naturally needs a little less.
- Do not use filler text.
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
    const policyId = String(body?.policyId || "");
    const ownerUid = String(body?.ownerUid || "").trim() || null;
    const critique = body?.critique ?? null;

    if (!policyId) {
      return NextResponse.json({ error: "Missing policyId" }, { status: 400 });
    }

    const resolved = await resolvePolicyForAction({ ownerUid, policyId });
    if (!resolved) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    const policy = resolved.policy;
    const originalText = String(policy?.contentText || "").trim();
    if (originalText.length < 120) {
      return NextResponse.json({ error: "Policy text too short", code: "TEXT_TOO_SHORT" }, { status: 400 });
    }

    const originalSections = normalizePolicySections(
      Array.isArray(policy?.editorSections) ? policy.editorSections : [],
      originalText,
      policy.title ?? "Untitled policy"
    );
    const originalWordCount = countWords(originalText);
    const minimumWords = Math.max(1800, Math.round(originalWordCount * 1.02));
    const targetWords = Math.max(minimumWords + 500, Math.round(originalWordCount * 1.18));

    const { system, user } = buildGeneratePolicyPrompt({
      originalTitle: policy.title ?? "Untitled policy",
      originalText,
      originalSections: originalSections.map((section) => ({ title: section.title, body: section.body })),
      originalWordCount,
      minimumWords,
      targetWords,
      critique,
    });

    const out = await llmJSON<any>({
      system,
      user,
      temperature: 0.35,
      webSearch: true,
      maxOutputTokens: Math.min(32000, Math.max(12000, Math.round(targetWords * 1.9))),
    });

    let sections = normalizePolicySections(out?.sections, originalText, policy.title ?? "Untitled policy");
    let improvedText = composePolicyText(sections).trim();
    let evidence = Array.isArray(out?.evidence) ? out.evidence : [];
    let guidance = {
      draftingNotes: Array.isArray(out?.draftingNotes) ? out.draftingNotes : [],
      implementationChecklist: Array.isArray(out?.implementationChecklist) ? out.implementationChecklist : [],
      revisionPrompts: Array.isArray(out?.revisionPrompts) ? out.revisionPrompts : [],
      riskControls: Array.isArray(out?.riskControls) ? out.riskControls : [],
    };

    let improvedWordCount = countWords(improvedText);

    if (improvedWordCount < minimumWords * 0.92) {
      const expandPrompt = buildExpandImprovedPolicyPrompt({
        title: policy.title ?? "Untitled policy",
        originalWordCount,
        minimumWords,
        targetWords,
        currentWords: improvedWordCount,
        sections: sections.map((section) => ({ title: section.title, body: section.body })),
        critique,
        evidence,
      });

      const expanded = await llmJSON<any>({
        system: expandPrompt.system,
        user: expandPrompt.user,
        temperature: 0.32,
        webSearch: true,
        maxOutputTokens: Math.min(32000, Math.max(14000, Math.round(targetWords * 2.05))),
      });

      const expandedSections = normalizePolicySections(expanded?.sections, improvedText, policy.title ?? "Untitled policy");
      const expandedText = composePolicyText(expandedSections).trim();
      const expandedWords = countWords(expandedText);

      if (expandedWords > improvedWordCount) {
        sections = expandedSections;
        improvedText = expandedText;
        improvedWordCount = expandedWords;
        evidence = Array.isArray(expanded?.evidence) && expanded.evidence.length > 0 ? expanded.evidence : evidence;
        guidance = {
          draftingNotes: Array.isArray(expanded?.draftingNotes) ? expanded.draftingNotes : guidance.draftingNotes,
          implementationChecklist: Array.isArray(expanded?.implementationChecklist)
            ? expanded.implementationChecklist
            : guidance.implementationChecklist,
          revisionPrompts: Array.isArray(expanded?.revisionPrompts) ? expanded.revisionPrompts : guidance.revisionPrompts,
          riskControls: Array.isArray(expanded?.riskControls) ? expanded.riskControls : guidance.riskControls,
        };
      }
    }

    if (improvedWordCount < minimumWords && sections.length > 0) {
      const rebuiltSections = [...sections];
      const batchSize = 4;

      for (let start = 0; start < rebuiltSections.length; start += batchSize) {
        if (improvedWordCount >= minimumWords) break;

        const batch = rebuiltSections.slice(start, start + batchSize);
        const batchPrompt = buildSectionExpansionPrompt({
          title: policy.title ?? "Untitled policy",
          minimumWords,
          targetWords,
          currentWords: improvedWordCount,
          batchLabel: `sections ${start + 1}-${Math.min(start + batchSize, rebuiltSections.length)}`,
          sections: batch.map((section) => ({ title: section.title, body: section.body })),
        });

        const batchOut = await llmJSON<any>({
          system: batchPrompt.system,
          user: batchPrompt.user,
          temperature: 0.3,
          webSearch: false,
          maxOutputTokens: 22000,
        });

        const expandedBatch = normalizePolicySections(batchOut?.sections, composePolicyText(batch), policy.title ?? "Untitled policy");

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
          improvedText = composePolicyText(sections).trim();
          improvedWordCount = countWords(improvedText);
        }
      }
    }

    const usableSections = sections.filter((section) => section.body.trim()).length;
    if (usableSections < Math.min(8, Math.max(6, originalSections.length - 1)) || improvedWordCount < Math.round(originalWordCount * 0.98)) {
      return NextResponse.json({ error: "Generated text too short", code: "TEXT_TOO_SHORT" }, { status: 400 });
    }

    return NextResponse.json({
      title: out?.title ?? policy.title ?? "Untitled policy",
      summary: String(out?.summary || "").trim(),
      sections,
      improvedText,
      evidence,
      guidance,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "AI generation failed" }, { status: 500 });
  }
}
