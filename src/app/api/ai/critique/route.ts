import "server-only";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { llmJSON } from "@/lib/ai/llmClient";
import { buildCritiquePrompt } from "@/lib/ai/prompts/critique";
import { CRITIQUE_STANDARDS } from "@/lib/critiqueStandards";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const policyId = String(body?.policyId || "");
    const selectedStandards = Array.isArray(body?.selectedStandards)
      ? body.selectedStandards
      : [];

    if (!policyId)
      return NextResponse.json({ error: "Missing policyId" }, { status: 400 });
    if (selectedStandards.length === 0)
      return NextResponse.json({ error: "No standards selected" }, { status: 400 });

    const snap = await adminDb.collection("policies").doc(policyId).get();
    if (!snap.exists)
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });

    const policy = snap.data() as any;
    const policyText = String(policy?.contentText || "").trim();

    if (policyText.length < 120) {
      return NextResponse.json(
        { error: "Policy text too short", code: "TEXT_TOO_SHORT" },
        { status: 400 }
      );
    }

    const standards = CRITIQUE_STANDARDS
      .filter((s) => selectedStandards.includes(s.id))
      .map((s) => ({ id: s.id, label: s.label, description: s.description }));

    const { system, user } = buildCritiquePrompt({
      policyTitle: policy.title ?? "Untitled policy",
      policyText,
      standards,
    });

    const out = await llmJSON<any>({
      system,
      user,
      temperature: 0.2,
      webSearch: true,
    });

    return NextResponse.json(out);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message ?? "AI critique failed" },
      { status: 500 }
    );
  }
}
