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
    const body = message.body.trim();

    // If message does not start with command prefix, check for natural language auto-replies (e.g. "hello")
    if (!body.startsWith(config.prefix)) {
      await this.handleConversationalReplies(client, message, body);
      return;
    }

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

  async handleConversationalReplies(client, message, body) {
    // Avoid auto-replying to messages sent by ourselves to others
    const isSelfChat = message.from === message.to || (client.info?.wid && message.from.includes(client.info.wid.user));
    if (message.fromMe && !isSelfChat) {
      return;
    }

    const clean = body.toLowerCase().trim().replace(/^[^\w]+|[^\w]+$/g, "");
    const sender = message.author || message.from;

    // 1. Automatic greeting reply for "hello", "hi", "hey", etc.
    if (/^(hello+|hi+|hey+|hola+|namaste+)\b/i.test(clean)) {
      logger.info(`Auto-replying to greeting from ${sender}`);
      await message.reply("Hi!\nHow are you? 😊");
      return;
    }

    // 2. Reply to "how are you"
    if (/^(how\s+(are|r)\s+(you|u))\b/i.test(clean)) {
      logger.info(`Auto-replying to status inquiry from ${sender}`);
      await message.reply("I'm doing great, thank you! How can I help you today? 😊\n\n💡 _Tip: Send *!help* to see all available commands._");
      return;
    }

    // 3. Reply to positive response like "fine", "good", "doing well"
    if (/^(i('?m| am)?\s*(fine|good|great|doing well)|all good|doing fine)\b/i.test(clean)) {
      logger.info(`Auto-replying to well-being message from ${sender}`);
      await message.reply("Glad to hear that! Feel free to ask me anything or send *!help* to explore my commands! ✨");
      return;
    }
  }
}

