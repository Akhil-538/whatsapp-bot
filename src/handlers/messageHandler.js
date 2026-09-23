import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class MessageHandler {
  constructor() {
    this.commands = new Map();
  }

  async loadCommands() {
    const commandsDir = path.join(__dirname, "../commands");
    const commandFiles = fs.readdirSync(commandsDir).filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
      const filePath = path.join(commandsDir, file);
      try {
        const fileUrl = pathToFileURL(filePath).href;
        const module = await import(fileUrl);
        const command = module.default;

        if (command && command.name && typeof command.execute === "function") {
          this.commands.set(command.name.toLowerCase(), command);
          logger.info(`Loaded command: ${config.prefix}${command.name}`);
        } else {
          logger.warn(`Skipping invalid command file: ${file}`);
        }
      } catch (err) {
        logger.error(`Failed to load command file ${file}:`, err);
      }
    }
  }

  async handleMessage(client, message) {
    // Ignore status broadcasts and empty body
    if (!message.body || message.isStatus) return;

    const body = message.body.trim();
    if (!body.startsWith(config.prefix)) return;

    const args = body.slice(config.prefix.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();

    if (!commandName) return;

    const command = this.commands.get(commandName);
    if (!command) {
      // Unknown command: silently ignore or optionally reply
      return;
    }

    const sender = message.author || message.from;
    logger.cmd(sender, `${config.prefix}${commandName}`);

    try {
      await command.execute(client, message, args, this.commands);
    } catch (err) {
      logger.error(`Error executing ${commandName}:`, err);
      await message.reply("❌ An error occurred while executing that command.");
    }
  }
}
