import { config } from "../config.js";

export default {
  name: "help",
  description: "Display the list of available commands and how to use them",
  usage: "help [command_name]",
  async execute(client, message, args, commands) {
    const prefix = config.prefix;

    if (args[0]) {
      const query = args[0].toLowerCase();
      const cmd = commands.get(query);
      if (!cmd) {
        await message.reply(`❌ Command \`${prefix}${query}\` not found. Type \`${prefix}help\` to see all commands.`);
        return;
      }

      const response = [
        `📌 *Command Details: ${prefix}${cmd.name}*`,
        `📝 *Description:* ${cmd.description || "No description"}`,
        `💡 *Usage:* \`${prefix}${cmd.usage || cmd.name}\``,
      ].join("\n");

      await message.reply(response);
      return;
    }

    let helpText = `🤖 *WhatsApp Bot Menu*\nPrefix: \`${prefix}\`\n\n`;
    helpText += `*Available Commands:*\n`;

    for (const cmd of commands.values()) {
      helpText += `• *${prefix}${cmd.name}* - ${cmd.description}\n`;
    }

    helpText += `\n💡 Tip: Use \`${prefix}help <command>\` for detailed information on a specific command.`;
    await message.reply(helpText);
  },
};
