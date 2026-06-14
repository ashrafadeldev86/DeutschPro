import React, { useState, useEffect } from "react";
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
    setIsAnswered(false);
    setIsCorrect(null);
    setUserTextAnswer("");
    setSelectedWords([]);
  }, [sentences, bypassFilter]);

  const activeSentence = activeQueue[currentIndex];

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
    
    // Reset answers
    setIsAnswered(false);
    setIsCorrect(null);
    setUserTextAnswer("");
    setSelectedWords([]);
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

  const handleCheckAnswer = () => {
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
    } else {
      // Mistake path: reset level to 0, schedule immediate
      updatedSentence.level = 0;
      updatedSentence.nextReview = new Date().toISOString();
    }

    onUpdateSentence(updatedSentence);
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < activeQueue.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Completed current queue!
      setActiveQueue([]);
      setCurrentIndex(0);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-right" dir="rtl">
      
      {/* Header with scheduler override switches */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/40 border border-blue-950/40">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-semibold text-slate-300">
            تمت الجدولة لـ: <b>{sentences.filter(s => new Date(s.nextReview) <= new Date()).length} جمل متأخرة</b>
          </span>
        </div>
        
        <button
          onClick={() => setBypassFilter(!bypassFilter)}
          className={`px-4 py-2 text-xs rounded-lg border font-bold flex items-center gap-2 transition-all cursor-pointer ${
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
        <div className="p-12 text-center rounded-3xl border border-slate-900 bg-slate-950/70 py-16 space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-blue-950/80 border border-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <CheckCircle2 className="w-8 h-8 text-cyan-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">رائع جداً! لا يوجد جمل مراجعة لليوم</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
              لقد أتقنت جميع الجمل المطلوبة في الوقت الحالي. يمكنك إضافة المزيد من الجمل أو تفعيل زر الالتفاف التجريبي بالأعلى لاختبار جميع الجمل في أي وقت!
            </p>
          </div>
          <div>
            <button
              onClick={() => setBypassFilter(true)}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-850 text-blue-400 hover:text-cyan-300 border border-blue-900/30 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              أريد اختبار وقراءة كل الجمل الآن على أي حال
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
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
              className="p-8 rounded-3xl border bg-slate-950 border-blue-950/80 shadow-[0_12px_44px_rgba(0,0,0,0.6)] space-y-8 relative overflow-hidden"
            >
              {/* Card visual accent */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-blue-700 via-cyan-500 to-transparent" />

              <div className="space-y-2">
                <span className="text-[10px] text-cyan-400 tracking-wider font-bold bg-blue-950/60 border border-blue-500/20 px-2.5 py-1 rounded-full uppercase">
                  {quizType === "word_ordering" ? "ترتيب الكلمات المتناثرة 🧩" : "ترجمة الجملة كتابياً ✏️"}
                </span>
                
                <h4 className="text-xs text-slate-500 font-bold pt-2">معنى الجملة بالعربية:</h4>
                <p className="text-2xl font-bold text-white pr-2 border-r-4 border-cyan-500 leading-snug">
                  {activeSentence.arabic}
                </p>
              </div>

              {/* Quiz interactive areas */}
              <div className="bg-slate-900/40 rounded-xl p-6 border border-blue-950/30 min-h-[140px] flex flex-col justify-center">
                
                {quizType === "word_ordering" ? (
                  /* WORD ORDERING GAME INTERFACE */
                  <div className="space-y-6">
                    {/* User answer building slot */}
                    <div className="flex flex-wrap items-center justify-center gap-2.5 p-3 rounded-lg border border-slate-900 bg-slate-950/90 text-left min-h-[50px]" dir="ltr">
                      {selectedWords.length === 0 ? (
                        <span className="text-xs text-slate-600 font-sans italic">انقر الكلمات بالأسفل لتقوم بترتيبها هنا...</span>
                      ) : (
                        selectedWords.map((word) => (
                          <motion.button
                            layoutId={word.id}
                            key={word.id}
                            onClick={() => handleWordDeselect(word)}
                            disabled={isAnswered}
                            className="px-3.5 py-1.5 bg-blue-900/60 hover:bg-blue-800 text-blue-100 font-bold font-sans rounded-lg border border-blue-500/30 text-sm cursor-pointer hover:border-blue-400"
                          >
                            {word.text}
                          </motion.button>
                        ))
                      )}
                    </div>

                    {/* Shuffle pool of available words */}
                    <div className="flex flex-wrap items-center justify-center gap-2.5" dir="ltr">
                      {shuffledWords.map((word) => (
                        <motion.button
                          layoutId={word.id}
                          key={word.id}
                          onClick={() => handleWordSelect(word)}
                          disabled={isAnswered}
                          className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 text-slate-300 font-sans rounded-lg border border-slate-800 text-sm hover:border-blue-500/30 transition-colors cursor-pointer"
                        >
                          {word.text}
                        </motion.button>
                      ))}
                    </div>

                  </div>
                ) : (
                  /* REVERSE TRANSLATION INPUT INTERFACE */
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-400 mb-1 text-right">
                      اكتب الجملة الألمانية المقابلة بالكامل:
                    </label>
                    <input
                      type="text"
                      value={userTextAnswer}
                      onChange={(e) => setUserTextAnswer(e.target.value)}
                      disabled={isAnswered}
                      placeholder="Geben Sie den deutschen Satz ein..."
                      className="w-full text-left font-sans text-lg px-4 py-3 bg-slate-950 text-white border border-blue-950/40 focus:border-cyan-500 rounded-xl focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-all placeholder:text-slate-700"
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
                    className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      isCorrect 
                        ? "bg-emerald-950/40 border-emerald-950 text-emerald-100" 
                        : "bg-red-950/40 border-red-910 text-red-100"
                    }`}
                  >
                    <div className="space-y-2 flex-grow">
                      <div className="flex items-center gap-2">
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                            <span className="font-bold text-sm text-emerald-300">إجابة صحيحة تماماً! أحسنت! 🎉</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                            <span className="font-bold text-sm text-red-400">إجابة خاطئة أو بحاجة لتصحيح إملاء.</span>
                          </>
                        )}
                      </div>

                      {/* Display correction details + Audio Listening */}
                      <div className="space-y-2 mt-1 text-xs text-right">
                        <div className="flex text-left gap-2.5 items-center justify-start" dir="ltr">
                          <SpeakButton text={activeSentence.german} className="shrink-0 scale-95" />
                          <div className="flex items-center gap-1">
                            <span className="text-slate-450 font-bold">الإجابة الصحيحة:</span>
                            <span className="text-white font-sans font-bold text-sm select-all">{activeSentence.german}</span>
                          </div>
                        </div>
                        {!isCorrect && (
                          <div className="flex text-left gap-1 items-center" dir="ltr">
                            <span className="text-slate-400">كتبت أنت:</span>
                            <span className="text-rose-300 font-sans line-through">
                              {quizType === "word_ordering" 
                                ? selectedWords.map(w => w.text).join(" ") 
                                : userTextAnswer || "(فارغ)"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md block bg-slate-950/80 mb-2 border text-center ${
                        isCorrect ? "border-emerald-500/20 text-emerald-400" : "border-red-500/20 text-red-400"
                      }`}>
                        {isCorrect ? `مستوى إتقانك: ${activeSentence.level}` : "تم تصفير المستوى وإعادة جدولتها"}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Primary interaction controls */}
              <div className="flex items-center justify-between pt-2">
                {!isAnswered ? (
                  <button
                    onClick={handleCheckAnswer}
                    disabled={quizType === "word_ordering" ? selectedWords.length === 0 : !userTextAnswer.trim()}
                    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-xl transition-all shadow-[0_4px_15px_rgba(59,130,246,0.3)] hover:shadow-[0_4px_22px_rgba(34,211,238,0.5)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>تحقق من الإجابة</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="w-full sm:w-auto px-8 py-3 bg-slate-900 border border-blue-900/40 hover:bg-blue-950/40 hover:border-blue-500/50 text-cyan-300 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>التالي</span>
                    <ArrowLeft className="w-4 h-4 text-cyan-400" />
                  </button>
                )}
              </div>

            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
