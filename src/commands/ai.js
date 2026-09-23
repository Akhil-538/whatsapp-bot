import { config } from "../config.js";

export default {
  name: "ai",
  description: "Ask an AI question powered by Google Gemini",
  usage: "ai <your question or prompt>",
  async execute(client, message, args) {
    if (!config.enableAi) {
      await message.reply("⚠️ AI features are currently disabled in configuration.");
      return;
    }

    if (!config.geminiApiKey) {
      await message.reply(
        "⚠️ Gemini API key is not configured. Please add `GEMINI_API_KEY=your_key` in the `.env` file.\nGet a free key at: https://aistudio.google.com/"
      );
      return;
    }

    if (!args.length) {
      await message.reply("⚠️ Please provide a prompt. Example: `!ai What is quantum computing?`");
      return;
    }

    const prompt = args.join(" ");

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.geminiApiKey}`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errorMsg = errData.error?.message || response.statusText;
        await message.reply(`❌ Gemini API Error: ${errorMsg}`);
        return;
      }

      const data = await response.json();
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!answer) {
        await message.reply("⚠️ No response received from AI model.");
        return;
      }

      // WhatsApp messages have length limits; trim if necessary
      const trimmedAnswer = answer.length > 3500 ? answer.slice(0, 3500) + "...\n\n_(Response truncated)_" : answer;

      await message.reply(`🤖 *AI Assistant:*\n\n${trimmedAnswer}`);
    } catch (err) {
      console.error("AI command error:", err);
      await message.reply("❌ An unexpected error occurred while processing your AI request.");
    }
  },
};
