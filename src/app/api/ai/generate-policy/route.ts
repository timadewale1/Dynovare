import "server-only";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { llmJSON } from "@/lib/ai/llmClient";
import { buildGeneratePolicyPrompt } from "@/lib/ai/prompts/generate";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const policyId = String(body?.policyId || "");
    const critique = body?.critique ?? null;

    if (!policyId) {
      return NextResponse.json({ error: "Missing policyId" }, { status: 400 });
    }

    const snap = await adminDb.collection("policies").doc(policyId).get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    const policy = snap.data() as any;
    const originalText = String(policy?.contentText || "").trim();

    if (originalText.length < 120) {
      return NextResponse.json(
        { error: "Policy text too short", code: "TEXT_TOO_SHORT" },
        { status: 400 }
      );
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

    const improvedText = String(out?.improvedText || "").trim();
    if (improvedText.length < 2500) {
      return NextResponse.json(
        { error: "Generated text too short", code: "TEXT_TOO_SHORT" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      title: out?.title ?? policy.title ?? "Untitled policy",
      improvedText,
      evidence: Array.isArray(out?.evidence) ? out.evidence : [],
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message ?? "AI generation failed" },
      { status: 500 }
    );
  }
}
