import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import crypto from "crypto";
import fs from "fs";

dotenv.config();

// Absolute path to the persistence JSON file
const DB_FILE = path.join(process.cwd(), "database.json");

interface DBUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  age: number;
  targetLevel: string;
  isPremium: boolean;
  premiumExpiry?: string;
  premiumPlan?: string;
  premiumStatus: "pending" | "approved" | "rejected" | "none";
  xp: number;
  level: number;
  streak: number;
  sentences: any[];
  achievements: any[];
  correctQuizzesCount: number;
  successfulSpeechesCount: number;
  chatTurnsCompleted: number;
  createdAt: string;
  lastActiveAt?: string;
}

interface DBPremiumRequest {
  id: string;
  userEmail: string;
  userName: string;
  planName: string;
  price: string;
  paymentMethod: "vodafone" | "paypal";
  paypalAccount?: string;
  transactionId?: string;
  screenshot?: string; // base64 string
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  expiryDate?: string;
}

interface DBStructure {
  users: DBUser[];
  requests: DBPremiumRequest[];
  appInstalls?: number;
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "deutsch-pro-salt-secret-hash-2026").digest("hex");
}

function loadDatabase(): DBStructure {
  let db: DBStructure = { users: [], requests: [], appInstalls: 1 };
  if (fs.existsSync(DB_FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    } catch (e) {
      console.error("Failed to parse database.json, resetting...", e);
    }
  }

  if (db.appInstalls === undefined) {
    db.appInstalls = 1;
  }

  // Ensure Admin user exists
  const adminEmail = "ashrafadelnn666@gmail.com".toLowerCase().trim();
  const adminExists = db.users.some(u => u.email.toLowerCase().trim() === adminEmail);
  if (!adminExists) {
    db.users.push({
      id: "admin-user-id",
      name: "كوتش أشرف عادل (المدير والمسؤول العام)",
      email: adminEmail,
      passwordHash: hashPassword("ashrafadel1234"),
      age: 26,
      targetLevel: "C2",
      isPremium: true,
      premiumStatus: "approved",
      premiumPlan: "باقة المدير الكاملة اللانهائية ♛",
      xp: 1500,
      level: 10,
      streak: 100,
      sentences: [],
      achievements: [],
      correctQuizzesCount: 20,
      successfulSpeechesCount: 30,
      chatTurnsCompleted: 50,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    });
    saveDatabase(db);
  }
  return db;
}

function saveDatabase(db: DBStructure) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write to database.json", error);
  }
}

function checkIsAdmin(email: string, db: DBStructure): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  if (normalized === "ashrafadelnn666@gmail.com" || normalized === "ashrafadelnn666") {
    return true;
  }
  const user = db.users.find(u => u.email.toLowerCase().trim() === normalized);
  return !!(user && (user as any).isAdmin);
}

interface FailoverParams {
  model: string;
  contents: any;
  config?: any;
}

async function generateContentWithFailover(
  customApiKey: string | undefined,
  params: FailoverParams
) {
  let rawKeysStr = "";
  if (customApiKey && customApiKey.trim() !== "") {
    rawKeysStr = customApiKey;
  } else if (process.env.GEMINI_API_KEY) {
    rawKeysStr = process.env.GEMINI_API_KEY;
  }

  if (!rawKeysStr || rawKeysStr.trim() === "") {
    throw new Error("لم يتم تكوين أي مفتاح ذكاء اصطناعي (Gemini API Key). يرجى إضافة مفتاح واحد أو أكثر في الإعدادات.");
  }

  // Parse keys split by commas, semicolons, Arabic commas, or newlines
  const keys = rawKeysStr
    .replace(/[;\n\r،]/g, ",")
    .split(",")
    .map(k => k.trim())
    .map(k => k.replace(/["']/g, "")) // remove potential quotes around pasted keys
    .filter(k => k.length > 0 && !k.startsWith("MY_GEMINI_API_KEY"));

  if (keys.length === 0) {
    throw new Error("مفاتيح الـ API المزودة ليست صالحة. يرجى إدخال مفاتيح صحيحة في الإعدادات.");
  }

  let lastError: any = null;
  for (let i = 0; i < keys.length; i++) {
    const apiKey = keys[i];
    try {
      const masked = apiKey.length > 10 
        ? `${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)}`
        : "***";
      console.log(`[Failover Engine] Attempting request using key index ${i} (${masked})`);
      
      const activeAi = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Try different models as fallbacks inside this key's logic to guarantee success
      const modelsToTry = [params.model];
      if (params.model !== "gemini-2.5-flash") modelsToTry.push("gemini-2.5-flash");
      if (params.model !== "gemini-flash-latest") modelsToTry.push("gemini-flash-latest");

      let keySuccessResponse: any = null;
      let lastModelError: any = null;

      for (const currentModel of modelsToTry) {
        try {
          console.log(`[Failover Engine] Trying model: ${currentModel} on key index ${i}`);
          const response = await activeAi.models.generateContent({
            model: currentModel,
            contents: params.contents,
            config: params.config
          });
          keySuccessResponse = response;
          console.log(`[Failover Engine] Request succeeded using model: ${currentModel} on key index ${i}!`);
          break; // break the model loop, we succeeded!
        } catch (modelErr: any) {
          console.warn(`[Failover Engine] Model ${currentModel} failed on key index ${i}. error: ${modelErr?.message || modelErr}`);
          lastModelError = modelErr;
          
          // If the API Key itself is invalid, no model will succeed. Let's break early to try next key.
          const errMsg = String(modelErr?.message || "").toLowerCase();
          if (errMsg.includes("api_key_invalid") || errMsg.includes("invalid api key") || errMsg.includes("not found or has been deactivated") || errMsg.includes("key is invalid")) {
            console.warn(`[Failover Engine] Key index ${i} appears fully invalid. Transitioning to next key immediately.`);
            break; 
          }
        }
      }

      if (keySuccessResponse) {
        return keySuccessResponse;
      } else {
        throw lastModelError || new Error("فشلت جميع المحاولات الطرازية لمفتاح الـ API هذا.");
      }

    } catch (err: any) {
      console.error(`[Failover Engine] Key index ${i} failed. Error: ${err?.message || err}`);
      lastError = err;
    }
  }

  throw new Error(`جميع مفاتيح الذكاء الاصطناعي الـ (${keys.length}) المتاحة فشلت في الاستجابة. الخطأ الأخير: ${lastError?.message || lastError}`);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use larger limits to support sending base64 photos
  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ limit: "30mb", extended: true }));

  // API endpoints
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, sentences, customApiKey, email } = req.body;
      
      const emailNormalized = email ? email.toLowerCase().trim() : "";
      const db = loadDatabase();
      const isAdminCheck = checkIsAdmin(emailNormalized, db);
      let isPremium = isAdminCheck;
      if (emailNormalized && !isPremium) {
        const user = db.users.find(u => u.email.toLowerCase().trim() === emailNormalized);
        if (user && user.isPremium) {
          isPremium = true;
        }
      }

      if (!isPremium) {
        return res.status(403).json({ error: "الدردشة الحية مع المعلم الذكي ميزة حصرية للاشتراك المدفوع Premium. يرجى الترقية للوصول إليها." });
      }

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

      const response = await generateContentWithFailover(customApiKey, {
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
      const { sentence, referenceSentence, customApiKey } = req.body;

      let prompt = "";
      if (referenceSentence) {
        prompt = `
          The user answered a German vocabulary quiz.
          The user's input sentence: "${sentence}"
          The expected correct reference sentence: "${referenceSentence}"

          Compare the user's input sentence with the reference sentence.
          Identify spelling issues, letter casing issues (remember German nouns must be capitalized), verb conjugation, grammar, or word ordering errors.
          Explain the reason for the mistakes in a simple, friendly, and brief way in Arabic.
          Also, break down the user's input words and classify each word's status. If a word in the user's input matches the correct word in the reference (allowing minor punctuation differences), mark its state as "correct". If it contains typos, incorrect conjugation, casing, or belongs in a different place (word order), mark its state as "error" and optionally provide a "suggestion".

          Please respond in strict JSON matching this structure:
          {
            "hasErrors": boolean (true if there are any spelling, syntax, casing, or word order differences compared to the reference sentence),
            "correctedText": "${referenceSentence}",
            "explanation": "A gentle and helpful explanation of all mistakes in Arabic. Why did they get it wrong? (e.g. خطأ في ترتيب الكلمات, خطأ إملائي, خطأ في تصريف الفعل...)",
            "highlightedWords": [
              {
                "word": "word_from_user_input",
                "state": "error" or "correct",
                "suggestion": "corrected_word_if_applicable"
              }
            ]
          }

          Ensure every word from the user's input sentence appears in the "highlightedWords" list in sequential order.
        `;
      } else {
        prompt = `
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
      }

      const response = await generateContentWithFailover(customApiKey, {
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

  app.post("/api/explain-lessons", async (req, res) => {
    try {
      const { topic, customApiKey, email } = req.body;
      
      if (!topic || topic.trim() === "") {
        return res.status(400).json({ error: "الرجاء توفير اسم قاعدة أو موضوع لغوي لشرحه." });
      }

      // Check access eligibility
      if (email) {
        const db = loadDatabase();
        const user = db.users.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim());
        const isUserAdmin = checkIsAdmin(email, db);
        const hasPremium = user?.isPremium || isUserAdmin;
        if (!hasPremium) {
          return res.status(403).json({ error: "شرح القواعد بالذكاء الاصطناعي متاح فقط للمشتركين ذوي العضوية الممتازة (Premium)." });
        }
      }

      const prompt = `
        You are an expert German language teacher who explains grammar rules to Arabic speakers.
        Explain the following topic, word or expression in German: "${topic}"
        
        Write a complete, highly pedagogical explanation containing:
        1. Explaining the conceptual rule clearly in Arabic.
        2. Give 3 diverse, practical German sentences as examples, with clear German text and their parallel literal and natural Arabic translation.
        3. A quick summary or rule-of-thumb tip at the end.
        
        Use friendly formatting, bullet points, clear spacing, but do not use markdown characters that would break JSON formatting or represent bad styling. Keep the layout beautiful. Focus purely on explaining the topic "${topic}" in a structured and easy-to-learn format.
      `;

      const response = await generateContentWithFailover(customApiKey, {
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a professional pedagogical German grammar tutor explaining rules for Arabic native speakers. Write beautiful explanations in neat text paragraphs.",
        }
      });

      res.json({ success: true, explanation: response.text || "" });
    } catch (error: any) {
      console.error("Gemini API Error (explain-lessons):", error);
      res.status(500).json({ error: error?.message || "Internal server error" });
    }
  });

  app.post("/api/analyse-speech", async (req, res) => {
    try {
      const { targetText, transcribedText, customApiKey } = req.body;

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

      const response = await generateContentWithFailover(customApiKey, {
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

  app.get("/api/tts", async (req, res) => {
    try {
      const text = req.query.q as string;
      const lang = (req.query.tl as string) || "de";
      if (!text) {
        return res.status(400).send("Missing text parameter.");
      }

      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(text)}`;

      const response = await fetch(ttsUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36"
        }
      });

      if (!response.ok) {
        return res.status(response.status).send("Failed to fetch TTS audio from upstream.");
      }

      res.setHeader("Content-Type", "audio/mpeg");
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (error: any) {
      console.error("TTS Proxy error:", error);
      res.status(500).send("Internal server error in TTS proxy.");
    }
  });

  // ==========================================
  // Custom API: Secure JSON File Auth Backend
  // ==========================================

  // 1. SIGNUP ENDPOINT
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { name, email, password, age, targetLevel } = req.body;
      if (!name || !email || !password || !age || !targetLevel) {
        return res.status(400).json({ error: "برجاء إدخال كافة الحقول المطلوبة!" });
      }

      const emailNormalized = email.toLowerCase().trim();
      const db = loadDatabase();

      if (db.users.some(u => u.email.toLowerCase().trim() === emailNormalized)) {
        return res.status(400).json({ error: "البريد الإلكتروني مسجل بالفعل لمستخدم آخر!" });
      }

      const newUser: DBUser = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: name.trim(),
        email: emailNormalized,
        passwordHash: hashPassword(password),
        age: parseInt(age) || 18,
        targetLevel,
        isPremium: false,
        premiumStatus: "none",
        xp: 50, // bonus sign-up XP
        level: 1,
        streak: 1,
        sentences: [],
        achievements: [],
        correctQuizzesCount: 0,
        successfulSpeechesCount: 0,
        chatTurnsCompleted: 0,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString()
      };

      db.appInstalls = (db.appInstalls || 1) + 1;
      db.users.push(newUser);
      saveDatabase(db);

      // Return user without hash
      const { passwordHash, ...userResponse } = newUser;
      res.json({ success: true, user: userResponse });
    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "حدث خطأ غير متوقع أثناء إنشاء الحساب." });
    }
  });

  // 2. LOGIN ENDPOINT
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "برجاء كتابة البريد الإلكتروني وكلمة المرور!" });
      }

      const emailNormalized = email.toLowerCase().trim();
      const hash = hashPassword(password);
      const db = loadDatabase();

      const user = db.users.find(u => u.email.toLowerCase().trim() === emailNormalized && u.passwordHash === hash);
      if (!user) {
        return res.status(401).json({ error: "خطأ في البريد الإلكتروني أو كلمة المرور!" });
      }

      user.lastActiveAt = new Date().toISOString();
      saveDatabase(db);

      const { passwordHash, ...userResponse } = user;
      res.json({ success: true, user: userResponse });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: "حدث خطأ أثناء تسجيل الدخول." });
    }
  });

  // 3. UPDATE PROFILE ENDPOINT
  app.post("/api/auth/update-profile", async (req, res) => {
    try {
      const { email, name, age, targetLevel } = req.body;
      if (!email) return res.status(400).json({ error: "البريد الإلكتروني مفقود!" });

      const emailNormalized = email.toLowerCase().trim();
      const db = loadDatabase();
      const uIndex = db.users.findIndex(u => u.email.toLowerCase().trim() === emailNormalized);

      if (uIndex === -1) {
        return res.status(404).json({ error: "المستخدم غير موجود!" });
      }

      if (name) db.users[uIndex].name = name.trim();
      if (age) db.users[uIndex].age = parseInt(age) || db.users[uIndex].age;
      if (targetLevel) db.users[uIndex].targetLevel = targetLevel;

      db.users[uIndex].lastActiveAt = new Date().toISOString();
      saveDatabase(db);

      const { passwordHash, ...userResponse } = db.users[uIndex];
      res.json({ success: true, user: userResponse });
    } catch (e) {
      res.status(500).json({ error: "فشل تحديث البيانات." });
    }
  });

  // 4. CHANGE PASSWORD ENDPOINT
  app.post("/api/auth/change-password", async (req, res) => {
    try {
      const { email, oldPassword, newPassword } = req.body;
      if (!email || !oldPassword || !newPassword) {
        return res.status(400).json({ error: "جميع حقول تغيير كلمة المرور مطلوبة!" });
      }

      const emailNormalized = email.toLowerCase().trim();
      const db = loadDatabase();
      const uIndex = db.users.findIndex(u => u.email.toLowerCase().trim() === emailNormalized);

      if (uIndex === -1) {
        return res.status(404).json({ error: "المستخدم غير موجود!" });
      }

      const oldHash = hashPassword(oldPassword);
      if (db.users[uIndex].passwordHash !== oldHash) {
        return res.status(400).json({ error: "كلمة المرور القديمة غير صحيحة!" });
      }

      db.users[uIndex].passwordHash = hashPassword(newPassword);
      saveDatabase(db);

      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "حدث خطأ أثناء تغيير كلمة المرور." });
    }
  });

  // 5. DATA SYNC ENDPOINT (sync sentences/stats/achievements)
  app.post("/api/auth/sync", async (req, res) => {
    try {
      const { 
        email, xp, level, streak, sentences, achievements, 
        correctQuizzesCount, successfulSpeechesCount, chatTurnsCompleted,
        isPremium, premiumExpiry, premiumPlan, premiumStatus
      } = req.body;

      if (!email) return res.status(400).json({ error: "بريد المزامنة مفقود!" });

      const emailNormalized = email.toLowerCase().trim();
      const db = loadDatabase();
      const uIndex = db.users.findIndex(u => u.email.toLowerCase().trim() === emailNormalized);

      if (uIndex === -1) {
        return res.status(404).json({ error: "المستخدم غير موجود للمزامنة!" });
      }

      // Update syncable metrics
      const user = db.users[uIndex];
      if (xp !== undefined) user.xp = xp;
      if (level !== undefined) user.level = level;
      if (streak !== undefined) user.streak = streak;
      if (sentences !== undefined) user.sentences = sentences;
      if (achievements !== undefined) user.achievements = achievements;
      if (correctQuizzesCount !== undefined) user.correctQuizzesCount = correctQuizzesCount;
      if (successfulSpeechesCount !== undefined) user.successfulSpeechesCount = successfulSpeechesCount;
      if (chatTurnsCompleted !== undefined) user.chatTurnsCompleted = chatTurnsCompleted;

      // Sync premium properties ONLY if they are not downgraded by mistake or keep server version authoritative for approval
      // Once a user is approved as Premium on the server, we MUST NOT allow any client sync to downgrade or reset them back to pending or none.
      if (user.premiumStatus !== "approved" && !user.isPremium) {
        if (premiumStatus === "pending") {
          user.premiumStatus = "pending";
          if (premiumPlan) user.premiumPlan = premiumPlan;
        }
      }

      user.lastActiveAt = new Date().toISOString();
      saveDatabase(db);

      const { passwordHash, ...userResponse } = user;
      const isAdminFlag = checkIsAdmin(emailNormalized, db);
      res.json({ success: true, user: { ...userResponse, isAdmin: isAdminFlag } });
    } catch (e) {
      res.status(500).json({ error: "فشل مزامنة البيانات." });
    }
  });

  // 6. PREMIUM UPGRADE REQUEST ENDPOINT
  app.post("/api/premium/request", async (req, res) => {
    try {
      const { email, userName, planName, price, paymentMethod, paypalAccount, transactionId, screenshot } = req.body;
      if (!email || !planName || !price || !paymentMethod) {
        return res.status(400).json({ error: "الحقول الأساسية مفقودة لطلب الاشتراك!" });
      }

      const emailNormalized = email.toLowerCase().trim();
      const db = loadDatabase();
      const user = db.users.find(u => u.email.toLowerCase().trim() === emailNormalized);

      if (!user) {
        return res.status(404).json({ error: "المستخدم المعني غير موجود!" });
      }

      // Create request entry
      const newRequest: DBPremiumRequest = {
        id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userEmail: emailNormalized,
        userName: userName || user.name,
        planName,
        price,
        paymentMethod,
        paypalAccount,
        transactionId,
        screenshot,
        status: "pending",
        createdAt: new Date().toISOString()
      };

      db.requests = [newRequest, ...db.requests];
      
      // Update user state to pending
      user.premiumStatus = "pending";
      user.premiumPlan = planName;

      saveDatabase(db);

      res.json({ success: true, request: newRequest });
    } catch (e) {
      console.error("Premium request submit error:", e);
      res.status(500).json({ error: "فشل إرسال طلب الترقية." });
    }
  });

  // NEW ADMIN: SERVER STATS REPORT (Total Users, Active Today, and App Installs)
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const { adminEmail } = req.query;
      const db = loadDatabase();
      if (!adminEmail || !checkIsAdmin(adminEmail as string, db)) {
        return res.status(403).json({ error: "إجراء غير مصرح به! الإحصائيات للمسؤول فقط." });
      }

      const totalUsers = db.users.length;

      // Active in last 24 hours
      const now = new Date();
      const activeUsersToday = db.users.filter(u => {
        if (!u.lastActiveAt) return false;
        const activeDate = new Date(u.lastActiveAt);
        const diffMs = now.getTime() - activeDate.getTime();
        return diffMs < 24 * 60 * 60 * 1000; // 24 hours
      }).length;

      const premiumUsersCount = db.users.filter(u => u.isPremium || u.premiumStatus === "approved").length;

      res.json({
        success: true,
        stats: {
          totalUsers,
          activeUsersToday: Math.max(1, activeUsersToday), // At least 1 active user is guaranteed (admin itself)
          appInstalls: db.appInstalls || 1,
          premiumUsersCount
        }
      });
    } catch (e) {
      res.status(500).json({ error: "حدث خطأ أثناء تحميل الإحصائيات الفورية." });
    }
  });

  // NEW METRIC: TRACK INSTALL EVENT (INCREMENTS APP INSTALLS)
  app.post("/api/metrics/install", async (req, res) => {
    try {
      const db = loadDatabase();
      db.appInstalls = (db.appInstalls || 1) + 1;
      saveDatabase(db);
      res.json({ success: true, appInstalls: db.appInstalls });
    } catch (e) {
      res.status(500).json({ error: "Failed to increment metrics." });
    }
  });

  // 7. ADMIN: GET ALL USERS (excluding hashes)
  app.get("/api/admin/users", async (req, res) => {
    try {
      const { adminEmail, q } = req.query;
      const db = loadDatabase();
      if (!adminEmail || !checkIsAdmin(adminEmail as string, db)) {
        return res.status(403).json({ error: "غير مصرح لك بالوصول! لوحة التحكم للمسؤولين فقط." });
      }

      let filteredUsers = db.users.map(({ passwordHash, ...u }) => u);

      if (q && (q as string).trim() !== "") {
        const query = (q as string).toLowerCase().trim();
        filteredUsers = filteredUsers.filter(u => 
          u.name.toLowerCase().includes(query) || 
          u.email.toLowerCase().includes(query) ||
          u.targetLevel.toLowerCase().includes(query)
        );
      }

      res.json({ success: true, users: filteredUsers });
    } catch (e) {
      res.status(500).json({ error: "فشل جلب قائمة المستخدمين." });
    }
  });

  // 8. ADMIN: GET ALL REQUESTS
  app.get("/api/admin/requests", async (req, res) => {
    try {
      const { adminEmail } = req.query;
      const db = loadDatabase();
      if (!adminEmail || !checkIsAdmin(adminEmail as string, db)) {
        return res.status(403).json({ error: "غير مصرح لك بالوصول!" });
      }

      const db = loadDatabase();
      res.json({ success: true, requests: db.requests });
    } catch (e) {
      res.status(500).json({ error: "فشل جلب طلبات الترقيات." });
    }
  });

  // 9. ADMIN: APPROVE REQUEST
  app.post("/api/admin/requests/:id/approve", async (req, res) => {
    try {
      const { id } = req.params;
      const { adminEmail } = req.body;
      const db = loadDatabase();

      if (!adminEmail || !checkIsAdmin(adminEmail as string, db)) {
        return res.status(403).json({ error: "لوحة التحكم للمدير فقط!" });
      }

      const db = loadDatabase();
      const reqIndex = db.requests.findIndex(r => r.id === id);
      if (reqIndex === -1) {
        return res.status(404).json({ error: "الطلب غير موجود للتنشيط!" });
      }

      const targetReq = db.requests[reqIndex];
      let days = 30;
      if (targetReq.planName.includes("شهرين")) days = 60;
      else if (targetReq.planName.includes("3 أشهر")) days = 90;
      else if (targetReq.planName.includes("سنة")) days = 365;

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);
      const expiryIso = expiryDate.toISOString();

      // Update Request status
      targetReq.status = "approved";
      targetReq.expiryDate = expiryIso;

      // Update actual user status
      const uIndex = db.users.findIndex(u => u.email.toLowerCase().trim() === targetReq.userEmail.toLowerCase().trim());
      if (uIndex !== -1) {
        db.users[uIndex].isPremium = true;
        db.users[uIndex].premiumStatus = "approved";
        db.users[uIndex].premiumExpiry = expiryIso;
        db.users[uIndex].premiumPlan = targetReq.planName;
      }

      saveDatabase(db);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "فشل معالجة وقبول الطلب." });
    }
  });

  // 10. ADMIN: REJECT REQUEST
  app.post("/api/admin/requests/:id/reject", async (req, res) => {
    try {
      const { id } = req.params;
      const { adminEmail } = req.body;
      const db = loadDatabase();

      if (!adminEmail || !checkIsAdmin(adminEmail as string, db)) {
        return res.status(403).json({ error: "لوحة التحكم للمدير فقط!" });
      }

      const db = loadDatabase();
      const reqIndex = db.requests.findIndex(r => r.id === id);
      if (reqIndex === -1) {
        return res.status(404).json({ error: "الطلب غير موجود للرفض!" });
      }

      const targetReq = db.requests[reqIndex];
      targetReq.status = "rejected";

      // Update actual user status
      const uIndex = db.users.findIndex(u => u.email.toLowerCase().trim() === targetReq.userEmail.toLowerCase().trim());
      if (uIndex !== -1) {
        db.users[uIndex].isPremium = false;
        db.users[uIndex].premiumStatus = "rejected";
        db.users[uIndex].premiumPlan = undefined;
        db.users[uIndex].premiumExpiry = undefined;
      }

      saveDatabase(db);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "فشل رفض المعاملة." });
    }
  });

  // 11. ADMIN: MANUAL TOGGLE USER PREMIUM / DELETE USER
  app.post("/api/admin/users/:userId/toggle-premium", async (req, res) => {
    try {
      const { userId } = req.params;
      const { adminEmail, isPremium, planName } = req.body;
      const db = loadDatabase();

      if (!adminEmail || !checkIsAdmin(adminEmail as string, db)) {
        return res.status(403).json({ error: "إجراء خاص بالمسؤولين فقط!" });
      }

      const uIndex = db.users.findIndex(u => u.id === userId);
      if (uIndex === -1) {
        return res.status(404).json({ error: "المستخدم غير موجود!" });
      }

      const user = db.users[uIndex];
      user.isPremium = isPremium;
      user.premiumStatus = isPremium ? "approved" : "none";
      if (isPremium) {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        user.premiumPlan = planName || "تنشيط يدوي من الإدارة 🔬";
        user.premiumExpiry = d.toISOString();
      } else {
        user.premiumPlan = undefined;
        user.premiumExpiry = undefined;
      }

      saveDatabase(db);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "فشل تعديل اشتراك المستخدم." });
    }
  });

  app.post("/api/admin/users/:userId/toggle-admin", async (req, res) => {
    try {
      const { userId } = req.params;
      const { adminEmail, isAdmin } = req.body;
      const db = loadDatabase();

      if (!adminEmail || !checkIsAdmin(adminEmail as string, db)) {
        return res.status(403).json({ error: "إجراء خاص بالمسؤولين فقط!" });
      }

      const uIndex = db.users.findIndex(u => u.id === userId);
      if (uIndex === -1) {
        return res.status(404).json({ error: "المستخدم غير موجود!" });
      }

      const user = db.users[uIndex];
      if (user.email.toLowerCase().trim() === "ashrafadelnn666@gmail.com" && !isAdmin) {
        return res.status(400).json({ error: "لا يمكنك إلغاء صلاحية المسؤول للمالك الأساسي!" });
      }

      (user as any).isAdmin = !!isAdmin;
      saveDatabase(db);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "فشل تعديل صلاحية الإدارة للمستخدم." });
    }
  });

  app.post("/api/admin/users/:userId/delete", async (req, res) => {
    try {
      const { userId } = req.params;
      const { adminEmail } = req.body;
      const db = loadDatabase();

      if (!adminEmail || !checkIsAdmin(adminEmail as string, db)) {
        return res.status(403).json({ error: "إجراء خاص بالمسؤولين فقط!" });
      }

      const db = loadDatabase();
      const uIndex = db.users.findIndex(u => u.id === userId);
      if (uIndex === -1) {
        return res.status(404).json({ error: "المستخدم غير موجود!" });
      }

      // Avoid deleting self
      if (db.users[uIndex].email.toLowerCase().trim() === "ashrafadelnn666@gmail.com") {
        return res.status(400).json({ error: "لا يمكنك حذف حساب المدير العام الأساسي لنفسك!" });
      }

      db.users.splice(uIndex, 1);
      saveDatabase(db);

      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "فشل حذف حساب المستخدم." });
    }
  });

  // 12. LANGUAGE COMMUNITY VOICE ROOMS API
  interface RoomParticipant {
    id: string;
    name: string;
    isHost: boolean;
    isMuted: boolean;
    isHandRaised: boolean;
    connected: boolean;
    lastActive: number;
  }

  interface VoiceRoom {
    id: string;
    name: string;
    level: string; // A1, A2, B1, B2, C1, Custom
    hostEmail: string;
    hostName: string;
    participants: RoomParticipant[];
    createdAt: string;
  }

  let activeRooms: VoiceRoom[] = [
    {
      id: "public-a1",
      name: "الغرفة الصوتية العامة للمستوى المبتدئ A1 🇩🇪",
      level: "A1",
      hostEmail: "system",
      hostName: "المشرف التلقائي",
      participants: [],
      createdAt: new Date().toISOString()
    },
    {
      id: "public-b1",
      name: "مناقشة بطلاقة للمستوى المتوسط B1 🌟",
      level: "B1",
      hostEmail: "system",
      hostName: "المشرف التلقائي",
      participants: [],
      createdAt: new Date().toISOString()
    },
    {
      id: "public-c1",
      name: "ملتقى الخبراء للمستوى المتقدم C1 ♕",
      level: "C1",
      hostEmail: "system",
      hostName: "المشرف التلقائي",
      participants: [],
      createdAt: new Date().toISOString()
    }
  ];

  app.get("/api/community/rooms", (req, res) => {
    res.json({ success: true, rooms: activeRooms });
  });

  app.post("/api/community/rooms", (req, res) => {
    try {
      const { name, level, hostName, hostEmail } = req.body;
      if (!name || !level || !hostName) {
        return res.status(400).json({ error: "الرجاء توفير كافة التفاصيل لإنشاء الغرفة." });
      }

      const newRoom: VoiceRoom = {
        id: "room-" + crypto.randomUUID(),
        name,
        level,
        hostEmail: hostEmail || "anonymous",
        hostName,
        participants: [
          {
            id: hostEmail || "host-uid",
            name: hostName,
            isHost: true,
            isMuted: false,
            isHandRaised: false,
            connected: true,
            lastActive: Date.now()
          }
        ],
        createdAt: new Date().toISOString()
      };

      activeRooms.push(newRoom);
      res.json({ success: true, room: newRoom });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "فشل إنشاء الغرفة الدولية." });
    }
  });

  app.post("/api/community/rooms/:roomId/join", (req, res) => {
    try {
      const { roomId } = req.params;
      const { participantId, participantName, isHost } = req.body;
      if (!participantId || !participantName) {
        return res.status(400).json({ error: "بيانات المشارك غير مكتملة." });
      }

      const room = activeRooms.find(r => r.id === roomId);
      if (!room) {
        return res.status(404).json({ error: "الغرفة غير موجودة في النظام." });
      }

      const existingIndex = room.participants.findIndex(p => p.id === participantId);
      if (existingIndex !== -1) {
        room.participants[existingIndex].connected = true;
        room.participants[existingIndex].lastActive = Date.now();
      } else {
        // Clear out this user from any other room they might be in
        activeRooms.forEach(r => {
          r.participants = r.participants.filter(p => p.id !== participantId);
        });

        room.participants.push({
          id: participantId,
          name: participantName,
          isHost: isHost || false,
          isMuted: false,
          isHandRaised: false,
          connected: true,
          lastActive: Date.now()
        });
      }

      res.json({ success: true, room });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/community/rooms/:roomId/update", (req, res) => {
    try {
      const { roomId } = req.params;
      const { participantId, isMuted, isHandRaised, connected } = req.body;

      const room = activeRooms.find(r => r.id === roomId);
      if (!room) {
        return res.status(404).json({ error: "الغرفة غير موجودة." });
      }

      const p = room.participants.find(part => part.id === participantId);
      if (p) {
        if (isMuted !== undefined) p.isMuted = isMuted;
        if (isHandRaised !== undefined) p.isHandRaised = isHandRaised;
        if (connected !== undefined) p.connected = connected;
        p.lastActive = Date.now();
      }

      res.json({ success: true, room });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/community/rooms/:roomId/kick", (req, res) => {
    try {
      const { roomId } = req.params;
      const { targetParticipantId } = req.body;

      const room = activeRooms.find(r => r.id === roomId);
      if (!room) {
        return res.status(404).json({ error: "الغرفة غير موجودة." });
      }

      room.participants = room.participants.filter(p => p.id !== targetParticipantId);
      res.json({ success: true, room });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/community/rooms/:roomId/mute", (req, res) => {
    try {
      const { roomId } = req.params;
      const { targetParticipantId, muteState } = req.body;

      const room = activeRooms.find(r => r.id === roomId);
      if (!room) {
        return res.status(404).json({ error: "الغرفة غير موجودة." });
      }

      const p = room.participants.find(part => part.id === targetParticipantId);
      if (p) {
        p.isMuted = muteState;
      }

      res.json({ success: true, room });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/community/rooms/:roomId/leave", (req, res) => {
    try {
      const { roomId } = req.params;
      const { participantId } = req.body;

      const room = activeRooms.find(r => r.id === roomId);
      if (room) {
        room.participants = room.participants.filter(p => p.id !== participantId);
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
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
