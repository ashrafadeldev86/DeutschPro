import React, { useState } from "react";
import { UserProfile } from "../types";
import { BookOpen, Sparkles, AlertCircle, HelpCircle, ArrowLeftRight, Check, Play, Lock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LessonsViewProps {
  profile: UserProfile;
}

const PREDEFINED_LESSONS = [
  {
    id: "a1-intro",
    level: "A1",
    title: "مستويات الجملة البسيطة (Hauptsatz)",
    description: "شرح هيكلية الجملة الألمانية الأساسية وموضع الفعل الملتزم بالمرتبة الثانية.",
    examples: [
      { de: "Ich lerne heute Deutsch.", ar: "أنا أتعلم اللغة الألمانية اليوم." },
      { de: "Heute lerne ich Deutsch.", ar: "اليوم أتعلم أنا اللغة الألمانية. (الفعل يظل في الترتيب الثاني)" }
    ],
    summary: "في الجملة الإخبارية العادية، يقع الفعل دائمًا في المرتبة الثانية (Position 2)، حتى لو قمنا بتغيير ترتيب الكلمات البادئة كالفاعل والظرف."
  },
  {
    id: "a2-akk-dat",
    level: "A2",
    title: "المجرور والمنصوب (Akkusativ & Dativ)",
    description: "الفرق الجوهري بين المفعول به المباشر المنصوب والمفعول به غير المباشر المجرور.",
    examples: [
      { de: "Ich gebe dem Mann den Brief.", ar: "أنا أعطي الرجل (Dativ) الخطاب (Akkusativ)." },
      { de: "Ich helfe dir.", ar: "أنا أساعدك. (الفعل helfen يتطلب دائماً مجروراً Dativ)" }
    ],
    summary: "يتغير تعريف الأسماء والضمائر حسب حالة الإعراب. حالة Akkusativ للمفعول المباشر، وحالة Dativ للمجرور أو المفعول غير المباشر والمستقبِل للحركة."
  },
  {
    id: "b1-weil-sub",
    level: "B1",
    title: "الجمل الجانبية باستخدام weil",
    description: "كيفية صياغة أسباب لغوية متسقة مع دفع الفعل المصرّف إلى نهاية الجملة.",
    examples: [
      { de: "Ich bleibe zu Hause, weil das Wetter schlecht ist.", ar: "أنا سأبقى في المنزل لأن الطقس يكون سيئاً." },
      { de: "Weil das Wetter schlecht ist, bleibe ich zu Hause.", ar: "بما أن الطقس سيء، سأبقى في المنزل." }
    ],
    summary: "تعمل الرابطة weil على تحويل الجملة إلى جملة فرعية (Nebensatz)، وفيها ينقل الفعل المصرف دائمًا إلى النهاية المطلقة للجملة."
  }
];

export default function LessonsView({ profile }: LessonsViewProps) {
  const [selectedLesson, setSelectedLesson] = useState<typeof PREDEFINED_LESSONS[0] | null>(PREDEFINED_LESSONS[0]);
  
  // Custom Explainer States
  const [prompt, setPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAskAIExplainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setErrorMsg("");
    setAiResponse("");

    try {
      const storedKey = localStorage.getItem("deutsch_spaced_rep_api_key_override") || "";
      const response = await fetch("/api/explain-lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: prompt.trim(),
          customApiKey: storedKey,
          email: profile.email
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "فشل توليد الشرح؛ يرجى المحاولة لاحقاً.");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setAiResponse(data.explanation);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "حدث خطأ غير متوقع أثناء الفحص التربوي.");
    } finally {
      setIsLoading(false);
    }
  };

  const isPremium = profile.isPremium || profile.email?.toLowerCase().trim() === "ashrafadelnn666@gmail.com";

  if (!isPremium) {
    return (
      <div id="lessons-locked-view" className="p-8 md:p-12 text-center rounded-3xl bg-slate-950/40 border border-slate-900 max-w-xl mx-auto space-y-6 dir-rtl text-right">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 text-3xl">
          🔒
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-black text-white">قسم شرح القواعد الدروس التفاعلية محمي</h3>
          <p className="text-xs text-slate-450 leading-relaxed font-sans">
            قواعد اللغة الألمانية وتفاصيل الأفعال والمجرور والمنصوب بالإضافة للمدقق اللغوي الخاص بنظام الذكاء الاصطناعي هي ميزات حصرية مخصصة ومصنفة للمشتركين بـ Premium.
          </p>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-850 rounded-2xl text-xs text-slate-400">
          يمكنك ترقية حسابك للحصول على شروحات متطورة وبلا قيود علمية ومحتوى pdf متجدد دائمًا.
        </div>
      </div>
    );
  }

  return (
    <div id="lessons-module" className="space-y-6 text-right dir-rtl" dir="rtl">
      
      {/* View Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/20 to-slate-900 border border-slate-850">
        <span className="text-sm font-black text-emerald-400 block mb-1">📚 الدروس اللغوية المنهجية (Grammatik)</span>
        <p className="text-xs text-slate-400">تصفح القواعد المشروحة بعناية وولد أي قاعدة تريد فحصها في ثوان بالذكاء الاصطناعي.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Lessons list */}
        <div className="lg:col-span-5 space-y-3">
          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">مقررات القواعد الجاهزة:</span>
          
          <div className="space-y-2">
            {PREDEFINED_LESSONS.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() => setSelectedLesson(lesson)}
                className={`w-full text-right p-4 rounded-xl border transition-all cursor-pointer block ${
                  selectedLesson?.id === lesson.id
                    ? "bg-emerald-950/20 border-emerald-500/40 text-white"
                    : "bg-slate-950/45 border-slate-900 text-slate-400 hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-black bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded font-sans">{lesson.level}</span>
                  <span className="text-xs font-black text-slate-200">{lesson.title}</span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-1 leading-normal font-sans">{lesson.description}</p>
              </button>
            ))}
          </div>

          {/* AI explainer prompt form */}
          <div className="p-4 bg-slate-950 border border-slate-900 rounded-2xl space-y-3 mt-4">
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400">
              <Sparkles className="w-4 h-4" />
              <span>مفسر القواعد الفوري بالذكاء الاصطناعي</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal font-sans">
              اكتب اسم أي قاعدة، تركيب بالألمانية أو أداة جر وسيقوم معلمك الذكي بصياغة شرح مخصص ومبسط ومطعم بالأمثلة لك فوراً.
            </p>

            <form onSubmit={handleAskAIExplainer} className="space-y-2">
              <input
                type="text"
                placeholder="أدخل قاعدة مثل: Akkusativ vs Dativ"
                disabled={isLoading}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white text-right font-bold focus:outline-none focus:border-emerald-600 transition-colors"
              />
              <button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-md disabled:opacity-50 transition-colors"
              >
                {isLoading ? "جاري صياغة الدرس وتنسيقه..." : "تفسير وشرح بالـ AI ✦"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Detailed Explanation Display */}
        <div className="lg:col-span-7">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-850 h-full flex flex-col justify-between min-h-[400px]">
            <AnimatePresence mode="wait">
              
              {/* If AI explainer active, show its response */}
              {isLoading || aiResponse || errorMsg ? (
                <motion.div
                  key="ai-explanation"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-black text-rose-450 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>درس مفسر ذكي: "{prompt}"</span>
                    </span>
                    <button
                      onClick={() => {
                        setAiResponse("");
                        setPrompt("");
                        setErrorMsg("");
                      }}
                      className="text-[10px] text-slate-500 underline font-black"
                    >
                      الرجوع للقواعد المعيارية
                    </button>
                  </div>

                  {isLoading && (
                    <div className="flex flex-col items-center justify-center py-12 space-y-3">
                      <div className="w-8 h-8 rounded-full border-2 border-emerald-500/10 border-t-emerald-500 animate-spin" />
                      <p className="text-xs text-slate-400">المعلم الذكي يقوم بكتابة الشرح بالأمثلة المترجمة والترتيب القياسي...</p>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="p-3.5 bg-red-950/20 text-red-300 border border-red-900/60 rounded-xl text-xs text-center font-bold">
                      {errorMsg}
                    </div>
                  )}

                  {aiResponse && (
                    <div className="space-y-4 whitespace-pre-line text-xs text-slate-300 leading-relaxed font-sans text-right max-h-[500px] overflow-y-auto pr-2">
                      {aiResponse}
                    </div>
                  )}

                </motion.div>
              ) : selectedLesson ? (
                
                /* Standard predefined lessons display */
                <motion.div
                  key={selectedLesson.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold bg-emerald-900/50 text-emerald-300 px-2 py-0.5 rounded font-sans">{selectedLesson.level}</span>
                    <h3 className="text-sm font-black text-white">{selectedLesson.title}</h3>
                  </div>

                  <p className="text-xs text-slate-400 font-sans leading-relaxed">{selectedLesson.description}</p>

                  <div className="space-y-3">
                    <span className="text-[10px] text-slate-500 font-bold block">أمثلة تطبيقية للتوضيح (مترجمة):</span>
                    <div className="space-y-2">
                      {selectedLesson.examples.map((ex, i) => (
                        <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-850 space-y-1">
                          <p className="font-sans font-black text-emerald-400 text-xs text-left dir-ltr">{ex.de}</p>
                          <p className="text-slate-400 text-[10px] font-bold">{ex.ar}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-1.5">
                    <span className="text-[9px] text-emerald-400 font-black block">💡 خلاصة الدرس:</span>
                    <p className="text-[10px] text-slate-350 leading-relaxed font-sans">{selectedLesson.summary}</p>
                  </div>
                </motion.div>
                
              ) : (
                <div className="flex items-center justify-center h-full py-12">
                  <p className="text-xs text-slate-550">يرجى تحديد درس أو كتابة موضوع للاستعلام.</p>
                </div>
              )}

            </AnimatePresence>

            <div className="text-[9px] text-slate-600 mt-4 border-t border-slate-850 pt-3 text-center font-sans">
              نظام جيرمن الذكي مع جيرمن تشيكر • المهندس أشرف عادل ٢٠٢٦
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
