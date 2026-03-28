import "server-only";
import { NextResponse } from "next/server";
import { llmJSON } from "@/lib/ai/llmClient";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sectionTitle = String(body?.sectionTitle || "").trim();
    const sectionBody = String(body?.sectionBody || "").trim();
    const policyTitle = String(body?.policyTitle || "Untitled policy").trim();
    const instructions = String(body?.instructions || "").trim();

    if (!sectionTitle || !sectionBody || !instructions) {
      return NextResponse.json({ error: "Missing sectionTitle, sectionBody, or instructions" }, { status: 400 });
    }

    const system = `
You are Dynovare's policy drafting AI.
Return ONLY strict JSON.

JSON schema:
{
  "title": string,
  "body": string,
  "changeSummary": string
}

Rules:
- Preserve the section's role within a serious policy document.
- Follow the user's edit instruction exactly.
- Improve clarity, structure, and implementation realism.
- Do not add URLs.
`.trim();

    const user = `
Policy title: ${policyTitle}
Section title: ${sectionTitle}

Current section:
${sectionBody}

User instruction:
${instructions}
`.trim();

    const out = await llmJSON<any>({
      system,
      user,
      temperature: 0.35,
      webSearch: true,
      maxOutputTokens: 2500,
    });

    const revisedBody = String(out?.body || "").trim();
    if (revisedBody.length < 80) {
      return NextResponse.json({ error: "Revised section was too short" }, { status: 400 });
    }

    return NextResponse.json({
      title: String(out?.title || sectionTitle).trim() || sectionTitle,
      body: revisedBody,
      changeSummary: String(out?.changeSummary || "").trim(),
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "AI section revision failed" }, { status: 500 });
  }
}
