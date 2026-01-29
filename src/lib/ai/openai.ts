// src/lib/ai/openai.ts
import "server-only";
import OpenAI from "openai";

function reqEnv(name: string) {
  return process.env[name];
}

export function getOpenAI() {
  const apiKey = reqEnv("OPENAI_API_KEY");
  if (!apiKey) throw new Error("Missing env var: OPENAI_API_KEY");
  return new OpenAI({ apiKey });
}

export function getDefaultModel() {
  return process.env.OPENAI_MODEL || "gpt-4.1-mini";
}
