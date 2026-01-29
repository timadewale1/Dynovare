// src/lib/ai/llmClient.ts
import "server-only";
import { openai, getDefaultModel } from "@/lib/ai/openai";

export async function llmJSON<T>(args: {
  system: string;
  user: string;
  model?: string;
  temperature?: number;

  // ✅ when true, OpenAI can web-search during generation
  webSearch?: boolean;

  // optional: force “Nigeria-first” grounding queries later if you want
}): Promise<T> {
  const model = args.model ?? getDefaultModel();

  // We keep strict JSON output by instruction + parsing.
  // Web search runs as a tool inside the same response. :contentReference[oaicite:1]{index=1}
  const tools = args.webSearch ? [{ type: "web_search" as const }] : undefined;

  const input = [
    {
      role: "system" as const,
      content: args.system,
    },
    {
      role: "user" as const,
      content: args.user,
    },
  ];

  const res = await openai.responses.create({
    model,
    temperature: args.temperature ?? 0.2,
    tools,
    input,
  });

  // `output_text` is the combined assistant text output
  const text = (res.output_text || "").trim();
  if (!text) throw new Error("LLM returned empty content");

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`LLM did not return valid JSON: ${text.slice(0, 400)}`);
  }
}
