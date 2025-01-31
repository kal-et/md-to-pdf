const { Telegraf } = require("telegraf");
const express = require("express");
const axios = require("axios");
const { message } = require("telegraf/filters");

require("dotenv").config(); // Load environment variables

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

const WEBHOOK_URL = process.env.WEBHOOK_URL; // Set this in Render's environment variables

// Middleware for Telegram updates
app.use(bot.webhookCallback("/telegram"));

// Function to set webhook
async function setupWebhook() {
  try {
    await bot.telegram.setWebhook(`${WEBHOOK_URL}/telegram`);
    console.log("Webhook set successfully!");
  } catch (error) {
    console.error("Error setting webhook:", error);
  }
}

// File handling using the recommended filter
bot.on(message("document"), async (ctx) => {
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

// Start Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await setupWebhook(); // Set the webhook on startup
});
