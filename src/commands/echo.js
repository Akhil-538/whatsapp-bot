export default {
  name: "echo",
  description: "Repeat the message provided after the command",
  usage: "echo <your message>",
  async execute(client, message, args) {
    if (!args.length) {
      await message.reply("⚠️ Please provide text to echo. Example: `!echo Hello World`");
      return;
    }
    const text = args.join(" ");
    await message.reply(text);
  },
};
