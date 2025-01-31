const { Telegraf } = require("telegraf");
const express = require("express");
const axios = require("axios");
const { message } = require("telegraf/filters");

require("dotenv").config(); // Load environment variables

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

const WEBHOOK_URL = process.env.WEBHOOK_URL; // Set this in Render's environment variables
const MD_TO_PDF_API_URL = process.env.MD_TO_PDF_API_URL; // Now loading from environment variables

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

  try {
    // Get file link
    const fileLink = await ctx.telegram.getFileLink(file.file_id);
    const response = await axios.get(fileLink.href, { responseType: "text" });

    const markdownContent = response.data;

    // Send the markdown content to the PDF conversion API
    const css = `
      * {
        font-size: 12px;
      }
      body {
        font-family: Arial, sans-serif;
      }
    `;

    const pdfResponse = await axios.post(MD_TO_PDF_API_URL, `markdown=${encodeURIComponent(markdownContent)}&css=${encodeURIComponent(css)}`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      responseType: 'arraybuffer', // To handle binary data like PDFs
    });

    // Send the PDF back to the user
    ctx.replyWithDocument({
      source: pdfResponse.data,
      filename: file.file_name.replace('.md', '.pdf'), // Changing the file extension to .pdf
    });
  } catch (error) {
    console.error('Error converting markdown to PDF:', error);
    ctx.reply('Sorry, there was an error converting the file to PDF.');
  }
});

// Start Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await setupWebhook(); // Set the webhook on startup
});
