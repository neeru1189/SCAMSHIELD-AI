import { aiStructuredSchema, visionExtractionSchema } from "./schemas";

class AiConfigError extends Error {}

function getApiKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AiConfigError("AI provider is not configured. Set OPENAI_API_KEY on the server.");
  }
  return apiKey;
}

function extractTextOutput(json: Record<string, unknown>) {
  const outputText = json.output_text;
  if (typeof outputText === "string" && outputText.trim()) {
    return outputText;
  }
  throw new Error("AI service returned malformed output.");
}

async function callOpenAi(payload: object) {
  const apiKey = getApiKey();
  const authHeader = "Bearer " + apiKey;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("AI service request failed.");
  }

  const json = (await response.json()) as Record<string, unknown>;
  return extractTextOutput(json);
}

function parseJsonObject(raw: string) {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error("AI service returned malformed JSON.");
  }
}

export async function getTextAiAssessment(text: string) {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  const prompt = `You are ScamShield AI. Analyze suspicious user content.
Return only strict JSON with keys: findings (array of {category,severity,explanation,signal?}), summary, recommendations (array), avoid (array).
Use conservative language and avoid certainty claims.
Text: ${text}`;

  const raw = await callOpenAi({
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    input: prompt,
    max_output_tokens: 700,
  });

  const parsed = aiStructuredSchema.safeParse(parseJsonObject(raw));
  if (!parsed.success) {
    throw new Error("AI text response failed schema validation.");
  }

  return parsed.data;
}

export async function getVisionExtraction(base64Image: string, mimeType: string) {
  const prompt =
    "Extract suspicious text signals from this screenshot and return only strict JSON with keys extracted_text, detected_urls, qr_detected. Do not invent unseen content.";

  const raw = await callOpenAi({
    model: process.env.OPENAI_VISION_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: prompt },
          {
            type: "input_image",
            image_url: `data:${mimeType};base64,${base64Image}`,
          },
        ],
      },
    ],
    max_output_tokens: 700,
  });

  const parsed = visionExtractionSchema.safeParse(parseJsonObject(raw));
  if (!parsed.success) {
    throw new Error("AI vision response failed schema validation.");
  }

  return parsed.data;
}

export async function getSafetyAssistantAdvice(question: string, contextSummary: string) {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  const prompt = `You are ScamShield Safety Assistant.
Provide defensive non-authoritative safety guidance in simple language.
Never request OTP, PIN, CVV, password, or bank credentials.
Never guarantee money recovery.
Question: ${question}
Context: ${contextSummary}`;

  return callOpenAi({
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    input: prompt,
    max_output_tokens: 500,
  });
}

export { AiConfigError };
