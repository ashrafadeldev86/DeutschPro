import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoints
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, sentences, customApiKey } = req.body;
      
      // Determine which API key to use
      const resolvedKey = customApiKey && customApiKey.trim() !== "" 
        ? customApiKey.trim() 
        : process.env.GEMINI_API_KEY;

      if (!resolvedKey) {
        throw new Error("Missing Gemini API Key. Please enter a key in the application settings or ensure the server configuration is complete.");
      }

      // Instantiate localized GoogleGenAI with resolved key
      const activeAi = new GoogleGenAI({
        apiKey: resolvedKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // format context
      const sentencesContext = sentences && sentences.length > 0
        ? sentences.map((s: any) => `- German: "${s.german}" (Arabic Translation: "${s.arabic}", Mastery Level: ${s.level})`).join("\n")
        : "No stored sentences yet. Start with basic German greetings.";

      // format conversation history
      const historyText = messages && messages.length > 0
        ? messages.map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant (German Teacher)'}: ${m.content}`).join("\n")
        : "No messages yet. (Generate the initial welcoming message and starter questions)";

      const prompt = `
        You are a friendly, encouraging German language teacher who speaks Arabic.
        The user is learning German.
        Here is the user's list of saved sentences (context):
        ${sentencesContext}

        Current conversation history:
        ${historyText}

        INSTRUCTIONS:
        1. If conversation history is empty ("No messages yet. (Generate the initial welcoming message and starter questions)"), greet the student very warmly in German + Arabic, explain you are here to chat in German based on their vocabulary context, and ask a very simple starter question in German.
        2. If the user replied:
           - Analyze their last German response (the final message in history).
           - Correct any spelling, syntax, or grammar mistakes in a pedagogical, supportive, and friendly way in Arabic in the "correction" field. Explain the correction clearly so they learn. If their sentence is correct, write encouraging feedback in Arabic (e.g. "رائع جداً! جملتك صحيحة تماماً وبدون أي أخطاء.") or suggest a small natural refinement.
           - Formulate your friendly reply to their message in German and add a new open-ended or simple continuation question in German to keep the conversation going, and write this entire German output in the "response" field.
           - Provide the direct Arabic translation of your reply and new question in the "translation" field.

        Please respond with a single JSON object strictly matching the schema:
        {
          "correction": "Arabic correction note or encouraging feedback on the user's last input.",
          "response": "German response and next German question to challenge the user.",
          "translation": "Arabic translation of the German response."
        }
      `;

      const response = await activeAi.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a professional, gentle German teacher helper who speaks Arabic. You always output responses in valid JSON format.",
          responseMimeType: "application/json",
        }
      });

      const text = response.text || "{}";
      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error?.message || "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
