import { callGemini, cleanMimeType } from "../utils/gemini.js";

export default {
  name: "transcribe",
  description: "Transcribe a voice note or audio file into text using Google Gemini",
  usage: "transcribe (reply !transcribe to a voice note or audio message)",
  async execute(client, message, args) {
    let targetMessage = message;

    if (!message.hasMedia && message.hasQuotedMsg) {
      targetMessage = await message.getQuotedMessage();
    }

    if (!targetMessage || !targetMessage.hasMedia) {
      await message.reply(
        "⚠️ Please reply to a voice note or audio message with `!transcribe` to transcribe it into text."
      );
      return;
    }

    try {
      const media = await targetMessage.downloadMedia();
      if (!media || !media.mimetype || !media.data) {
        await message.reply("❌ Failed to download audio media. Please try again.");
        return;
      }

      const mime = cleanMimeType(media.mimetype);
      const isAudio = mime.startsWith("audio/") || mime.includes("ogg") || mime.startsWith("video/");

      if (!isAudio) {
        await message.reply(
          "⚠️ The attached media is not recognized as an audio or voice note recording."
        );
        return;
      }

      const contents = [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mime,
                data: media.data,
              },
            },
            {
              text:
                "Transcribe this audio recording verbatim. " +
                "Output only the clean transcription text without introductory or concluding conversational commentary. " +
                "If the audio is in a language other than English, output the original language transcription followed by an English translation. " +
                "If the audio is inaudible or empty, state that clearly.",
            },
          ],
        },
      ];

      const transcription = await callGemini({
        contents,
        systemInstruction:
          "You are a professional audio transcriber. Listen carefully and return an accurate verbatim transcription of spoken words.",
      });

      const responseText = [
        "🎙️ *Voice Note Transcription:*",
        "━━━━━━━━━━━━━━━━━━━━━━━━━",
        transcription.trim(),
        "━━━━━━━━━━━━━━━━━━━━━━━━━",
      ].join("\n");

      await message.reply(responseText);
    } catch (err) {
      console.error("Transcribe command error:", err);
      await message.reply(`❌ ${err.message || "An error occurred while transcribing the audio."}`);
    }
  },
};
