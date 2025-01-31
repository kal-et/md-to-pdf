require("dotenv").config();
const { Telegraf } = require("telegraf");
const express = require("express");
const axios = require("axios");

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

const PORT = process.env.PORT || 3000;

// Middleware for Telegram updates
app.use(bot.webhookCallback("/telegram"));

// Function to set webhook dynamically
async function setupWebhook() {
  const webhookUrl = `https://${process.env.RENDER_EXTERNAL_HOSTNAME}/telegram`; // Render provides this env variable
  try {
    await bot.telegram.setWebhook(webhookUrl);
    console.log(`Webhook set to: ${webhookUrl}`);
  } catch (error) {
    console.error("Error setting webhook:", error);
  }
}

// File handling
bot.on("document", async (ctx) => {
  const file = ctx.message.document;

  // Check if it's a Markdown file
  if (file.mime_type !== "text/markdown" && !file.file_name.endsWith(".md")) {
    return;
  }

  // Get file link
  const fileLink = await ctx.telegram.getFileLink(file.file_id);
  const response = await axios.get(fileLink.href, { responseType: "stream" });

  // Send back the file
  ctx.replyWithDocument({ source: response.data, filename: file.file_name });
});

// Start Express server and set webhook
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await setupWebhook();
});

