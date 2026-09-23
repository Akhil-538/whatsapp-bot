import dotenv from "dotenv";

dotenv.config();

export const config = {
  prefix: process.env.BOT_PREFIX || "!",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  enableAi: process.env.ENABLE_AI !== "false",
};
