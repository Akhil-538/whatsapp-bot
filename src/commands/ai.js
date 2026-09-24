import { callGemini, cleanMimeType } from "../utils/gemini.js";

// Rolling buffer of recent chat history per chat (max 6 messages: 3 user + 3 model)
const MAX_HISTORY_MESSAGES = 6;
const chatHistories = new Map();

/**
 * Resets the conversation history for a given chat ID
 */
export function resetChatHistory(chatId) {
  chatHistories.delete(chatId);
}

export default {
  name: "ai",
  description: "Ask Google Gemini with text, images, voice notes, and conversation memory",
  usage: "ai <prompt> | !ai reset | Reply to an image/audio with !ai [prompt]",
  async execute(client, message, args) {
    const chatId = message.from;
    const subCommand = args[0]?.toLowerCase();

    // Command: !ai reset or !ai clear
    if (subCommand === "reset" || subCommand === "clear") {
      resetChatHistory(chatId);
      await message.reply("🧹 *AI conversation memory cleared!* Starting a fresh context.");
      return;
    }

    // Check if the current message or quoted message has media
    let targetMessage = message;
    if (!message.hasMedia && message.hasQuotedMsg) {
      targetMessage = await message.getQuotedMessage();
    }

    let promptText = args.join(" ").trim();
    let mediaPart = null;
    let mediaTypeDesc = null;

    if (targetMessage.hasMedia) {
      try {
        const media = await targetMessage.downloadMedia();
        if (media && media.mimetype && media.data) {
          const mime = cleanMimeType(media.mimetype);

          if (mime.startsWith("image/")) {
            mediaPart = {
              inlineData: {
                mimeType: mime,
                data: media.data,
              },
            };
            mediaTypeDesc = "image";
            if (!promptText) {
              promptText = "Describe this image in detail and tell me what you see.";
            }
          } else if (mime.startsWith("audio/") || mime.includes("ogg")) {
            mediaPart = {
              inlineData: {
                mimeType: mime,
                data: media.data,
              },
            };
            mediaTypeDesc = "audio";
            if (!promptText) {
              promptText = "Please transcribe and explain this audio recording.";
            }
          }
        }
      } catch (mediaErr) {
        console.error("Error downloading media for AI command:", mediaErr);
      }
    }

    // If no prompt text and no media attached
    if (!promptText && !mediaPart) {
      await message.reply(
        "⚠️ Please provide a prompt or reply to an image/audio.\n\n" +
        "• *Text:* `!ai What is quantum computing?`\n" +
        "• *Image:* Reply `!ai Describe this` to any photo\n" +
        "• *Voice/Audio:* Reply `!ai` to any voice note\n" +
        "• *Reset:* `!ai reset` to clear conversation memory"
      );
      return;
    }

    // Build the current turn parts
    const currentParts = [];
    if (mediaPart) {
      currentParts.push(mediaPart);
    }
    if (promptText) {
      currentParts.push({ text: promptText });
    }

    // Get chat history
    const history = chatHistories.get(chatId) || [];

    // Payload contents: previous turns + current turn
    const contents = [
      ...history,
      {
        role: "user",
        parts: currentParts,
      },
    ];

    try {
      const answer = await callGemini({
        contents,
        systemInstruction:
          "You are a helpful, intelligent WhatsApp AI assistant powered by Google Gemini. " +
          "Provide concise, informative, and well-structured answers using clean markdown. " +
          "Keep responses readable on mobile screens.",
      });

      // Update rolling conversation history
      // Store lightweight text representation for media turns to prevent memory bloat
      const historyPrompt = mediaTypeDesc
        ? `[User attached ${mediaTypeDesc}]: ${promptText}`
        : promptText;

      const updatedHistory = [
        ...history,
        { role: "user", parts: [{ text: historyPrompt }] },
        { role: "model", parts: [{ text: answer }] },
      ];

      // Keep only the most recent N messages
      if (updatedHistory.length > MAX_HISTORY_MESSAGES) {
        chatHistories.set(chatId, updatedHistory.slice(-MAX_HISTORY_MESSAGES));
      } else {
        chatHistories.set(chatId, updatedHistory);
      }

      // WhatsApp message length limit guard
      const trimmedAnswer =
        answer.length > 3500
          ? answer.slice(0, 3500) + "...\n\n_(Response truncated due to length)_"
          : answer;

      const header = mediaTypeDesc ? `🤖 *AI Analysis (${mediaTypeDesc}):*\n\n` : "🤖 *AI Assistant:*\n\n";
      await message.reply(`${header}${trimmedAnswer}`);
    } catch (err) {
      console.error("AI command error:", err);
      await message.reply(`❌ ${err.message || "An unexpected error occurred while processing your request."}`);
    }
  },
};
