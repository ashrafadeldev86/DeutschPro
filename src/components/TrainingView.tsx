import React, { useState, useEffect, useRef } from "react";
import { Sentence, UserProfile } from "../types";
import { 
  Sparkles, ArrowRight, RotateCcw, Check, X, HelpCircle, 
  GraduationCap, Award, Brain, Star, CheckCircle2, AlertCircle, ArrowLeftRight 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TrainingViewProps {
  sentences: Sentence[];
  onAwardXp: (amount: number, type: string) => void;
  profile: UserProfile;
  onProgressChange?: (hasProgress: boolean, percent: number, remaining: number) => void;
}

interface Question {
  sentence: Sentence;
  type: "word_ordering" | "de_to_ar" | "ar_to_de";
  scrambledWords: string[];
}

interface TranslationResult {
  status: "correct" | "incorrect" | "checking" | "";
  explanation?: string;
  highlightedWords?: Array<{ word: string; state: "correct" | "error"; suggestion?: string }>;
}

export default function TrainingView({ 
  sentences, 
  onAwardXp, 
  profile,
  onProgressChange 
}: TrainingViewProps) {
  // Session definition
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionXpEarned, setSessionXpEarned] = useState(0);

  // Active question state
  const currentQuestion = sessionQuestions[currentIndex] || null;

  // Word Ordering States (for active question if type is word_ordering)
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [currentScrambled, setCurrentScrambled] = useState<string[]>([]);

  // Translation States (for text inputs)
  const [userTranslation, setUserTranslation] = useState<string>("");
  const [translationResult, setTranslationResult] = useState<TranslationResult>({ status: "" });

  const [errorMessage, setErrorMessage] = useState("");
  const [autoNextCountdown, setAutoNextCountdown] = useState<number | null>(null);
  const autoNextTimerRef = useRef<any>(null);

  // Load / Start a smart session
  const startNewSession = () => {
    if (sentences.length === 0) {
      setSessionQuestions([]);
      return;
    }

    // Get today's key for completed sentences
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    const completedTodayRaw = localStorage.getItem(`completed_sentences_${todayStr}`);
    const completedTodayIds = completedTodayRaw ? JSON.parse(completedTodayRaw) : [];

    // Calculate priority weights
    const getSentenceWeight = (s: Sentence) => {
      // 1. If completed today, extremely low weight to avoid repetition
      if (completedTodayIds.includes(s.id)) {
        return 0.02;
      }

      let weight = 1.0;

      // 2. Newly added sentence weight (Timestamp in ID is within last 24 hours, or level is 0)
      const parts = s.id.split("-");
      let isNew = false;
      if (parts.length >= 2) {
        const timestamp = parseInt(parts[1], 10);
        if (!isNaN(timestamp)) {
          const hoursAgo = (Date.now() - timestamp) / (1000 * 60 * 60);
          if (hoursAgo <= 24) isNew = true;
        }
      }
      if (s.level === 0) isNew = true;

      if (isNew) {
        weight += 12.0; // Huge priority boost for tomorrow/next-day appearance
      }

      // 3. Spaced-repetition due sentences
      const isDue = new Date(s.nextReview) <= new Date();
      if (isDue) {
        weight += 5.0; // Due reviews
      }

      return weight;
    };

    // Calculate weights for all sentences
    const weightedPool = sentences.map(s => ({
      sentence: s,
      weight: getSentenceWeight(s)
    }));

    // Selection helper (weighted random sampling without duplicate IDs in the same session)
    const selectedSentences: Sentence[] = [];
    const poolCopy = [...weightedPool];

    // Determine session size (Target 10 questions, or max sentences)
    const targetSize = Math.min(10, sentences.length);

    for (let i = 0; i < targetSize; i++) {
      if (poolCopy.length === 0) break;
      
      const totalWeight = poolCopy.reduce((sum, item) => sum + item.weight, 0);
      let r = Math.random() * totalWeight;
      let selectionIdx = 0;
      
      for (let j = 0; j < poolCopy.length; j++) {
        r -= poolCopy[j].weight;
        if (r <= 0) {
          selectionIdx = j;
          break;
        }
      }

      selectedSentences.push(poolCopy[selectionIdx].sentence);
      poolCopy.splice(selectionIdx, 1); // remove to prevent duplicates in same session
    }

    // Now construct questions from selected sentences with dynamic randomized types
    const questionTypes: Array<"word_ordering" | "de_to_ar" | "ar_to_de"> = [
      "word_ordering",
      "de_to_ar",
      "ar_to_de"
    ];

    const generatedQuestions: Question[] = selectedSentences.map(s => {
      // Pick a random question type
      const chosenType = questionTypes[Math.floor(Math.random() * questionTypes.length)];

      // Prepare scrambled words if word ordering
      const cleanGerman = s.german
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
        .trim();
      const words = cleanGerman.split(/\s+/).filter((w) => w.trim() !== "");
      const scrambled = [...words].sort(() => 0.5 - Math.random());

      return {
        sentence: s,
        type: chosenType,
        scrambledWords: scrambled
      };
    });

    setSessionQuestions(generatedQuestions);
    setCurrentIndex(0);
    setSessionCompleted(false);
    setSessionXpEarned(0);
    resetModes();
  };

  // Start session on mount or sentences change
  useEffect(() => {
    startNewSession();
  }, [sentences.length]);

  useEffect(() => {
    if (onProgressChange) {
      const hasProgress = currentIndex > 0 && !sessionCompleted && sessionQuestions.length > 0;
      const pct = sessionQuestions.length > 0 ? Math.round((currentIndex / sessionQuestions.length) * 100) : 0;
      const remaining = sessionQuestions.length - currentIndex;
      onProgressChange(hasProgress, pct, remaining);
    }
  }, [currentIndex, sessionCompleted, sessionQuestions.length, onProgressChange]);

  // Handle active countdown
  useEffect(() => {
    if (autoNextCountdown !== null) {
      if (autoNextCountdown > 0) {
        autoNextTimerRef.current = setTimeout(() => {
          setAutoNextCountdown((prev) => (prev !== null ? prev - 1 : null));
        }, 1000);
      } else {
        handleNextQuestion();
      }
    }
    return () => {
      if (autoNextTimerRef.current) clearTimeout(autoNextTimerRef.current);
    };
  }, [autoNextCountdown]);

  // Setup current question states
  useEffect(() => {
    if (!currentQuestion) return;
    resetQuestionState();
  }, [currentQuestion]);

  const resetModes = () => {
    setAutoNextCountdown(null);
    if (autoNextTimerRef.current) clearTimeout(autoNextTimerRef.current);
    setTranslationResult({ status: "" });
    setErrorMessage("");
    setUserTranslation("");
    setSelectedWords([]);
  };

  const resetQuestionState = () => {
    resetModes();
    if (!currentQuestion) return;

    if (currentQuestion.type === "word_ordering") {
      setCurrentScrambled([...currentQuestion.scrambledWords]);
      setSelectedWords([]);
    }
  };

  const handleNextQuestion = () => {
    resetModes();
    if (currentIndex + 1 >= sessionQuestions.length) {
      setSessionCompleted(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Mark sentence as solved today
  const saveSentenceAsCompletedToday = (sentenceId: string) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    const key = `completed_sentences_${todayStr}`;
    const currentCompleted = localStorage.getItem(key);
    const completedIds = currentCompleted ? JSON.parse(currentCompleted) : [];
    
    if (!completedIds.includes(sentenceId)) {
      completedIds.push(sentenceId);
      localStorage.setItem(key, JSON.stringify(completedIds));
    }
  };

  // Word Ordering Mechanics
  const selectWord = (word: string, index: number) => {
    if (translationResult.status === "correct") return;
    setSelectedWords([...selectedWords, word]);
    
    const newScrambled = [...currentScrambled];
    newScrambled.splice(index, 1);
    setCurrentScrambled(newScrambled);
  };

  const deselectWord = (word: string, index: number) => {
    if (translationResult.status === "correct") return;
    setCurrentScrambled([...currentScrambled, word]);
    
    const newSelected = [...selectedWords];
    newSelected.splice(index, 1);
    setSelectedWords(newSelected);
  };

  const checkWordOrder = () => {
    if (!currentQuestion) return;
    const cleanGermanRef = currentQuestion.sentence.german
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
      .toLowerCase()
      .trim();
    const userCombined = selectedWords.join(" ").toLowerCase().trim();

    if (userCombined === cleanGermanRef) {
      setTranslationResult({ status: "correct" });
      setSessionXpEarned(prev => prev + 10);
      onAwardXp(10, "correct_quizzes");
      saveSentenceAsCompletedToday(currentQuestion.sentence.id);
      setAutoNextCountdown(3);
    } else {
      setTranslationResult({ status: "incorrect", explanation: "ترتيب الكلمات غير صحيح. حاول إعادة التجميع أو تصفّح الحل." });
    }
  };

  // German to Arabic Translate Check
  const checkDeToAr = () => {
    if (!currentQuestion) return;
    const cleanRef = currentQuestion.sentence.arabic.replace(/[.,?!/،]/g, "").trim();
    const cleanUser = userTranslation.replace(/[.,?!/،]/g, "").trim();

    if (cleanUser === "") {
      setErrorMessage("الرجاء كتابة ترجمة الجملة.");
      return;
    }

    setTranslationResult({ status: "checking" });

    // Similarity checking (exact or substring heuristic)
    const isVeryClose = 
      cleanUser === cleanRef || 
      cleanRef.includes(cleanUser) && cleanUser.length > cleanRef.length * 0.6 ||
      cleanUser.includes(cleanRef) && cleanRef.length > cleanUser.length * 0.6;

    setTimeout(() => {
      if (isVeryClose) {
        setTranslationResult({ status: "correct" });
        setSessionXpEarned(prev => prev + 15);
        onAwardXp(15, "correct_quizzes");
        saveSentenceAsCompletedToday(currentQuestion.sentence.id);
        setAutoNextCountdown(3);
      } else {
        setTranslationResult({ 
          status: "incorrect",
          explanation: "الترجمة المدخلة لا تطابق الحل النموذجي بالكامل. تحقق من الصياغة النموذجية."
        });
      }
    }, 450);
  };

  // Arabic to German Translate Check (with Gemini check endpoint)
  const checkArToDe = async () => {
    if (!currentQuestion) return;
    if (!userTranslation.trim()) {
      setErrorMessage("الرجاء كتابة الصياغة الألمانية.");
      return;
    }

    setTranslationResult({ status: "checking" });
    setErrorMessage("");

    try {
      const storedKey = localStorage.getItem("deutsch_spaced_rep_api_key_override") || "";
      const response = await fetch("/api/check-grammar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sentence: userTranslation.trim(),
          referenceSentence: currentQuestion.sentence.german,
          customApiKey: storedKey
        })
      });

      if (!response.ok) {
        throw new Error("فشلت عملية التحليل الذكية على الخادم.");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const hasErrors = data.hasErrors;
      if (!hasErrors) {
        setTranslationResult({
          status: "correct",
          explanation: data.explanation || "صياغة ألمانية سليمة ومطابقة تماماً!",
          highlightedWords: data.highlightedWords
        });
        setSessionXpEarned(prev => prev + 20);
        onAwardXp(20, "correct_quizzes");
        saveSentenceAsCompletedToday(currentQuestion.sentence.id);
        setAutoNextCountdown(3);
      } else {
        setTranslationResult({
          status: "incorrect",
          explanation: data.explanation || "توجد بعض الأخطاء الإملائية أو التركيبية في صياغتك.",
          highlightedWords: data.highlightedWords
        });
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "حدث خطأ أثناء فحص القواعد بالذكاء الاصطناعي.");
      setTranslationResult({ status: "" });
    }
  };

  // Stat calculations
  const totalQuestions = sessionQuestions.length;
  const completedQuestionsCount = currentIndex;
  const remainingQuestionsCount = Math.max(0, totalQuestions - currentIndex);
  const progressPercentage = totalQuestions > 0 ? Math.round((completedQuestionsCount / totalQuestions) * 100) : 0;

  if (sentences.length === 0) {
    return (
      <div id="no-sentences-blank" className="p-8 md:p-12 text-center rounded-3xl bg-slate-950/40 border border-slate-900 max-w-xl mx-auto space-y-6 dir-rtl text-right">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 text-3xl">
          💡
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-black text-white">لا توجد جمل مفعّلة في مخزنك</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            يعتمد نظام التدريب الذكي على الجمل والمفردات التي تدونها بنفسك في التطبيق لإنتاج أسئلة تكرار متباعد ذكية مخصصة لك بالكامل.
          </p>
        </div>
        <div className="p-4 bg-slate-900/60 rounded-xl text-xs text-slate-400 border border-slate-850">
          انتقل إلى تبويب <strong className="text-blue-400">"إضافة جملة" ✍️</strong> وأضف جملك الأولى لتمكين التدريبات التفاعلية الممتعة.
        </div>
      </div>
    );
  }

  // Session stats end view
  if (sessionCompleted) {
    return (
      <div id="session-completed-screen" className="max-w-xl mx-auto p-6 md:p-8 rounded-3xl bg-slate-900 border border-purple-500/20 shadow-2xl text-center space-y-6 text-right dir-rtl" dir="rtl">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="space-y-4"
        >
          <div className="w-16 h-16 bg-gradient-to-tr from-yellow-500 to-amber-500 rounded-full flex items-center justify-center mx-auto text-3xl shadow-[0_0_20px_rgba(234,179,8,0.3)] animate-bounce">
            👑
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl font-black text-white">اكتمل التحدي الذكي اللحظي! 🎉</h3>
            <p className="text-xs text-slate-400 font-sans">
              لقد أتممت مراجعة ذكية ناجحة ممتازة لجزء من حصيلتك اللغوية اليوم.
            </p>
          </div>

          {/* Session details */}
          <div className="grid grid-cols-2 gap-3 py-4">
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-850">
              <span className="text-[10px] text-slate-500 font-bold block">إجمالي النقاط المكتسبة:</span>
              <span className="text-lg font-black text-yellow-500 font-sans">+{sessionXpEarned} XP</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-850">
              <span className="text-[10px] text-slate-500 font-bold block">عدد الجمل المنجزة:</span>
              <span className="text-lg font-black text-purple-400 font-sans">{totalQuestions} جملة</span>
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl text-xs text-slate-400 leading-relaxed font-sans">
            🌟 استمر في إضافة جمل جديدة يومياً. سيقوم النظام بدمجها بذكاء مع ذكرياتك القديمة لمنحك مراجعة متزنة دون تكرار مزعج.
          </div>

          <button
            onClick={startNewSession}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-sm rounded-xl transition-all cursor-pointer shadow-lg shadow-purple-500/20"
          >
            بدء جلسة تدريبية ذكية جديدة 🔄
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div id="smart-training-panel" className="space-y-6 max-w-4xl mx-auto px-4 py-2 text-right dir-rtl" dir="rtl">
      
      {/* 1. PROFESSIONAL PROGRESS BAR CONTAINER */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-950 to-blue-950/20 border border-slate-900 shadow-xl space-y-4">
        
        {/* Progress Header metrics with Larger easier-to-read text */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          
          <div className="flex items-center gap-2.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-850">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[9px] text-slate-500 font-bold block">الأسئلة المنجزة</span>
              <span className="text-sm font-black text-white font-sans">{completedQuestionsCount} <span className="text-[10px] text-slate-400">/ {totalQuestions}</span></span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-850">
            <Brain className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <span className="text-[9px] text-slate-500 font-bold block">الأسئلة المتبقية</span>
              <span className="text-sm font-black text-white font-sans">{remainingQuestionsCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-850">
            <Award className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <span className="text-[9px] text-slate-500 font-bold block">نقاط الجلسة</span>
              <span className="text-sm font-black text-cyan-400 font-sans">+{sessionXpEarned} XP</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-850">
            <Star className="w-5 h-5 text-yellow-500 shrink-0" />
            <div>
              <span className="text-[9px] text-slate-500 font-bold block">المستوى الحالي</span>
              <span className="text-sm font-black text-yellow-400 font-sans">LVL {profile.level}</span>
            </div>
          </div>

        </div>

        {/* Slidy progress bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
            <span>نسبة إنجاز الجلسة: <span className="text-purple-400 font-black">{progressPercentage}%</span></span>
            <span className="bg-purple-950 text-purple-300 border border-purple-900 px-2 py-0.5 rounded uppercase font-black tracking-wider">تدريب ذكي آلي</span>
          </div>
          <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800 flex">
            <motion.div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

      </div>

      {/* 2. QUESTION SCREEN */}
      {currentQuestion && (
        <div className="relative overflow-hidden rounded-3xl bg-slate-900/40 border border-slate-800 p-6 sm:p-8 backdrop-blur-xl">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.sentence.id + "_" + currentQuestion.type}
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              
              {/* Question Header Card styling depending on type */}
              <div className="flex items-center justify-between border-b border-slate-850 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl">
                    <ArrowLeftRight className="w-5 h-5 shrink-0" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">نوع السؤال الحالي (توليد عشوائي):</span>
                    <span className="text-xs font-black text-white">
                      {currentQuestion.type === "word_ordering" && "🧩 ترتيب مكعبات الكلمات الألمانية"}
                      {currentQuestion.type === "de_to_ar" && "🇩🇪 ترجم من الألمانية للفصحى"}
                      {currentQuestion.type === "ar_to_de" && "🇦🇪 ترجم من العربية للألمانية"}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-850 px-3 py-1 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest font-sans">
                  {currentQuestion.sentence.langLevel || "DEUTSCH"}
                </div>
              </div>

              {/* A. WORD ORDERING INTERACTIVE BOX */}
              {currentQuestion.type === "word_ordering" && (
                <div className="space-y-6 text-center">
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-500 font-bold block">رتّب مكعبات الكلمات لتركيب الجملة الألمانية الصحيحة المقابلة لـ:</span>
                    <h3 className="text-lg sm:text-xl font-black text-white text-center leading-relaxed">
                      {currentQuestion.sentence.arabic}
                    </h3>
                  </div>

                  {/* Target Selected Slot */}
                  <div className="min-h-16 w-full p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-wrap gap-2.5 items-center justify-center relative">
                    {selectedWords.length === 0 && (
                      <span className="text-xs text-slate-600 select-none absolute">اضغط على البطاقات في الأسفل لتركيب الجملة بالترتيب الصحيح</span>
                    )}
                    {selectedWords.map((word, idx) => (
                      <motion.button
                        layoutId={`word_card_selected_${idx}`}
                        key={`sel_${idx}`}
                        onClick={() => deselectWord(word, idx)}
                        className="px-4 py-2.5 min-h-[44px] rounded-xl bg-purple-600/30 text-purple-200 border border-purple-500/40 text-xs font-black font-sans cursor-pointer hover:bg-red-950/40 hover:border-red-900/40 hover:text-rose-400 transition-all shadow-md flex items-center justify-center"
                      >
                        {word}
                      </motion.button>
                    ))}
                  </div>

                  {/* Scrambled Area */}
                  <div className="space-y-3 pt-2">
                    <span className="text-[10px] text-slate-500 font-bold block">مكعبات الكلمات المتاحة (رتبها من اليمين لليسرى):</span>
                    <div className="flex flex-wrap gap-2.5 justify-center items-center">
                      {currentScrambled.map((word, idx) => (
                        <motion.button
                          layoutId={`word_card_scrambled_${word}_${idx}`}
                          key={`scram_${idx}`}
                          onClick={() => selectWord(word, idx)}
                          className="px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-200 border border-slate-850 hover:border-slate-700 text-xs font-black font-sans cursor-pointer transition-all active:scale-95 shadow-md flex items-center justify-center"
                        >
                          {word}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Submit controller */}
                  {translationResult.status === "" && (
                    <div className="flex items-center justify-between pt-4 border-t border-slate-850">
                      <button
                        onClick={resetQuestionState}
                        className="px-4 py-3 min-h-[48px] bg-slate-950 border border-slate-850 hover:bg-slate-900 rounded-xl text-xs font-bold text-slate-400 flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4 shrink-0 text-slate-500" />
                        إعادة التصفير
                      </button>

                      <button
                        onClick={checkWordOrder}
                        disabled={selectedWords.length === 0}
                        className="px-6 py-3 min-h-[48px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-lg shadow-purple-500/20 disabled:opacity-50"
                      >
                        تحقق من صحة الترتيب ✓
                      </button>
                    </div>
                  )}

                </div>
              )}

              {/* B. GERMAN TO ARABIC TRANSLATION */}
              {currentQuestion.type === "de_to_ar" && (
                <div className="space-y-6">
                  <div className="space-y-2 text-center">
                    <span className="text-[10px] text-slate-500 font-bold block">اكتب ترجمة العبارة التالية باللغة العربية الفصحى:</span>
                    <h3 className="text-xl md:text-2xl font-sans font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-105 via-blue-200 to-purple-200 leading-relaxed text-center">
                      {currentQuestion.sentence.german}
                    </h3>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 font-bold block text-right">أدخل ترجمتك الفصحى:</label>
                    <input
                      type="text"
                      dir="rtl"
                      placeholder="اكتب الإجابة باللغة العربية..."
                      disabled={translationResult.status !== ""}
                      value={userTranslation}
                      onChange={(e) => {
                        setUserTranslation(e.target.value);
                        setErrorMessage("");
                      }}
                      className="w-full min-h-[52px] bg-slate-950 border border-slate-800 rounded-xl px-4 text-xs font-bold text-white text-right focus:outline-none focus:border-purple-600 transition-colors placeholder:text-slate-700 disabled:opacity-50"
                    />
                  </div>

                  {translationResult.status === "" && (
                    <div className="flex items-center justify-end pt-2">
                      <button
                        onClick={checkDeToAr}
                        className="px-6 py-3 min-h-[48px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg shadow-purple-500/20"
                      >
                        تحقق من الترجمة ➔
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* C. ARABIC TO GERMAN SPECIAL DRAFT TRANSLATION */}
              {currentQuestion.type === "ar_to_de" && (
                <div className="space-y-6">
                  <div className="space-y-2 text-center">
                    <span className="text-[10px] text-slate-500 font-bold block">ترجم العبارة العربية التالية إلى الألمانية السليمة:</span>
                    <h3 className="text-[17px] font-black text-white leading-relaxed text-center max-w-2xl mx-auto">
                      {currentQuestion.sentence.arabic}
                    </h3>
                    <p className="text-[9px] text-slate-400">ملاحظة: تذكر مطابقة الحروف الكبيرة (Capital Letters) للأسماء الألمانية.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 font-bold block text-left">الصياغة الألمانية المقترحة لك:</label>
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="Schreibe auf Deutsch..."
                      disabled={translationResult.status !== ""}
                      value={userTranslation}
                      onChange={(e) => {
                        setUserTranslation(e.target.value);
                        setErrorMessage("");
                      }}
                      className="w-full min-h-[52px] bg-slate-950 border border-slate-800 rounded-xl px-4 text-xs font-bold text-white text-left font-sans focus:outline-none focus:border-purple-600 transition-colors placeholder:text-slate-700 disabled:opacity-50"
                    />
                  </div>

                  {translationResult.status === "" && (
                    <div className="flex items-center justify-end pt-2">
                      <button
                        onClick={checkArToDe}
                        disabled={translationResult.status === "checking"}
                        className="px-6 py-3 min-h-[48px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg shadow-purple-500/10 disabled:opacity-50"
                      >
                        {translationResult.status === "checking" ? "جاري التدقيق بالذكاء الاصطناعي..." : "فحص ودقّق بالـ AI ✦"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Local errors display */}
              {errorMessage && (
                <div className="p-3.5 bg-red-950/20 text-red-300 border border-red-900/50 rounded-xl text-xs text-center font-bold">
                  {errorMessage}
                </div>
              )}

              {/* 3. RESPONSIVE MODAL OR CORRECT/INCORRECT DRAWER STATES */}
              {(translationResult.status && translationResult.status !== "checking") && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="space-y-4 pt-5 border-t border-slate-850"
                >
                  
                  {/* CORRECT DESIGN CARD */}
                  {translationResult.status === "correct" && (
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-emerald-900/10 border border-emerald-500/40 text-emerald-300 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                          <Check className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                          <span className="text-[15px] font-black block">إجابة صحيحة ✓</span>
                          <p className="text-[11px] text-slate-350 leading-relaxed font-sans">
                            {currentQuestion.type === "word_ordering" ? "أداء مبهر، ترتيب الكلمات الألماني سليم ومتقن بالكامل." : "ممتاز، الترجمة صحيحة ومتناسقة لغوياً."}
                          </p>
                        </div>
                      </div>

                      {autoNextCountdown !== null && (
                        <div className="flex flex-col items-center md:items-end gap-1.5 shrink-0 w-full md:w-auto">
                          <span className="text-[10px] text-emerald-400 font-extrabold font-sans">تلقائياً التالي خلال {autoNextCountdown} ثوانٍ...</span>
                          <div className="w-24 bg-slate-950 rounded-full h-1.5 border border-emerald-900/30 overflow-hidden">
                            <motion.div 
                              className="bg-emerald-400 h-full"
                              initial={{ width: "100%" }}
                              animate={{ width: "0%" }}
                              transition={{ duration: 3, ease: "linear" }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* INCORRECT DESIGN CARD */}
                  {translationResult.status === "incorrect" && (
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-red-955 to-slate-900 bg-red-950/20 border border-red-500/30 text-rose-300 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-full bg-red-600/15 border border-red-500/30 flex items-center justify-center shrink-0">
                          <X className="w-6 h-6 text-rose-500" />
                        </div>
                        <div>
                          <span className="text-[15px] font-black block">أخطأت الكلمات ✗</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">تفقد الحل والتصويب أدناه لمطابقة الفهم.</span>
                        </div>
                      </div>

                      {/* AI highlights if available (Arabic to German feedback) */}
                      {translationResult.highlightedWords && (
                        <div className="space-y-1.5 bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                          <span className="text-[9px] text-slate-500 font-bold block mb-1">تلوين الأخطاء ومواضع الكلمات:</span>
                          <div className="flex flex-wrap gap-1.5 font-sans justify-start dir-ltr">
                            {translationResult.highlightedWords.map((item, index) => (
                              <div
                                key={index}
                                className={`px-2 py-1 rounded text-xs font-bold border ${
                                  item.state === "correct"
                                    ? "bg-emerald-950/30 border-emerald-900/40 text-emerald-400"
                                    : "bg-red-950/40 border-red-900/40 text-red-300 line-through"
                                }`}
                              >
                                {item.word}
                                {item.state === "error" && item.suggestion && (
                                  <span className="text-[9px] px-1 bg-rose-600 text-white rounded ml-1 font-sans font-bold">{item.suggestion}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pure Model Solution display */}
                      <div className="space-y-1.5 bg-slate-950 p-4 rounded-xl border border-slate-850">
                        <span className="text-[9px] text-slate-500 font-bold block">الصياغة النموذجية المطلوبة هي:</span>
                        <div className="text-right">
                          <p className="font-sans font-black text-slate-200 text-sm select-all dir-ltr text-left">
                            {currentQuestion.sentence.german}
                          </p>
                          <p className="text-slate-400 font-bold text-xs mt-1">
                            {currentQuestion.sentence.arabic}
                          </p>
                        </div>
                      </div>

                      {/* Explanation if available */}
                      {translationResult.explanation && (
                        <p className="text-xs text-slate-350 leading-relaxed font-sans bg-slate-900/50 p-3.5 rounded-lg border border-slate-850">
                          💡 {translationResult.explanation}
                        </p>
                      )}

                      {/* Retry and Next Action controls */}
                      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                        <button
                          onClick={resetQuestionState}
                          className="w-full sm:w-auto px-5 py-3 min-h-[48px] bg-slate-950 hover:bg-slate-900 text-white border border-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4 shrink-0 text-slate-400" />
                          إعادة المحاولة
                        </button>

                        <button
                          onClick={handleNextQuestion}
                          className="w-full sm:w-auto px-6 py-3 min-h-[48px] bg-blue-650/30 hover:bg-blue-600/40 text-blue-300 hover:text-white border border-blue-900/50 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>تجاوز للسؤال التالي</span>
                          <ArrowRight className="w-4 h-4 text-blue-400 shrink-0" />
                        </button>
                      </div>

                    </div>
                  )}

                </motion.div>
              )}

            </motion.div>
          </AnimatePresence>

        </div>
      )}

    </div>
  );
}
