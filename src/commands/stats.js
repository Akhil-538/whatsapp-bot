import os from "os";

function formatUptime(seconds) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}

export default {
  name: "stats",
  description: "View system status, bot uptime, memory usage, and runtime metrics",
  usage: "stats",
  async execute(client, message, args, commands) {
    const uptime = formatUptime(process.uptime());
    const memUsage = (process.memoryUsage().rss / (1024 * 1024)).toFixed(2);
    const totalMem = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
    const freeMem = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);

    const statsReport = [
      "📊 *WhatsApp Bot System Metrics*",
      "━━━━━━━━━━━━━━━━━━━━━━━━━",
      `⏱️ *Uptime:* ${uptime}`,
      `💾 *RAM Usage:* ${memUsage} MB`,
      `🖥️ *Host RAM:* ${freeMem} GB free / ${totalMem} GB total`,
      `⚙️ *Node.js:* ${process.version}`,
      `💻 *Platform:* ${process.platform} (${process.arch})`,
      `📦 *Registered Commands:* ${commands ? commands.size : "N/A"}`,
      `👤 *Connected As:* ${client.info?.pushname || "Bot"}`,
      "━━━━━━━━━━━━━━━━━━━━━━━━━",
      "🟢 Status: Operational",
    ].join("\n");

    await message.reply(statsReport);
  },
};
