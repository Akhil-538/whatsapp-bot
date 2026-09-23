export default {
  name: "sticker",
  description: "Convert an attached or quoted image/video into a WhatsApp sticker",
  usage: "sticker (as a caption on an image, or reply !sticker to an image)",
  async execute(client, message, args) {
    let targetMessage = message;

    if (!message.hasMedia && message.hasQuotedMsg) {
      targetMessage = await message.getQuotedMessage();
    }

    if (!targetMessage.hasMedia) {
      await message.reply("⚠️ Please send or reply to an image/video with `!sticker`.");
      return;
    }

    try {
      const media = await targetMessage.downloadMedia();
      if (!media) {
        await message.reply("❌ Failed to download media. Please try again.");
        return;
      }

      await client.sendMessage(message.from, media, {
        sendMediaAsSticker: true,
        stickerName: "WhatsApp Bot",
        stickerAuthor: "Bot",
      });
    } catch (err) {
      console.error("Error creating sticker:", err);
      await message.reply("❌ Error generating sticker. Make sure the media is supported.");
    }
  },
};
