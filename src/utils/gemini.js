import { config } from "../config.js";

/**
 * Utility helper to clean MIME types for Gemini API
 * e.g., "audio/ogg; codecs=opus" -> "audio/ogg"
 */
export function cleanMimeType(mimeType = "") {
  return mimeType.split(";")[0].trim().toLowerCase();
}

/**
 * Calls Google Gemini REST API generateContent endpoint
 * @param {Object} options
 * @param {Array} options.contents - Array of content objects with role and parts
 * @param {string} [options.systemInstruction] - Optional system instruction
 * @returns {Promise<string>} The generated text response
 */
export async function callGemini({ contents, systemInstruction }) {
  if (!config.enableAi) {
    throw new Error("AI features are currently disabled in configuration.");
  }

  if (!config.geminiApiKey) {
    throw new Error(
      "Gemini API key is not configured. Please add `GEMINI_API_KEY=your_key` in the `.env` file.\nGet a free key at: https://aistudio.google.com/"
    );
  }

  const model = config.geminiModel || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.geminiApiKey}`;

  const payload = { contents };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errorMsg = errData.error?.message || response.statusText;
    throw new Error(`Gemini API Error: ${errorMsg}`);
  }

  const data = await response.json();
  const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!answer) {
    throw new Error("No text response received from Gemini model.");
  }

  return answer;
}
