import pkg from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { MessageHandler } from "./handlers/messageHandler.js";
import { logger } from "./utils/logger.js";
import { config } from "./config.js";

const { Client, LocalAuth } = pkg;

const messageHandler = new MessageHandler();

// Initialize WhatsApp Web Client
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: "./.wwebjs_auth",
  }),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
    ],
  },
});

// Event: QR Code received
client.on("qr", (qr) => {
  logger.info("QR Code received. Scan it with WhatsApp (Linked Devices):");
  qrcode.generate(qr, { small: true });
});

// Event: Authentication successful
client.on("authenticated", () => {
  logger.success("WhatsApp authentication successful!");
});

// Event: Authentication failed
client.on("auth_failure", (msg) => {
  logger.error("WhatsApp authentication failed:", msg);
});

// Event: Client Ready
client.on("ready", () => {
  const info = client.info;
  logger.success("===========================================");
  logger.success(` WhatsApp Bot is READY!`);
  logger.success(` Connected as: ${info?.pushname || "Unknown"} (${info?.wid?.user || "Unknown"})`);
  logger.success(` Command prefix: "${config.prefix}"`);
  logger.success("===========================================");
});

// Event: Incoming / Sent Messages
// Using message_create allows triggering commands from both incoming chats and self-chat
client.on("message_create", async (message) => {
  await messageHandler.handleMessage(client, message);
});

// Event: Disconnected
client.on("disconnected", (reason) => {
  logger.warn("WhatsApp disconnected:", reason);
});

// Start the bot
async function startBot() {
  logger.info("Initializing WhatsApp Bot...");
  await messageHandler.loadCommands();
  await client.initialize();
}

// Graceful exit
process.on("SIGINT", async () => {
  logger.info("Shutting down gracefully...");
  try {
    await client.destroy();
  } catch (e) {
    // Ignore error on destroy
  }
  process.exit(0);
});

startBot().catch((err) => {
  logger.error("Fatal startup error:", err);
});
