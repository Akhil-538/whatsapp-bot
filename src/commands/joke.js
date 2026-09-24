const fallbackJokes = [
  {
    setup: "Why do programmers prefer dark mode?",
    punchline: "Because light attracts bugs! 🐛",
  },
  {
    setup: "How many programmers does it take to change a light bulb?",
    punchline: "None, that's a hardware problem! 💡",
  },
  {
    setup: "Why did the JavaScript developer wear glasses?",
    punchline: "Because they didn't C#! 👓",
  },
  {
    setup: "There are 10 types of people in the world...",
    punchline: "Those who understand binary, and those who don't! 🔢",
  },
  {
    setup: "Why do Java developers wear glasses?",
    punchline: "Because they don't see sharp! ☕",
  },
];

export default {
  name: "joke",
  description: "Get a random funny joke",
  usage: "joke",
  async execute(client, message, args) {
    let setup = "";
    let punchline = "";

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch("https://official-joke-api.appspot.com/random_joke", {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setup = data.setup;
        punchline = data.punchline;
      } else {
        throw new Error("API returned non-200");
      }
    } catch {
      // Pick random fallback joke if API is unreachable
      const randomJoke = fallbackJokes[Math.floor(Math.random() * fallbackJokes.length)];
      setup = randomJoke.setup;
      punchline = randomJoke.punchline;
    }

    const replyText = [
      "😂 *Joke Time!*",
      "━━━━━━━━━━━━━━━━━━━━━━━━━",
      `*Q:* ${setup}`,
      "",
      `*A:* ${punchline}`,
      "━━━━━━━━━━━━━━━━━━━━━━━━━",
    ].join("\n");

    await message.reply(replyText);
  },
};
