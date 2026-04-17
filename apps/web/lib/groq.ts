import Groq from "groq-sdk";

export const AI_MODEL = "llama-3.3-70b-versatile";

let _groq: Groq | null = null;

export function getGroq(): Groq {
  if (!_groq) {
    _groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return _groq;
}

/**
 * Parse JSON from an LLM response, stripping markdown code fences
 * and extracting the first JSON object if there's surrounding text.
 */
export function parseAIJson<T = unknown>(raw: string): T {
  let s = raw.trim();

  // Strip markdown code fences: ```json ... ``` or ``` ... ```
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

  // If there's still extra text, try to extract the JSON object
  const firstBrace = s.indexOf("{");
  const lastBrace = s.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    s = s.slice(firstBrace, lastBrace + 1);
  }

  return JSON.parse(s) as T;
}
