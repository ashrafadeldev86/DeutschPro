import React, { useState, useEffect, useRef } from "react";
import { Sentence } from "../types";
import { 
  Award, HelpCircle, ArrowLeft, ArrowRight, CheckCircle2, 
  XCircle, Sliders, RefreshCw, Sparkles, BookOpen, Clock, AlertTriangle 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { calculateNextReview } from "../utils";
import SpeakButton from "./SpeakButton";

interface DailyQuizViewProps {
  sentences: Sentence[];
  onUpdateSentence: (updated: Sentence) => void;
  onAwardXp: (xp: number, srcType: "speaking_sentences" | "sentences" | "correct_quizzes" | "chat_turns") => void;
}

interface ShuffleWord {
  id: string;
  text: string;
}

interface WordCheckItem {
  word: string;
  state: "correct" | "error";
  suggestion?: string;
}

export default function DailyQuizView({ sentences, onUpdateSentence, onAwardXp }: DailyQuizViewProps) {
  const [bypassFilter, setBypassFilter] = useState(false);
  const [activeQueue, setActiveQueue] = useState<Sentence[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Quiz specific states
  const [quizType, setQuizType] = useState<"word_ordering" | "translation">("translation");
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  // States for Type 1: Word Ordering
  const [shuffledWords, setShuffledWords] = useState<ShuffleWord[]>([]);
  const [selectedWords, setSelectedWords] = useState<ShuffleWord[]>([]);
  
  // States for Type 2: Reverse translation
  const [userTextAnswer, setUserTextAnswer] = useState("");

  // Correction details states
  const [grammarCheckLoading, setGrammarCheckLoading] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [wordAnalysis, setWordAnalysis] = useState<WordCheckItem[]>([]);
  const [finalUserAnswerStr, setFinalUserAnswerStr] = useState("");

  const autoNextTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Re-build active queue when sentences or bypass parameters change
  useEffect(() => {
    const now = new Date();
    const filtered = sentences.filter((s) => {
      if (bypassFilter) return true;
      return new Date(s.nextReview) <= now;
    });
    
    // Shuffle the queue so reviews aren't in additions order
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    setActiveQueue(shuffled);
    setCurrentIndex(0);
    resetQuizStates();
  }, [sentences, bypassFilter]);

  const activeSentence = activeQueue[currentIndex];

  const resetQuizStates = () => {
    if (autoNextTimeoutRef.current) clearTimeout(autoNextTimeoutRef.current);
    setIsAnswered(false);
    setIsCorrect(null);
    setUserTextAnswer("");
    setSelectedWords([]);
    setExplanation("");
    setWordAnalysis([]);
    setFinalUserAnswerStr("");
    setGrammarCheckLoading(false);
  };

  // Clean timeouts on unmount
  useEffect(() => {
    return () => {
      if (autoNextTimeoutRef.current) clearTimeout(autoNextTimeoutRef.current);
    };
  }, []);

  // Prepare current question
  useEffect(() => {
    if (!activeSentence) return;
    
    // Choose randomly between "word_ordering" and "translation"
    // However, if the German sentence is only 1 or 2 words, word ordering is trivial, so use translation
    const words = activeSentence.german.split(/\s+/).filter(Boolean);
    if (words.length <= 2) {
      setQuizType("translation");
    } else {
      const randomType = Math.random() > 0.5 ? "word_ordering" : "translation";
      setQuizType(randomType);
    }

    // Prepare Word Ordering words
    if (words.length > 2) {
      const shufflePayload: ShuffleWord[] = words.map((w, idx) => ({
        id: `word-${idx}-${Math.random()}`,
        text: w,
      }));
      // Perform a robust shuffle
      const shuffledArr = [...shufflePayload].sort(() => Math.random() - 0.5);
      setShuffledWords(shuffledArr);
    }
    
    resetQuizStates();
  }, [activeSentence, currentIndex]);

  const normalize = (text: string) => {
    return text
      .trim()
      .toLowerCase()
      // Remove common single trailing or internal punctuation for lenient grading
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?¿¡]/g, "")
      .replace(/\s+/g, " ");
  };

  const handleWordSelect = (word: ShuffleWord) => {
    if (isAnswered) return;
    setShuffledWords(shuffledWords.filter((w) => w.id !== word.id));
    setSelectedWords([...selectedWords, word]);
  };

  const handleWordDeselect = (word: ShuffleWord) => {
    if (isAnswered) return;
    setSelectedWords(selectedWords.filter((w) => w.id !== word.id));
    setShuffledWords([...shuffledWords, word]);
  };

  const handleCheckAnswer = async () => {
    if (isAnswered || !activeSentence) return;

    let userStr = "";
    if (quizType === "word_ordering") {
      userStr = selectedWords.map((w) => w.text).join(" ");
    } else {
      userStr = userTextAnswer;
    }

    const normUser = normalize(userStr);
    const normCorrect = normalize(activeSentence.german);
    const isRight = normUser === normCorrect;

    setFinalUserAnswerStr(userStr);
    setIsCorrect(isRight);
    setIsAnswered(true);

    // Run SRS update calculations
    const updatedSentence = { ...activeSentence };
    if (isRight) {
      const nextLevel = activeSentence.level + 1;
      const nextDate = calculateNextReview(nextLevel);
      updatedSentence.level = nextLevel;
      updatedSentence.nextReview = nextDate.toISOString();

      // Award XP
      onAwardXp(20, "correct_quizzes");

      // Auto next in exactly 2.0 seconds in case of Correct answer
      autoNextTimeoutRef.current = setTimeout(() => {
        handleNextQuestion();
      }, 2000);
    } else {
      // Mistake path: reset level to 0, schedule immediate
      updatedSentence.level = 0;
      updatedSentence.nextReview = new Date().toISOString();

      // Initiate Gemini check for grammar to give smart correction reasons!
      callGrammarChecker(userStr, activeSentence.german);
    }

    onUpdateSentence(updatedSentence);
  };

  const callGrammarChecker = async (userAnswer: string, correctReference: string) => {
    setGrammarCheckLoading(true);
    try {
      const storedKey = localStorage.getItem("deutsch_spaced_rep_api_key_override") || "";
      const response = await fetch("/api/check-grammar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sentence: userAnswer,
          referenceSentence: correctReference,
          customApiKey: storedKey
        })
      });

      if (!response.ok) {
        throw new Error("Grammar API failed");
      }

      const result = await response.json();
      setExplanation(result.explanation || "توجد أخطاء في تهجئة الكلمات أو ترتيبها مقارنة بالجملة الأصلية المطلوبة.");
      if (result.highlightedWords && result.highlightedWords.length > 0) {
        setWordAnalysis(result.highlightedWords);
      } else {
        generateLocalWordFallback(userAnswer, correctReference);
      }
    } catch (e) {
      console.error(e);
      setExplanation("توجد أخطاء في تهجئة الكلمات أو ترتيبها مقارنة بالجملة الأصلية المطلوبة.");
      generateLocalWordFallback(userAnswer, correctReference);
    } finally {
      setGrammarCheckLoading(false);
    }
  };

  const generateLocalWordFallback = (userAnswer: string, correctReference: string) => {
    const userWords = userAnswer.trim().split(/\s+/).filter(Boolean);
    const correctWords = correctReference.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?¿¡]/g, "").split(/\s+/);
    
    const analysis: WordCheckItem[] = userWords.map((word, idx) => {
      const cleanWord = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?¿¡]/g, "");
      const isCorrectWord = correctWords[idx] === cleanWord || correctWords.includes(cleanWord);
      return {
        word,
        state: isCorrectWord ? "correct" : "error"
      };
    });
    setWordAnalysis(analysis);
  };

  const handleNextQuestion = () => {
    if (autoNextTimeoutRef.current) clearTimeout(autoNextTimeoutRef.current);
    if (currentIndex + 1 < activeQueue.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Completed current queue!
      setActiveQueue([]);
      setCurrentIndex(0);
    }
  };

  const handleRetrySentence = () => {
    if (autoNextTimeoutRef.current) clearTimeout(autoNextTimeoutRef.current);
    setIsAnswered(false);
    setIsCorrect(null);
    setUserTextAnswer("");
    setSelectedWords([]);
    setExplanation("");
    setWordAnalysis([]);
    setFinalUserAnswerStr("");
    setGrammarCheckLoading(false);

    // Regenerate word shuffle if ordering
    const words = activeSentence.german.split(/\s+/).filter(Boolean);
    if (words.length > 2) {
      const shufflePayload: ShuffleWord[] = words.map((w, idx) => ({
        id: `word-${idx}-${Math.random()}`,
        text: w,
      }));
      const shuffledArr = [...shufflePayload].sort(() => Math.random() - 0.5);
      setShuffledWords(shuffledArr);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-right w-full px-2 sm:px-4" dir="rtl">
      
      {/* Header with scheduler override switches */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-905/40 border border-blue-950/40">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-semibold text-slate-300">
            تمت الجدولة لـ: <b>{sentences.filter(s => new Date(s.nextReview) <= new Date()).length} جمل متأخرة</b>
          </span>
        </div>
        
        <button
          onClick={() => setBypassFilter(!bypassFilter)}
          className={`px-4 py-2 text-xs rounded-lg border font-bold flex items-center gap-2 transition-all cursor-pointer w-full sm:w-auto justify-center ${
            bypassFilter 
              ? "bg-blue-600/35 border-blue-500 text-blue-200 shadow-[0_0_10px_rgba(34,197,94,0.1)]" 
              : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-blue-900/70"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          {bypassFilter ? "وضع تصفية الوقت: غير مفعل (مراجعة كل الجمل)" : "وضع تصفية الوقت: مفعل (المستحقة فقط)"}
        </button>
      </div>

      {/* Main stage area */}
      {activeQueue.length === 0 ? (
        <div className="p-6 sm:p-12 text-center rounded-3xl border border-slate-900 bg-slate-950/70 py-16 space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-blue-950/80 border border-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <CheckCircle2 className="w-8 h-8 text-cyan-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">رائع جداً! لا يوجد جمل مراجعة لليوم</h3>
            <p className="text-slate-450 text-sm max-w-md mx-auto leading-relaxed">
              لقد أتقنت جميع الجمل المطلوبة في الوقت الحالي. يمكنك إضافة المزيد من الجمل أو تفعيل زر الالتفاف التجريبي بالأعلى لاختبار جميع الجمل في أي وقت!
            </p>
          </div>
          <div>
            <button
              onClick={() => setBypassFilter(true)}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-850 text-blue-400 hover:text-cyan-300 border border-blue-900/30 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2 max-w-full"
            >
              <RefreshCw className="w-4 h-4" />
              أريد اختبار وقراءة كل الجمل الآن على أي حال
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Progress Indicator */}
          <div className="flex flex-col sm:flex-row gap-2 items-center justify-between text-xs text-slate-400 font-medium px-1">
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4 text-cyan-500" />
              <span>جملة مراجعة لليوم: <b className="text-white">{currentIndex + 1}</b> من أصل <b className="text-white">{activeQueue.length}</b></span>
            </div>
            
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-full border border-blue-950/40 text-[10px]">
              <Award className="w-3.5 h-3.5 text-yellow-500" />
              <span>مستوى الإتقان الحالي: <b className="text-yellow-400">{activeSentence?.level || 0}</b></span>
            </div>
          </div>

          <div className="w-full bg-slate-950/90 rounded-full h-1.5 overflow-hidden border border-blue-950/20">
            <div 
              className="bg-gradient-to-r from-blue-600 to-cyan-400 h-1.5 rounded-full transition-all duration-350"
              style={{ width: `${((currentIndex + 1) / activeQueue.length) * 100}%` }}
            />
          </div>

          {/* Active Card Container */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSentence.id}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              className="p-5 sm:p-8 rounded-3xl border bg-slate-955 border-blue-950/85 shadow-[0_12px_44px_rgba(0,0,0,0.6)] space-y-6 sm:space-y-8 relative overflow-hidden"
            >
              {/* Card visual accent */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-blue-700 via-cyan-500 to-transparent" />

              <div className="space-y-2">
                <span className="text-[10px] text-cyan-400 tracking-wider font-bold bg-blue-950/60 border border-blue-500/20 px-2.5 py-1 rounded-full uppercase">
                  {quizType === "word_ordering" ? "ترتيب الكلمات المتناثرة" : "ترجمة الجملة كتابياً"}
                </span>
                
                <h4 className="text-xs text-slate-550 font-bold pt-2">معنى الجملة بالعربية:</h4>
                <p className="text-xl sm:text-2xl font-bold text-white pr-2 border-r-4 border-cyan-500 leading-normal select-text">
                  {activeSentence.arabic}
                </p>
              </div>

              {/* Quiz interactive areas */}
              <div className="bg-slate-900/40 rounded-xl p-4 sm:p-6 border border-blue-950/30 min-h-[140px] flex flex-col justify-center">
                
                {quizType === "word_ordering" ? (
                  /* WORD ORDERING GAME INTERFACE */
                  <div className="space-y-6">
                    {/* User answer building slot */}
                    <div className="flex flex-wrap items-center justify-center gap-2 p-3 rounded-lg border border-slate-900 bg-slate-950/90 text-left min-h-[50px] w-full" dir="ltr">
                      {selectedWords.length === 0 ? (
                        <span className="text-xs text-slate-600 font-sans italic">انقر الكلمات بالأسفل لتقوم بترتيبها هنا...</span>
                      ) : (
                        selectedWords.map((word) => (
                          <motion.button
                            layoutId={word.id}
                            key={word.id}
                            onClick={() => handleWordDeselect(word)}
                            disabled={isAnswered}
                            className="px-2.5 py-1 bg-blue-900/60 hover:bg-blue-800 text-blue-100 font-bold font-sans rounded-lg border border-blue-500/30 text-xs sm:text-sm cursor-pointer hover:border-blue-400 transition-colors"
                          >
                            {word.text}
                          </motion.button>
                        ))
                      )}
                    </div>

                    {/* Shuffle pool of available words */}
                    <div className="flex flex-wrap items-center justify-center gap-2" dir="ltr">
                      {shuffledWords.map((word) => (
                        <motion.button
                          layoutId={word.id}
                          key={word.id}
                          onClick={() => handleWordSelect(word)}
                          disabled={isAnswered}
                          className="px-2.5 py-1 bg-slate-950 hover:bg-slate-900 text-slate-300 font-sans rounded-lg border border-slate-800 text-xs sm:text-sm hover:border-blue-500/30 transition-colors cursor-pointer"
                        >
                          {word.text}
                        </motion.button>
                      ))}
                    </div>

                  </div>
                ) : (
                  /* REVERSE TRANSLATION INPUT INTERFACE */
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-450 mb-1 text-right">
                      اكتب الجملة الألمانية المقابلة بالكامل:
                    </label>
                    <input
                      type="text"
                      value={userTextAnswer}
                      onChange={(e) => setUserTextAnswer(e.target.value)}
                      disabled={isAnswered}
                      placeholder="Geben Sie den deutschen Satz ein..."
                      className="w-full text-left font-sans text-base sm:text-lg px-4 py-3 bg-slate-950 text-white border border-blue-950/40 focus:border-cyan-500 rounded-xl focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-all placeholder:text-slate-700"
                      dir="ltr"
                    />
                  </div>
                )}
                
              </div>

              {/* Action and feedback row */}
              <AnimatePresence>
                {isAnswered && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`p-4 sm:p-5 rounded-2xl border flex flex-col items-start justify-between gap-4 ${
                      isCorrect 
                        ? "bg-emerald-950/30 border-emerald-900 text-emerald-100" 
                        : "bg-red-950/35 border-red-910/80 text-red-100"
                    }`}
                  >
                    <div className="space-y-2.5 w-full">
                      <div className="flex items-center gap-2">
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 animation-bounce" />
                            <span className="font-extrabold text-sm sm:text-base text-emerald-300">✅ إجابة صحيحة</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                            <span className="font-extrabold text-sm sm:text-base text-red-400">❌ توجد أخطاء في الجملة</span>
                          </>
                        )}
                      </div>

                      {/* Display correction details + Audio Listening */}
                      <div className="space-y-3 mt-1 text-xs text-right w-full">
                        
                        {/* Word analysis/highlighting (RED/Correct colored words) */}
                        {!isCorrect && (
                          <div className="space-y-1.5 p-3 rounded-lg bg-black/40 border border-red-950/40 w-full">
                            <span className="text-[10px] text-slate-400 font-bold block">الجملة التي كتبتها (الكلمات غير الصحيحة بالأحمر):</span>
                            
                            {grammarCheckLoading ? (
                              <div className="flex items-center gap-2 text-slate-500 py-1 font-sans">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-400" />
                                <span>جاري تلوين الكلمات الخاطئة وتحليل القواعد بالأبحاث الذكية...</span>
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-1.5 text-left font-sans text-sm sm:text-base" dir="ltr">
                                {wordAnalysis.length === 0 ? (
                                  <span className="text-red-300 line-through font-sans font-bold">{finalUserAnswerStr || "(فارغ)"}</span>
                                ) : (
                                  wordAnalysis.map((item, idx) => {
                                    const isErr = item.state === "error";
                                    return (
                                      <span 
                                        key={idx} 
                                        className={`font-sans font-extrabold px-1 py-0.5 rounded ${
                                          isErr 
                                            ? "text-red-500 bg-red-950/30 underline decoration-wavy decoration-red-500 select-all" 
                                            : "text-slate-300 select-all"
                                        }`}
                                        title={item.suggestion ? `التصحيح المقترح: ${item.suggestion}` : undefined}
                                      >
                                        {item.word}
                                      </span>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Complete Correct Reference Sentence with Voice */}
                        <div className="flex text-left gap-2.5 items-center justify-start p-3 bg-black/20 rounded-lg border border-slate-900 w-full" dir="ltr">
                          <SpeakButton text={activeSentence.german} className="shrink-0 scale-100" />
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 font-bold block" dir="rtl">الجملة الصحيحة والنموذجية للمقارنة:</span>
                            <span className="text-white font-sans font-black text-sm sm:text-base select-all tracking-wide">{activeSentence.german}</span>
                          </div>
                        </div>

                        {/* Simplistic grammar/spelling explanation translation */}
                        {!isCorrect && (
                          <div className="p-3 bg-slate-950/60 rounded-xl border border-red-950/30 w-full text-right space-y-1">
                            <span className="text-[10px] text-red-300 font-black flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                              شرح مبسط لأسباب الخطأ اللغوي:
                            </span>
                            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-sans pr-1">
                              {explanation || "⏳ يرجى الانتظار قليلاً ريثما يقوم المساعد بصياغة الشرح..."}
                            </p>
                          </div>
                        )}
                        
                        {isCorrect && (
                          <div className="flex items-center gap-1.5 text-emerald-400 font-bold p-1">
                            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>سيتم الانتقال تلقائياً إلى السؤال التالي خلال ثانيتين...</span>
                          </div>
                        )}

                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Primary interaction controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                {!isAnswered ? (
                  <button
                    onClick={handleCheckAnswer}
                    disabled={quizType === "word_ordering" ? selectedWords.length === 0 : !userTextAnswer.trim()}
                    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black rounded-xl transition-all shadow-[0_4px_15px_rgba(59,130,246,0.3)] hover:shadow-[0_4px_22px_rgba(34,211,238,0.5)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>تحقق من الإجابة</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                    {/* Retry Sentence Button */}
                    <button
                      onClick={handleRetrySentence}
                      className="w-full sm:w-1/2 px-6 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-300 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4 text-cyan-400" />
                      <span>إعادة الجملة</span>
                    </button>

                    {/* Next Question / Skip Button */}
                    <button
                      onClick={handleNextQuestion}
                      className="w-full sm:w-1/2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
                    >
                      <span>السؤال التالي</span>
                      <ArrowLeft className="w-4 h-4 text-white" />
                    </button>
                  </div>
                )}
              </div>

            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
