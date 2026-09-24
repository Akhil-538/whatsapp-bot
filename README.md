# 🤖 WhatsApp Bot

A modern , modular WhatsApp Bot built with Node.js and [`whatsapp-web.js`](https://github.com/pedroslopez/whatsapp-web.js), featuring session persistence, automatic command routing, sticker generation, and Google Gemini AI responses.

---

## ✨ Features

- 📱 **QR Code Authentication**: Connect quickly by scanning a QR code with your phone.
- 💾 **Session Persistence**: Sessions are saved locally (`.wwebjs_auth`), so you only scan the QR code once.
- ⚡ **Modular Command System**: Easily create new commands by dropping `.js` files into `src/commands/`.
- 🧠 **Multimodal AI Assistant (Gemini)**: Text Q&A, photo analysis (vision), audio transcription, and conversation history buffer.
- 🔗 **Webpage & Link Summarizer**: Extract article/webpage content and generate executive bullet-point summaries.
- 🎙️ **Voice Note Transcriber**: Turn spoken voice notes into clean text transcripts with auto-translation.
- 🖼️ **Sticker Maker**: Automatically convert photos or quoted images into WhatsApp stickers with `!sticker`.
- 📊 **Dynamic Help Menu**: The `!help` menu updates automatically whenever you add new commands.

---

## 📁 Project Structure

```
whatsapp-bot/
├── src/
│   ├── index.js               # Entry point: initializes client and event handlers
│   ├── config.js              # Environment settings and defaults
│   ├── handlers/
│   │   └── messageHandler.js  # Dispatches incoming messages to commands
│   ├── commands/
│   │   ├── ping.js            # Check bot latency
│   │   ├── help.js            # Dynamic command list
│   │   ├── echo.js            # Echo input text
│   │   ├── sticker.js         # Media to sticker converter
│   │   ├── stats.js           # Bot and host performance metrics
│   │   ├── joke.js            # Random jokes with offline fallbacks
│   │   ├── ai.js              # Multimodal Gemini assistant with vision & memory
│   │   ├── summarize.js       # Webpage & text summarizer
│   │   └── transcribe.js      # Voice note & audio transcriber
│   └── utils/
│       ├── gemini.js          # Google Gemini REST API caller & MIME cleaner
│       └── logger.js          # Console logger with timestamps
├── .env.example               # Environment variables template
├── .env                       # Active environment configuration
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (v22+ recommended)
- **Active WhatsApp Account** on your mobile device

### 2. Install Dependencies
In the project directory, run:
```bash
npm install
```

### 3. Configure `.env`
Edit the `.env` file to customize your bot:
```env
# Bot command prefix
BOT_PREFIX=!

# Google Gemini API key for !ai command (Optional)
# Get a free key: https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key_here

# Enable or disable AI
ENABLE_AI=true
```

### 4. Run the Bot
Start the bot:
```bash
npm start
```

Or run with live reload during development:
```bash
npm run dev
```

### 5. Pair WhatsApp
1. A QR code will appear in your terminal.
2. Open WhatsApp on your mobile phone.
3. Tap **Menu** (Android 3 dots) or **Settings** (iOS) > **Linked Devices** > **Link a Device**.
4. Scan the QR code displayed in your terminal.
5. Once authenticated, the bot logs `WhatsApp Bot is READY!`.

---

## 💬 Available Commands

| Command | Usage | Description |
| :--- | :--- | :--- |
| `!help` | `!help [command]` | Lists all available commands or inspects a specific command. |
| `!ping` | `!ping` | Checks bot latency and connectivity. |
| `!echo` | `!echo <text>` | Repeats the provided text. |
| `!sticker`| `!sticker` | Send or reply to an image with `!sticker` to turn it into a sticker. |
| `!stats` | `!stats` | View real-time system metrics, bot uptime, RAM usage, and runtime info. |
| `!joke` | `!joke` | Get a random funny programming or dad joke. |
| `!ai` | `!ai <prompt>` / `!ai reset` | Ask Gemini a question, reply to photos for visual inspection, or reset context. |
| `!summarize` | `!summarize <url>` | Summarize a webpage link or quoted message into concise bullet points. |
| `!transcribe`| `!transcribe` | Reply to a voice note or audio file to transcribe it into clean text. |

---

## 🧩 Adding Custom Commands

Adding a new command is as simple as creating a new file in `src/commands/`:

Example: `src/commands/roll.js`
```javascript
export default {
  name: "roll",
  description: "Roll a dice (1-6)",
  usage: "roll",
  async execute(client, message, args, commands) {
    const roll = Math.floor(Math.random() * 6) + 1;
    await message.reply(`🎲 You rolled a *${roll}*!`);
  }
};
```
The bot will automatically detect, load, and register the new command on startup without any changes to core files!
