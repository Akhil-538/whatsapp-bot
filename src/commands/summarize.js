import { callGemini } from "../utils/gemini.js";

/**
 * Strips HTML tags, styles, scripts, and navigation boilerplate
 */
function extractArticleText(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, " ")
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ")
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ")
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, " ")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const URL_REGEX = /(https?:\/\/[^\s]+)/i;

export default {
  name: "summarize",
  description: "Summarize a webpage URL, article, or quoted text message into key takeaways",
  usage: "summarize <url> | Reply !summarize to a link or long text",
  async execute(client, message, args) {
    let targetUrl = null;
    let textToSummarize = args.join(" ").trim();

    // Check if arguments contain a URL
    const argUrlMatch = textToSummarize.match(URL_REGEX);
    if (argUrlMatch) {
      targetUrl = argUrlMatch[0];
    }

    // Check quoted message if no URL in args
    if (!targetUrl && message.hasQuotedMsg) {
      const quotedMsg = await message.getQuotedMessage();
      if (quotedMsg.body) {
        const quotedUrlMatch = quotedMsg.body.match(URL_REGEX);
        if (quotedUrlMatch) {
          targetUrl = quotedUrlMatch[0];
        } else if (!textToSummarize) {
          textToSummarize = quotedMsg.body.trim();
        }
      }
    }

    // If neither URL nor text is found
    if (!targetUrl && !textToSummarize) {
      await message.reply(
        "⚠️ Please provide a URL or reply to a message to summarize.\n\n" +
        "• *URL Summary:* `!summarize https://example.com/article`\n" +
        "• *Text Summary:* Reply `!summarize` to any long message"
      );
      return;
    }

    let contentForAi = "";
    let sourceLabel = "";

    if (targetUrl) {
      sourceLabel = `🔗 *Webpage Summary:* ${targetUrl}`;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(targetUrl, {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          await message.reply(`❌ Failed to fetch webpage: ${response.status} ${response.statusText}`);
          return;
        }

        const html = await response.text();
        const cleanedText = extractArticleText(html);

        if (!cleanedText || cleanedText.length < 50) {
          await message.reply("⚠️ Could not extract readable text from the provided webpage.");
          return;
        }

        // Limit extracted text to prevent token overflow (~12,000 characters)
        contentForAi = `Webpage URL: ${targetUrl}\n\nWebpage Content:\n${cleanedText.slice(0, 12000)}`;
      } catch (fetchErr) {
        console.error("Error fetching URL for summarization:", fetchErr);
        await message.reply(`❌ Could not fetch webpage: ${fetchErr.message}`);
        return;
      }
    } else {
      sourceLabel = "📝 *Text Summary:*";
      contentForAi = `Text Content:\n${textToSummarize.slice(0, 10000)}`;
    }

    try {
      const summary = await callGemini({
        contents: [
          {
            role: "user",
            parts: [{ text: contentForAi }],
          },
        ],
        systemInstruction:
          "You are a professional executive summarizer. Analyze the provided content and output a clean, well-formatted summary for WhatsApp with the following structure:\n" +
          "📌 *Overview*: A concise 1-2 sentence summary.\n" +
          "🔍 *Key Points*: 3-5 bullet points covering the core facts or findings.\n" +
          "💡 *Key Takeaway*: A single concluding thought or action item.\n" +
          "Keep it crisp, objective, and mobile-friendly.",
      });

      const responseText = [
        sourceLabel,
        "━━━━━━━━━━━━━━━━━━━━━━━━━",
        summary,
        "━━━━━━━━━━━━━━━━━━━━━━━━━",
      ].join("\n");

      await message.reply(responseText);
    } catch (err) {
      console.error("Summarize command error:", err);
      await message.reply(`❌ ${err.message || "An error occurred while generating the summary."}`);
    }
  },
};
