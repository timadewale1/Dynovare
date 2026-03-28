import "server-only";
import { NextResponse } from "next/server";
import { llmJSON } from "@/lib/ai/llmClient";
import { buildGeneratePolicyPrompt } from "@/lib/ai/prompts/generate";
import { composePolicyText, normalizePolicySections } from "@/lib/policyEditor";
import { resolvePolicyForAction } from "@/lib/policyStoreAdmin";

export const runtime = "nodejs";

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

    const { system, user } = buildGeneratePolicyPrompt({
      originalTitle: policy.title ?? "Untitled policy",
      originalText,
      critique,
    });

    const out = await llmJSON<any>({
      system,
      user,
      temperature: 0.35,
      webSearch: true,
      maxOutputTokens: 9000,
    });

    const sections = normalizePolicySections(out?.sections, "", policy.title ?? "Untitled policy");
    const improvedText = composePolicyText(sections).trim();
    if (improvedText.length < 2500) {
      return NextResponse.json({ error: "Generated text too short", code: "TEXT_TOO_SHORT" }, { status: 400 });
    }

    return NextResponse.json({
      title: out?.title ?? policy.title ?? "Untitled policy",
      summary: String(out?.summary || "").trim(),
      sections,
      improvedText,
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
    return NextResponse.json({ error: e?.message ?? "AI generation failed" }, { status: 500 });
  }
}
