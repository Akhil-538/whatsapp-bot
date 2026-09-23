export default {
  name: "ping",
  description: "Check bot responsiveness and response latency",
  usage: "ping",
  async execute(client, message, args) {
    const start = Date.now();
    const reply = await message.reply("🏓 Pong!");
    const latency = Date.now() - start;
    if (reply) {
      await reply.edit(`🏓 Pong! Latency: ${latency}ms`);
    }
  },
};
