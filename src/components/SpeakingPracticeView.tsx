import React, { useState, useEffect, useRef } from "react";
import { Sentence } from "../types";
import { 
  Mic, MicOff, AlertCircle, RefreshCw, Sparkles, CheckCircle, 
  XCircle, Award, Volume2, HelpCircle, Flame, Star 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import SpeakButton from "./SpeakButton";

interface SpeakingPracticeViewProps {
  sentences: Sentence[];
  onAwardXp: (xp: number, srcType: "speaking_sentences" | "sentences" | "correct_quizzes" | "chat_turns") => void;
}

// Fallback practice sentences if they have none added yet
const FALLBACK_PRACTICE = [
  "Ich liebe die deutsche Sprache",
  "Entschuldigung, wie komme ich zum Bahnhof?",
  "Das ist eine hervorragende Idee",
  "Dankeschön für Ihre freundliche Unterstützung",
  "Übung macht den Meister"
];

interface PronunciationAnalysis {
  score: number;
  isCorrect: boolean;
  feedback: string;
  wordAnalysis: { word: string; state: "correct" | "incorrect" | "missing"; suggestion?: string }[];
}

export default function SpeakingPracticeView({ sentences, onAwardXp }: SpeakingPracticeViewProps) {
  const [activeSentence, setActiveSentence] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [transcribed, setTranscribed] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [analysis, setAnalysis] = useState<PronunciationAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    selectRandomSentence();
  }, [sentences]);

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const selectRandomSentence = () => {
    setTranscribed("");
    setAnalysis(null);
    setErrorMessage("");
    
    if (sentences && sentences.length > 0) {
      const idx = Math.floor(Math.random() * sentences.length);
      setActiveSentence(sentences[idx].german);
    } else {
      const idx = Math.floor(Math.random() * FALLBACK_PRACTICE.length);
      setActiveSentence(FALLBACK_PRACTICE[idx]);
    }
  };

  const startSpeechRecognition = () => {
    setErrorMessage("");
    setTranscribed("");
    setAnalysis(null);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMessage("عذراً، محرك متصفحك لا يدعم التعرف الصوتي (Web Speech). يرجى فتح التطبيق في Google Chrome أو متصفح يدعم الميكروفون.");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = "de-DE";
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTranscribed(transcript);
        evaluatePronunciation(transcript);
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
        if (e.error === "not-allowed") {
          setErrorMessage("تم رفض الإذن بالوصول للميكروفون في المتصفح! يرجى إعطاء الصلاحية.");
        } else {
          setErrorMessage(`حدث خطأ أثناء التعرف على الصوت: ${e.error}`);
        }
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e: any) {
      console.error(e);
      setErrorMessage("عذراً، فشل تهيئة مستمع الصوت.");
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const evaluatePronunciation = async (speechText: string) => {
    setIsEvaluating(true);
    setErrorMessage("");

    try {
      const storedKey = localStorage.getItem("deutsch_spaced_rep_api_key_override") || "";
      const response = await fetch("/api/analyse-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetText: activeSentence,
          transcribedText: speechText,
          customApiKey: storedKey
        })
      });

      if (!response.ok) {
        throw new Error("فشلت عملية التواصل مع خادم معالجة النطق بـ AI.");
      }

      const result: PronunciationAnalysis = await response.json();
      setAnalysis(result);

      // Award XP on successful pronunciation
      if (result.score >= 75) {
        // Award XP + Trigger achievement updates in parent logic
        onAwardXp(35, "speaking_sentences");
      } else {
        // Smaller participation XP
        onAwardXp(10, "speaking_sentences");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || "حدث خطأ غير متوقع أثناء مراجعة النطق الذكية.");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Intro Card */}
      <div className="p-5 rounded-3xl bg-slate-900/60 border border-blue-950/40 backdrop-blur-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Mic className="w-6 h-6 text-cyan-400 animate-pulse shrink-0" />
          <div>
            <span className="text-sm font-bold text-white block">وضع التدريب على التحدث والنطق (Speaking Practice)</span>
            <span className="text-[11px] text-slate-400">
              تدرب على مهارات الاستماع والمحادثة الشفوية بطريقة تفاعلية لرفع ثقتك وصقل الأصوات الألمانية الصعبة.
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        
        {/* Main Speaking Stage */}
        <div className="p-6 md:p-8 rounded-3xl bg-slate-950 border border-cyan-950/80 shadow-[0_12px_44px_rgba(0,0,0,0.7)] text-center space-y-6 relative overflow-hidden">
          
          {/* Cyan Glow Top accent bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-cyan-600 to-transparent" />

          <div className="flex items-center justify-between">
            <span className="text-[10px] tracking-wider uppercase font-extrabold text-slate-500">الجملة المستهدفة للتدريب:</span>
            <button
              onClick={selectRandomSentence}
              className="text-xs text-cyan-400 font-bold hover:text-cyan-300 flex items-center gap-1.5 transition-all cursor-pointer border border-cyan-950 px-2.5 py-1 rounded-lg hover:bg-cyan-950/40"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              تغيير الجملة
            </button>
          </div>

          {/* Glowing Target Text Display */}
          <div className="py-6 px-4 bg-slate-900/60 border border-slate-850 rounded-2xl space-y-4">
            <div className="flex items-center justify-center gap-3">
              <SpeakButton text={activeSentence} className="scale-125" />
              <h2 className="text-xl md:text-2xl font-black text-white font-sans tracking-wide leading-relaxed selection:bg-cyan-500/20" dir="ltr">
                {activeSentence}
              </h2>
            </div>
            <p className="text-xs text-slate-450 italic leading-relaxed">
              انقر فوق رمز سماعة القراءة الصوتية 🔊 للاستماع للفظ الحرفي الصحيح أولاً ببطء!
            </p>
          </div>

          {/* Microphone control button */}
          <div className="flex flex-col items-center justify-center space-y-3.5 py-4">
            <AnimatePresence mode="wait">
              {isRecording ? (
                <motion.button
                  key="recording"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: [1, 1.1, 1] }}
                  exit={{ scale: 0.9 }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  onClick={stopSpeechRecognition}
                  className="w-20 h-20 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.55)] cursor-pointer"
                >
                  <MicOff className="w-8 h-8 animate-pulse" />
                </motion.button>
              ) : (
                <motion.button
                  key="idle"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  onClick={startSpeechRecognition}
                  disabled={isEvaluating}
                  className="w-20 h-20 bg-gradient-to-tr from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.45)] cursor-pointer disabled:opacity-50"
                >
                  <Mic className="w-8 h-8" />
                </motion.button>
              )}
            </AnimatePresence>

            <div>
              <span className="text-xs font-bold text-slate-300 block">
                {isRecording ? "مستمر بالتسجيل الآن... تحدث بالألمانية..." : "اضغط على الميكروفون لبدء التحدث بالنطق"}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {isRecording ? "اضغط مرة أخرى لإيقاف الميكرفون والمقارنة" : deVoicesConfigured() ? "النطق المدعوم: اللغة الألمانية الأهلية 🇩🇪" : "يرجى القراءة بوضوح وبصوت معتدل."}
              </span>
            </div>
          </div>

          {/* Transcribed User Text Display */}
          {transcribed && (
            <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-xl max-w-lg mx-auto text-center space-y-1.5 transition-all">
              <span className="text-[10px] text-slate-500 font-extrabold block">ما التقطه ميكروفونك:</span>
              <p className="text-sm font-sans font-semibold text-cyan-300 italic flex items-center justify-center gap-1.5" dir="ltr">
                "{transcribed}"
              </p>
            </div>
          )}

          {/* Loading Evaluator spinner */}
          {isEvaluating && (
            <div className="flex justify-center items-center gap-2 p-4 text-xs text-slate-400">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              <span>يقوم المعلم الصوتي الذكي بتحليل مخارج الحروف والمقارنة اللغوية الآمنة...</span>
            </div>
          )}

          {/* Error Message inside practice screen */}
          {errorMessage && (
            <div className="p-3.5 max-w-lg mx-auto rounded-xl bg-red-950/45 border border-red-900/50 flex items-center gap-2 text-xs text-red-300 text-right">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Immersive Evaluated Report View */}
          <AnimatePresence>
            {analysis && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="mt-6 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-right space-y-4 max-w-2xl mx-auto"
              >
                {/* Score & Verdict Banner */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2.5">
                    {analysis.isCorrect ? (
                      <div className="w-10 h-10 bg-emerald-950 border border-emerald-900 rounded-full flex items-center justify-center text-emerald-400 shrink-0">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-rose-950 border border-rose-900 rounded-full flex items-center justify-center text-rose-400 shrink-0">
                        <XCircle className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <span className="text-xs font-semibold text-slate-400 block">نسبة دقة اللفظ والنطق الصحيح:</span>
                      <span className="text-sm font-black text-white">
                        {analysis.isCorrect ? "لفظ رائع ومفهوم تماماً! 🎉" : "صوتك مسموع، وبحاجة لبعض الضبط الهجائي ⚠️"}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-blue-900/20 text-center min-w-24">
                    <span className="text-[9px] text-[#94a3b8] block">المجموع (Score)</span>
                    <span className={`text-2xl font-black ${analysis.score >= 80 ? "text-emerald-400" : analysis.score >= 50 ? "text-yellow-400" : "text-rose-400"}`}>
                      {analysis.score}%
                    </span>
                  </div>
                </div>

                {/* Color-Coded Word Analysis Bubbles */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-extrabold block">تحليل الكلمات المنطوقة بالتفصيل:</span>
                  <div className="flex flex-wrap gap-2" dir="ltr">
                    {analysis.wordAnalysis.map((token, index) => {
                      const isCorrect = token.state === "correct";
                      const isMissing = token.state === "missing";
                      return (
                        <div
                          key={index}
                          className={`px-3 py-1.5 rounded-xl border flex flex-col items-center gap-0.5 text-center transition-all group relative ${
                            isCorrect 
                              ? "bg-emerald-900/20 border-emerald-900 text-emerald-350" 
                              : isMissing
                              ? "bg-slate-950 border-slate-900 text-slate-500 border-dashed"
                              : "bg-red-950/40 border-red-900 text-rose-300"
                          }`}
                        >
                          <span className="text-xs font-sans font-bold">{token.word}</span>
                          <span className="text-[8px] tracking-wider font-semibold opacity-75">
                            {isCorrect ? "✔ صحيح" : isMissing ? "❌ غائب" : "✖ ركيك"}
                          </span>

                          {token.suggestion && (
                            <span className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 px-2 py-1 bg-slate-950 border border-slate-800 text-[9px] text-cyan-300 whitespace-nowrap rounded shadow-lg z-20">
                              مخرج الحرف: {token.suggestion}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Friendly and detailed constructive explanation in Arabic */}
                <div className="p-4 bg-slate-950/60 rounded-xl border border-blue-950/40 text-right space-y-2">
                  <span className="text-[10px] text-cyan-400 font-extrabold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                    💡 توجيهات النطق الصوتي الصحيحة:
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{analysis.feedback}</p>
                </div>

                {/* Level Up reward representation */}
                {analysis.score >= 75 && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-950/20 border border-cyan-900/30 text-xs">
                    <span className="text-slate-400">جائزة النطق المتقن:</span>
                    <span className="text-cyan-400 font-extrabold">+35 XP نقاط خبرة تم إضافتها بنجاح! 🥇</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

    </div>
  );
}

function deVoicesConfigured(): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  const voices = window.speechSynthesis.getVoices();
  return voices.some(v => v.lang.startsWith("de"));
}
