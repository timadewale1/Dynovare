import "server-only";
import { NextResponse } from "next/server";
import { llmJSON } from "@/lib/ai/llmClient";
import { composePolicyText, normalizePolicySections } from "@/lib/policyEditor";

export const runtime = "nodejs";

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
  const targetPages = Math.max(5, Math.min(30, Number(args.targetPages ?? 12)));
  const minimumWords = targetPages * 380;
  const targetWords = targetPages * 470;
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
    const targetPages = typeof body?.targetPages === "number" ? body.targetPages : 12;
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
      maxOutputTokens: Math.min(18000, Math.max(9000, targetPages * 650)),
    });

    const sections = normalizePolicySections(out?.sections, "", title);
    const generatedText = composePolicyText(sections).trim();
    if (generatedText.length < Math.max(2500, targetPages * 1200)) {
      return NextResponse.json({ error: "Generated text too short", code: "TEXT_TOO_SHORT" }, { status: 400 });
    }

    return NextResponse.json({
      title: out?.title ?? title,
      summary: String(out?.summary || "").trim(),
      sections,
      generatedText,
      evidence: Array.isArray(out?.evidence) ? out.evidence : [],
      guidance: {
        draftingNotes: Array.isArray(out?.draftingNotes) ? out.draftingNotes : [],
        implementationChecklist: Array.isArray(out?.implementationChecklist) ? out.implementationChecklist : [],
        revisionPrompts: Array.isArray(out?.revisionPrompts) ? out.revisionPrompts : [],
        riskControls: Array.isArray(out?.riskControls) ? out.riskControls : [],
      },
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "AI generate-from-prompt failed" }, { status: 500 });
  }
}
