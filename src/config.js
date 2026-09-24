import dotenv from "dotenv";

dotenv.config();

export const config = {
  prefix: process.env.BOT_PREFIX || "!",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-1.5-flash",
  enableAi: process.env.ENABLE_AI !== "false",
};
