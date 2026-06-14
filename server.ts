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
      console.error("Gemini API Error (chat):", error);
      res.status(500).json({ error: error?.message || "Internal server error" });
    }
  });

  app.post("/api/check-grammar", async (req, res) => {
    try {
      const { sentence, customApiKey } = req.body;
      const resolvedKey = customApiKey && customApiKey.trim() !== "" ? customApiKey.trim() : process.env.GEMINI_API_KEY;

      if (!resolvedKey) {
        throw new Error("Missing Gemini API Key.");
      }

      const activeAi = new GoogleGenAI({
        apiKey: resolvedKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `
        Analyze the German spelling and grammar of the following sentence:
        "${sentence}"

        Evaluate if there are any grammatical, spelling, casing (German nouns must be capitalized), or syntax errors.
        Also break down the words of the input sentence and classify each word's correctness status relative to context.

        Please respond in strict JSON matching this structure:
        {
          "hasErrors": boolean (true if there are spelling, syntax, casing, or word order problems. False if the sentence is completely 100% correct),
          "correctedText": "The fully corrected German sentence.",
          "explanation": "A gentle and helpful explanation of all mistakes in Arabic. If correct, provide an encouraging statement in Arabic.",
          "highlightedWords": [
            {
              "word": "original_word_from_input",
              "state": "error" or "correct",
              "suggestion": "corrected_word_if_applicable"
            }
          ]
        }
        
        Ensure every word from the input sentence appears in "highlightedWords" list in sequential order.
      `;

      const response = await activeAi.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a professional German grammar helper who outputs valid JSON according to the schema.",
          responseMimeType: "application/json",
        }
      });

      const text = response.text || "{}";
      res.json(JSON.parse(text));
    } catch (error: any) {
      console.error("Gemini API Error (check-grammar):", error);
      res.status(500).json({ error: error?.message || "Internal server error" });
    }
  });

  app.post("/api/analyse-speech", async (req, res) => {
    try {
      const { targetText, transcribedText, customApiKey } = req.body;
      const resolvedKey = customApiKey && customApiKey.trim() !== "" ? customApiKey.trim() : process.env.GEMINI_API_KEY;

      if (!resolvedKey) {
        throw new Error("Missing Gemini API Key.");
      }

      const activeAi = new GoogleGenAI({
        apiKey: resolvedKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `
        The user is practicing German pronunciation.
        Correct targeted sentence: "${targetText}"
        What the speech transcriber recognized from the user's voice: "${transcribedText}"

        Review the phonetic differences between targetText and transcribedText.
        Rate their pronunciation score from 0 to 100 based on word matches and closeness.
        Provide a friendly, encouraging analysis in Arabic detailing pronunciation tips for typical Arabic speaker pitfalls (like letters 'p' vs 'b', spelling rules, ending consonants, Umlauts like ä, ö, ü, or diphthongs like 'ei', 'eu', 'ie').

        Please respond with a strict JSON structure:
        {
          "score": number (0 to 100, e.g. 95),
          "isCorrect": boolean (true if score >= 75),
          "feedback": "A highly pedagogical feedback text in Arabic. Highlight exactly which letters or vowels might have been mispronounced or substituted, along with tips.",
          "wordAnalysis": [
            {
              "word": "word_from_target_sentence",
              "state": "correct" or "incorrect" or "missing",
              "suggestion": "guidance on how to mouth or pronounce this word if incorrect"
            }
          ]
        }
      `;

      const response = await activeAi.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a friendly German pronunciation coach who outputs valid JSON according to the schema.",
          responseMimeType: "application/json",
        }
      });

      const text = response.text || "{}";
      res.json(JSON.parse(text));
    } catch (error: any) {
      console.error("Gemini API Error (analyse-speech):", error);
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
