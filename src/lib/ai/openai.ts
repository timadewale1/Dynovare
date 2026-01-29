// src/lib/ai/openai.ts
import "server-only";
import OpenAI from "openai";

function reqEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const openai = new OpenAI({
  apiKey: reqEnv("OPENAI_API_KEY"),
});

export function getDefaultModel() {
  return process.env.OPENAI_MODEL || "gpt-4.1-mini";
}
