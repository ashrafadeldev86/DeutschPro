import React, { useState, useEffect, useRef } from "react";
import { Sentence, UserProfile } from "../types";
import { 
  Play, Volume2, HelpCircle, Check, X, ArrowRight, 
  RotateCcw, AlertCircle, Sparkles, Star, Award, BookOpen 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface WritingDictationViewProps {
  sentences: Sentence[];
  onAwardXp: (amount: number, type: string) => void;
  profile: UserProfile;
  onProgressChange?: (hasProgress: boolean, percent: number, remaining: number) => void;
}

interface EvaluationResult {
  submitted: boolean;
  accuracy: number; // calculated accuracy out of 100
  hasErrors: boolean;
  explanation?: string;
  highlightedWords?: Array<{ word: string; state: "correct" | "error"; suggestion?: string }>;
}

export default function WritingDictationView({ 
  sentences, 
  onAwardXp, 
  profile,
  onProgressChange 
}: WritingDictationViewProps) {
  const [selectedLevel, setSelectedLevel] = useState<"All" | "A1" | "A2" | "B1" | "B2" | "C1">("All");
  const [levelSentences, setLevelSentences] = useState<Sentence[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentSentence, setCurrentSentence] = useState<Sentence | null>(null);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionXpEarned, setSessionXpEarned] = useState(0);

  // Audio Playback State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Input & evaluation
  const [userInput, setUserInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

  const [autoNextCountdown, setAutoNextCountdown] = useState<number | null>(null);
  const autoNextTimerRef = useRef<any>(null);

  // Initialize and filter sentences
  useEffect(() => {
    let filtered = sentences;
    if (selectedLevel !== "All") {
      filtered = sentences.filter((s) => s.langLevel === selectedLevel);
    }
    
    if (filtered.length === 0) {
      filtered = sentences; // fallback
    }
    
    // Shuffle level sentences on load
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    setLevelSentences(shuffled);
    setCurrentIndex(0);
    resetState();
  }, [selectedLevel, sentences.length]);

  // Handle active sentence selection from index
  useEffect(() => {
    if (levelSentences.length > 0 && currentIndex < levelSentences.length) {
      setCurrentSentence(levelSentences[currentIndex]);
    } else {
      setCurrentSentence(null);
    }
    resetState();
  }, [currentIndex, levelSentences]);

  // Countdown timer for correct answers
  useEffect(() => {
    if (autoNextCountdown !== null) {
      if (autoNextCountdown > 0) {
        autoNextTimerRef.current = setTimeout(() => {
          setAutoNextCountdown((prev) => (prev !== null ? prev - 1 : null));
        }, 1000);
      } else {
        handleNextSentence();
      }
    }
    return () => {
      if (autoNextTimerRef.current) clearTimeout(autoNextTimerRef.current);
    };
  }, [autoNextCountdown]);

  const resetState = () => {
    setUserInput("");
    setIsSubmitting(false);
    setErrorMessage("");
    setEvaluation(null);
    setAutoNextCountdown(null);
    if (autoNextTimerRef.current) clearTimeout(autoNextTimerRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlayingAudio(false);
  };

  const playTTS = () => {
    if (!currentSentence) return;
    try {
      setIsPlayingAudio(true);
      const url = `/api/tts?q=${encodeURIComponent(currentSentence.german)}&tl=de`;
      
      if (audioRef.current) {
        audioRef.current.src = url;
      } else {
        audioRef.current = new Audio(url);
      }
      
      audioRef.current.onended = () => {
        setIsPlayingAudio(false);
      };
      audioRef.current.onerror = () => {
        setIsPlayingAudio(false);
        setErrorMessage("عذراً، فشل تشغيل الصوت من خادم النطق.");
      };
      
      audioRef.current.play();
    } catch (err) {
      console.error(err);
      setIsPlayingAudio(false);
    }
  };

  const calculateAccuracy = (userText: string, targetText: string): number => {
    const clean = (s: string) => s.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").toLowerCase().trim();
    const userWords = clean(userText).split(/\s+/).filter(Boolean);
    const targetWords = clean(targetText).split(/\s+/).filter(Boolean);

    if (targetWords.length === 0) return 100;
    
    let correctCount = 0;
    targetWords.forEach((word) => {
      if (userWords.includes(word)) {
        correctCount++;
      }
    });

    const percent = Math.round((correctCount / targetWords.length) * 100);
    return Math.min(100, Math.max(0, percent));
  };

  const evaluateDictation = async () => {
    if (!currentSentence) return;
    if (!userInput.trim()) {
      setErrorMessage("الرجاء كتابة الجملة التي سمعتها أولاً قبل الإرسال.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setAutoNextCountdown(null);

    try {
      const storedKey = localStorage.getItem("deutsch_spaced_rep_api_key_override") || "";
      
      // Call standard grammar/spelling checker endpoint
      const response = await fetch("/api/check-grammar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sentence: userInput.trim(),
          referenceSentence: currentSentence.german,
          customApiKey: storedKey
        })
      });

      if (!response.ok) {
        throw new Error("فشلت عملية تقييم وتحليل الديكتاشن على الخادم.");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const calculatedPct = calculateAccuracy(userInput, currentSentence.german);
      const isCorrect = !data.hasErrors && calculatedPct >= 90;

      setEvaluation({
        submitted: true,
        accuracy: calculatedPct,
        hasErrors: data.hasErrors,
        explanation: data.explanation || "تم تدقيق كتابتك ومقارنتها بالصياغة المطلوبة.",
        highlightedWords: data.highlightedWords || []
      });

      // Award XP proportionally to the accuracy
      if (isCorrect) {
        onAwardXp(25, "speaking_sentences");
        setAutoNextCountdown(3); // Auto transition after 3s on correct answer
      } else {
        if (calculatedPct >= 60) {
          onAwardXp(12, "speaking_sentences");
        }
      }

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "حدث خطأ غير متوقع أثناء تقييم الإملاء.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalQuestions = Math.min(10, levelSentences.length);
  const completedQuestionsCount = currentIndex;
  const remainingQuestionsCount = Math.max(0, totalQuestions - currentIndex);
  const progressPercentage = totalQuestions > 0 ? Math.round((completedQuestionsCount / totalQuestions) * 100) : 0;

  useEffect(() => {
    if (onProgressChange) {
      const hasProgress = currentIndex > 0 && !sessionCompleted && levelSentences.length > 0;
      onProgressChange(hasProgress, progressPercentage, remainingQuestionsCount);
    }
  }, [currentIndex, sessionCompleted, levelSentences.length, progressPercentage, remainingQuestionsCount, onProgressChange]);

  const handleNextSentence = () => {
    if (levelSentences.length === 0) return;
    resetState();
    if (currentIndex + 1 >= totalQuestions) {
      setSessionCompleted(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const startNewSession = () => {
    // shuffle sentences again
    const shuffled = [...levelSentences].sort(() => 0.5 - Math.random());
    setLevelSentences(shuffled);
    setCurrentIndex(0);
    setSessionCompleted(false);
    setSessionXpEarned(0);
    resetState();
  };

  if (sentences.length === 0) {
    return (
      <div id="dictation-no-sentences" className="p-8 md:p-12 text-center rounded-3xl bg-slate-950/40 border border-slate-900 max-w-xl mx-auto space-y-6 dir-rtl text-right">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 text-3xl">
          💡
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-black text-white">لا توجد جمل مفعّلة في مخزنك</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            يعتمد مختبر الإملاء الصوتي الذكي على الجمل الخاصة بك التي تضيفها لمساعدتك في كتابة ونطق الكلمات والجمل بدقة كاملة.
          </p>
        </div>
        <div className="p-4 bg-slate-900/60 rounded-xl text-xs text-slate-400 border border-slate-850">
          يرجى الانتقال إلى قسم <strong className="text-blue-400">"إضافة جملة" ✍️</strong> لتتمكن من التدريب.
        </div>
      </div>
    );
  }

  if (sessionCompleted) {
    return (
      <div id="dictation-session-completed" className="max-w-xl mx-auto p-6 md:p-8 rounded-3xl bg-slate-900 border border-purple-500/20 shadow-2xl text-center space-y-6 text-right dir-rtl" dir="rtl">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="space-y-4"
        >
          <div className="w-16 h-16 bg-gradient-to-tr from-yellow-500 to-amber-500 rounded-full flex items-center justify-center mx-auto text-3xl shadow-[0_0_20px_rgba(234,179,8,0.3)] animate-bounce">
            🏆
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl font-black text-white">اكتمل تحدي الإملاء اليومي! 🎉</h3>
            <p className="text-xs text-slate-400 font-sans">
              عمل عظيم ومثابرة ممتازة! لقد نجحت في إتمام تدريب الكتابة والإملاء الصوتي لـ 10 جمل.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 py-4">
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-850">
              <span className="text-[10px] text-slate-500 font-bold block">النقاط الإجمالية المكتسبة:</span>
              <span className="text-lg font-black text-yellow-500 font-sans">+{sessionXpEarned} XP</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-850">
              <span className="text-[10px] text-slate-500 font-bold block">الجمل الإملائية المكتوبة:</span>
              <span className="text-lg font-black text-purple-400 font-sans">{totalQuestions} جملة</span>
            </div>
          </div>

          <button
            onClick={startNewSession}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-sm rounded-xl transition-all cursor-pointer shadow-lg shadow-purple-500/20"
          >
            بدء تحدي إملاء جديد 🔄
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div id="dictation-panel" className="space-y-6 max-w-4xl mx-auto px-4 py-2 text-right dir-rtl" dir="rtl">
      
      {/* 1. PROFESSIONAL PROGRESS BAR CONTAINER */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-950 to-blue-950/20 border border-slate-900 shadow-xl space-y-4">
        
        {/* Progress Header metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          
          <div className="flex items-center gap-2.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-850">
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[9px] text-slate-500 font-bold block">الأسئلة المنجزة</span>
              <span className="text-sm font-black text-white font-sans">{completedQuestionsCount} <span className="text-[10px] text-slate-400 font-bold">/ {totalQuestions}</span></span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-850">
            <BookOpen className="w-5 h-5 text-indigo-400 shrink-0" />
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
            <span className="bg-purple-950 text-purple-300 border border-purple-900 px-2 py-0.5 rounded uppercase font-black tracking-wider">مختبر الديكتاشن</span>
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

      {/* Level and details controller - Larger more friendly look */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
        <div className="space-y-1 text-center sm:text-right">
          <span className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 block uppercase">
            🎙️ مختبر الإملاء الصوتي الذكي (Diktat)
          </span>
          <p className="text-[11px] text-slate-400">استمع للنطق ومخارج الحروف السليمة بدقة واكتب ما سمعته بدقة تامة.</p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-xs text-slate-400 font-bold">مستوى الفلترة:</span>
          <select
            value={selectedLevel}
            onChange={(e: any) => setSelectedLevel(e.target.value)}
            className="bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-800 font-black cursor-pointer focus:outline-none"
          >
            <option value="All">الكل (عشوائي)</option>
            <option value="A1">مبتدئ A1</option>
            <option value="A2">تأسيسي A2</option>
            <option value="B1">متوسط B1</option>
            <option value="B2">فوق متوسط B2</option>
            <option value="C1">متقدم C1</option>
          </select>
        </div>
      </div>

      {levelSentences.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <p className="text-sm text-slate-400">لا توجد جمل كافية في مخزنك لتمثيل المستوى {selectedLevel}.</p>
          <p className="text-xs text-slate-500">أضف بعض الجمل والكلمات الخاصة بك في تبويب الإضافة لبدء التدريب.</p>
        </div>
      ) : (
        <div className="rounded-3xl bg-slate-900/40 border border-slate-800/80 p-6 md:p-8 backdrop-blur-xl space-y-8">
          
          {/* Main TTS Player Area with LARGER visual elements */}
          <div className="flex flex-col items-center justify-center space-y-5 py-8 border-b border-slate-850">
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={playTTS}
              className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all cursor-pointer border-2 ${
                isPlayingAudio 
                  ? "bg-purple-650/30 border-purple-500 text-purple-400 animate-pulse" 
                  : "bg-slate-950 hover:bg-slate-900 border-slate-850 text-slate-300"
              }`}
            >
              {isPlayingAudio ? (
                <Volume2 className="w-10 h-10 shrink-0 text-purple-400 animate-bounce" />
              ) : (
                <Play className="w-10 h-10 shrink-0 text-white translate-x-[-1px] fill-white" />
              )}
            </motion.button>
            
            <div className="text-center space-y-1.5">
              <span className="text-sm font-black text-slate-350">
                {isPlayingAudio ? "جاري تشغيل النسبة اللفظية..." : "انقر على زر التشغيل الضخم للاستماع للجملة"}
              </span>
              <p className="text-[11px] text-slate-500">نمط الكتابة مخفي لتعزيز كفاءتك العقلية في الاستماع.</p>
            </div>
          </div>

          {/* User Writing Area */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-350 block text-right">اكتب ما سمعته بالضبط (بالألمانية):</label>
              <textarea
                rows={3}
                dir="ltr"
                disabled={evaluation?.submitted || isSubmitting}
                placeholder="Schreibe das, was du hörst..."
                value={userInput}
                onChange={(e) => {
                  setUserInput(e.target.value);
                  setErrorMessage("");
                }}
                className="w-full min-h-[90px] bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-bold font-sans text-white text-left focus:outline-none focus:border-purple-600 disabled:opacity-60 transition-colors placeholder:text-slate-700"
              />
            </div>

            {errorMessage && (
              <div className="p-3.5 bg-red-950/20 text-red-300 border border-red-900/60 rounded-xl text-xs text-center font-bold">
                {errorMessage}
              </div>
            )}

            {!evaluation?.submitted && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={playTTS}
                  className="w-full sm:w-auto px-5 py-3 min-h-[48px] bg-slate-950 hover:bg-slate-900 text-purple-300 border border-slate-850 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 shrink-0 text-purple-400" />
                  إعادة تشغيل الصوت
                </button>

                <button
                  onClick={evaluateDictation}
                  disabled={isSubmitting || !userInput.trim()}
                  className="w-full sm:w-auto px-6 py-3 min-h-[48px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-500/20"
                >
                  {isSubmitting ? (
                    <>
                      <Volume2 className="w-4 h-4 animate-bounce" />
                      <span>جاري الفحص الدقيق...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 shrink-0" />
                      <span>فحص وتثبيت الإجابة ✓</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Results Analysis */}
          {evaluation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="p-5 rounded-2xl bg-slate-950 border border-slate-850 space-y-6"
            >
              
              {/* EVALUATION CONDITIONED STATES */}
              {(!evaluation.hasErrors && evaluation.accuracy >= 90) ? (
                
                /* SUCCESS PATH */
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-emerald-900/10 border border-emerald-500/40 text-emerald-300 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                        <Check className="w-7 h-7 text-emerald-400" />
                      </div>
                      <div>
                        <span className="text-[15px] font-black block">✅ أحسنت، لقد كتبت الجملة بشكل صحيح</span>
                        <p className="text-xs text-slate-350 mt-0.5 leading-relaxed font-sans">
                          استماعك مثالي هجاءً وتركيباً! حصلت على نقاط XP إضافية.
                        </p>
                      </div>
                    </div>

                    {autoNextCountdown !== null && (
                      <div className="flex flex-col items-center md:items-end gap-1.5 shrink-0 w-full md:w-auto">
                        <span className="text-[10px] text-emerald-400 font-extrabold">تلقائياً التالي خلال {autoNextCountdown} ثوانٍ...</span>
                        <div className="w-24 bg-slate-900 rounded-full h-1.5 border border-emerald-900/30 overflow-hidden">
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
                </div>

              ) : (

                /* ERROR FAILURE PATH */
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-red-955 to-slate-900 bg-red-950/20 border border-red-500/30 text-rose-300 flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-red-600/15 border border-red-500/30 flex items-center justify-center shrink-0">
                      <X className="w-7 h-7 text-rose-500" />
                    </div>
                    <div>
                      <span className="text-[15px] font-black block">✗ الإملاء بحاجة لبعض المراجعة</span>
                      <p className="text-xs text-slate-400 mt-0.5">
                        قم بالاطلاع على مقارنة وتلوين الأخطاء أدناه لتصحيح الذاكرة السمعية.
                      </p>
                    </div>
                  </div>
                </div>

              )}

              {/* Comparative highlight of errors */}
              {evaluation.highlightedWords && evaluation.highlightedWords.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs text-slate-400 font-black block">تلوين الأخطاء والكلمات المقارنة:</span>
                  <div className="flex flex-wrap gap-2 justify-start font-sans dir-ltr">
                    {evaluation.highlightedWords.map((item, index) => (
                      <span
                        key={index}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black border ${
                          item.state === "correct"
                            ? "bg-emerald-950/30 border-emerald-900/30 text-emerald-400"
                            : "bg-red-950/20 border-red-900/30 text-rose-400 line-through"
                        }`}
                      >
                        {item.word}
                        {item.state === "error" && item.suggestion && (
                          <span className="text-[9px] ml-1 bg-red-650 px-1 text-white rounded font-sans not-italic font-bold">
                            ➔ {item.suggestion}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Text original reference comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">الجملة النموذجية الصحيحة:</span>
                  <p className="font-sans font-black text-white text-sm text-left dir-ltr select-all">
                    {currentSentence?.german}
                  </p>
                  <p className="text-slate-400 font-extrabold text-xs text-right mt-1.5">
                    {currentSentence?.arabic}
                  </p>
                </div>

                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">ما قمت بكتابته أنت:</span>
                  <p className="font-sans font-bold text-slate-300 text-sm text-left dir-ltr">
                    {userInput}
                  </p>
                </div>
              </div>

              {/* AI Explanation in Arabic */}
              {evaluation.explanation && (
                <div className="p-4 bg-purple-950/10 border border-purple-950/30 rounded-xl text-xs text-slate-350 leading-relaxed font-sans">
                  💬 {evaluation.explanation}
                </div>
              )}

              {/* High touch-target buttons - bigger and easier on mobile screens */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <button
                  onClick={playTTS}
                  className="w-full sm:w-auto px-5 py-3 min-h-[48px] bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-slate-400" />
                  إعادة تشغيل النطق
                </button>

                <button
                  onClick={resetState}
                  className="w-full sm:w-auto px-5 py-3 min-h-[48px] bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-slate-450" />
                  إعادة المحاولة
                </button>

                <button
                  onClick={handleNextSentence}
                  className="w-full sm:w-auto px-6 py-3 min-h-[48px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-purple-500/20"
                >
                  <span>التالي</span>
                  <ArrowRight className="w-4 h-4 text-white shrink-0" />
                </button>
              </div>

            </motion.div>
          )}

        </div>
      )}

    </div>
  );
}
