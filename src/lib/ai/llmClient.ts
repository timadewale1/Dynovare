// src/lib/ai/llmClient.ts
import "server-only";
import { getOpenAI, getDefaultModel } from "@/lib/ai/openai";

function stripCodeFences(s: string) {
  const t = (s || "").trim();
  // Remove ```json ... ``` or ``` ... ```
  if (t.startsWith("```")) {
    return t.replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
  }
  return t;
}

async function repairToJsonObject(openai: any, model: string, raw: string) {
  const res = await openai.responses.create({
    model,
    temperature: 0,
    // Force JSON object in repair step
    text: { format: { type: "json_object" } },
    input: [
      {
        role: "system",
        content:
          "You are a JSON repair tool. Return ONLY a valid JSON object. No markdown. No commentary.",
      },
      {
        role: "user",
        content: `Fix this into a single valid JSON object that preserves all fields and text as much as possible:\n\n${raw}`,
      },
    ],
    max_output_tokens: 1200,
  });

  const fixed = (res.output_text || "").trim();
  const cleaned = stripCodeFences(fixed);

  return JSON.parse(cleaned);
}

export async function llmJSON<T>(args: {
  system: string;
  user: string;
  model?: string;
  temperature?: number;

  // allow OpenAI web_search tool
  webSearch?: boolean;

  // IMPORTANT: default high for long policy drafts
  maxOutputTokens?: number;
}): Promise<T> {
  const model = args.model ?? getDefaultModel();
  const openai = getOpenAI();

  const tools = args.webSearch ? [{ type: "web_search" as const }] : undefined;

  // The Responses API does not allow `json_object` output format when using
  // certain tools (e.g. web_search). If `webSearch` is requested, omit the
  // forced JSON mode for the initial call and fall back to a JSON repair
  // pass if needed (the repair call uses JSON mode but does not include
  // tools).
  const textParam = args.webSearch
    ? undefined
    : ({ format: { type: "json_object" } } as const);

  const res = await openai.responses.create({
    model,
    temperature: args.temperature ?? 0.2,
    tools,
    ...(textParam ? { text: textParam } : {}),
    input: [
      { role: "system", content: args.system },
      { role: "user", content: args.user },
    ],
    // Bigger budget so we stop truncating mid-JSON
    max_output_tokens: args.maxOutputTokens ?? 8000,
  });

  const text = (res.output_text || "").trim();
  if (!text) throw new Error("LLM returned empty content");

  const cleaned = stripCodeFences(text);

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // ✅ One clean repair pass (covers truncation + fence issues)
    try {
      const repaired = await repairToJsonObject(openai, model, cleaned);
      return repaired as T;
    } catch {
      throw new Error(`LLM did not return valid JSON: ${cleaned.slice(0, 500)}`);
    }
  }
}
