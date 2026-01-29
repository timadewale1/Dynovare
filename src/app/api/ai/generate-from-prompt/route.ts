import "server-only";
import { NextResponse } from "next/server";
import { llmJSON } from "@/lib/ai/llmClient";

export const runtime = "nodejs";

function buildGenerateFromPrompt(args: {
  title: string;
  country: string;
  jurisdictionLevel: "federal" | "state";
  state?: string | null;
  policyYear?: number | null;
  sector?: string | null;
  tags?: string[];
  goals: string;
  context?: string;
  constraints?: string;
  references?: string;
}) {
  const system = `
You are Dynovare's policy drafting AI.
You MAY use the web_search tool to ground best practices + realistic implementation details.
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
- Write a complete policy with headings, roles/responsibilities, financing, implementation plan, and monitoring metrics.
- Nigeria-first realism when applicable.
- Avoid fake citations. If unsure, be cautious.
`;

  const user = `
Draft a policy using this brief:

Title: ${args.title}
Country: ${args.country}
Jurisdiction: ${args.jurisdictionLevel}
State: ${args.state ?? "N/A"}
Year: ${args.policyYear ?? "N/A"}
Sector: ${args.sector ?? "N/A"}
Tags: ${(args.tags ?? []).join(", ") || "N/A"}

Goals (must address):
${args.goals}

Context / problem:
${args.context ?? "N/A"}

Constraints:
${args.constraints ?? "N/A"}

Reference links (optional):
${args.references ?? "N/A"}

Output must be the JSON schema exactly.
`;
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

    const policyYear =
      typeof body?.policyYear === "number" ? body.policyYear : null;

    const sector = body?.sector ? String(body.sector) : null;

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
      tags,
      goals,
      context: body?.context ? String(body.context) : "",
      constraints: body?.constraints ? String(body.constraints) : "",
      references: body?.references ? String(body.references) : "",
    });

    const out = await llmJSON<any>({
      system,
      user,
      temperature: 0.45,
      webSearch: true, // ✅
    });

    const improvedText = String(out?.improvedText || "").trim();
    if (improvedText.length < 200) {
      return NextResponse.json(
        { error: "Generated text too short", code: "TEXT_TOO_SHORT" },
        { status: 400 }
      );
    }

    return NextResponse.json(out);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "AI generate-from-prompt failed" }, { status: 500 });
  }
}
