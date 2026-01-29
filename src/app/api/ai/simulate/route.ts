import "server-only";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { llmJSON } from "@/lib/ai/llmClient";
import { buildSimulationPrompt } from "@/lib/ai/prompts/simulate";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const policyId = String(body?.policyId || "");
    const inputs = body?.inputs ?? null;

    if (!policyId || !inputs) {
      return NextResponse.json({ error: "Missing policyId or inputs" }, { status: 400 });
    }

    const snap = await adminDb.collection("policies").doc(policyId).get();
    if (!snap.exists) return NextResponse.json({ error: "Policy not found" }, { status: 404 });

    const policy = snap.data() as any;
    const policyText = String(policy?.contentText || "").trim();

    if (policyText.length < 120) {
      return NextResponse.json(
        { error: "Policy text too short", code: "TEXT_TOO_SHORT" },
        { status: 400 }
      );
    }

    const { system, user } = buildSimulationPrompt({
      policyTitle: policy.title ?? "Untitled policy",
      policyText,
      inputs,
    });

    const out = await llmJSON<any>({
      system,
      user,
      temperature: 0.25,
      webSearch: true, // ✅
    });

    return NextResponse.json(out);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "AI simulation failed" }, { status: 500 });
  }
}
