import React, { useState } from "react";
import { Sentence } from "../types";
import { PlusCircle, Search, Trash2, Calendar, Award, AlertCircle, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { formatRelativeTime } from "../utils";

interface AddSentenceViewProps {
  sentences: Sentence[];
  onAddSentence: (german: string, arabic: string) => void;
  onDeleteSentence: (id: string) => void;
}

export default function AddSentenceView({
  sentences,
  onAddSentence,
  onDeleteSentence,
}: AddSentenceViewProps) {
  const [german, setGerman] = useState("");
  const [arabic, setArabic] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!german.trim() || !arabic.trim()) {
      setErrorMessage("برجاء ملء كلا الحقلين: الجملة بالألمانية وترجمتها بالعربية.");
      return;
    }

    // Basic regex check to verify that german doesn't have arabic characters or similar
    const containsArabicInGerman = /[\u0600-\u06FF]/.test(german);
    if (containsArabicInGerman) {
      setErrorMessage("تنبيه: يبدو أنك أدخلت أحرفاً عربية في حقل الجملة الألمانية!");
      return;
    }

    onAddSentence(german.trim(), arabic.trim());
    setSuccessMessage("تم حفظ الجملة بنجاح وتجهيزها للتكرار المتباعد! 🎉");
    setGerman("");
    setArabic("");
    
    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  };

  const filteredSentences = sentences.filter(
    (s) =>
      s.german.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.arabic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8" dir="rtl">
      {/* Introduction Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl border bg-slate-900/60 border-blue-950/50 shadow-[0_4px_24px_rgba(0,0,0,0.5)] backdrop-blur-md"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-950/80 rounded-xl border border-blue-500/20 text-blue-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">مخزن الجمل والتعلم الذاتي</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              أضف الجمل الألمانية اليومية مع ترجمتها العربية ليقوم التطبيق بجدولتها تلقائياً ضمن نظام التكرار المتباعد الذكي. كلما أجبت بشكل صحيح في الاختبار يزداد مستوى إتقانك وتتباعد فترات المراجعة!
            </p>
          </div>
        </div>
      </motion.div>

      {/* Grid: Form and Sentences List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Container */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl border bg-slate-950/80 border-blue-900/40 shadow-inner">
            <h3 className="text-lg font-bold text-blue-300 flex items-center gap-2 mb-4">
              <PlusCircle className="w-5 h-5 text-blue-400" />
              إضافة جملة ألمانية جديدة
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 text-right">
                  الجملة باللغة الألمانية (Deutsch):
                </label>
                <input
                  type="text"
                  value={german}
                  onChange={(e) => setGerman(e.target.value)}
                  placeholder="z.B. Ich lerne jeden Tag Deutsch"
                  className="w-full text-left px-4 py-3 bg-slate-900/90 text-white border border-blue-950/60 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-600 font-sans"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 text-right">
                  الترجمة باللغة العربية:
                </label>
                <input
                  type="text"
                  value={arabic}
                  onChange={(e) => setArabic(e.target.value)}
                  placeholder="مثال: أنا أتعلم اللغة الألمانية كل يوم"
                  className="w-full text-right px-4 py-3 bg-slate-900/90 text-white border border-blue-950/60 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              {/* Error and Success alerts */}
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 text-xs bg-red-950/50 border border-red-900/50 rounded-lg text-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="flex items-center gap-2 p-3 text-xs bg-emerald-950/50 border border-emerald-900/50 rounded-lg text-emerald-200">
                  <PlusCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{successMessage}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <span>حفظ في جدول المراجعة</span>
              </button>
            </form>
          </div>
        </div>

        {/* Sentences List Area */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 shrink-0">
              قائمة الجمل المحفوظة
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-200">
                {sentences.length} جملة
              </span>
            </h3>

            {/* Search input */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="ابحث عن جملة بالدويتش أو العربي..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-4 py-2 bg-slate-900/80 text-xs text-white border border-blue-950/60 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-blue-950 scrollbar-track-transparent">
            {filteredSentences.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20">
                <p className="text-slate-500 text-sm">لم يتم العثور على أي جمل مطابقة لعملية البحث.</p>
              </div>
            ) : (
              filteredSentences.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-5 rounded-2xl border bg-slate-900/40 border-slate-900 hover:border-blue-900/50 hover:bg-slate-900/60 transition-all flex justify-between items-center group relative overflow-hidden"
                >
                  {/* Subtle hover glow accent */}
                  <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500 transition-all opacity-0 group-hover:opacity-100" />

                  <div className="space-y-2 flex-grow pl-4">
                    {/* German sentence */}
                    <div className="text-left font-sans text-base font-bold text-blue-200 leading-snug group-hover:text-cyan-300 transition-colors" dir="ltr">
                      {item.german}
                    </div>
                    {/* Arabic translation */}
                    <div className="text-right text-sm text-slate-300">
                      {item.arabic}
                    </div>

                    {/* Metadata indicators */}
                    <div className="flex flex-wrap items-center gap-3.5 mt-2.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-900 px-2 py-1 rounded-md text-[10px] text-slate-400">
                        <Award className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                        مستوى الإتقان: <b className="text-yellow-400">{item.level}</b>
                      </span>

                      <span className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-900 px-2 py-1 rounded-md text-[10px] text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                        المراجعة القادمة: <b className="text-slate-300">{formatRelativeTime(item.nextReview)}</b>
                      </span>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => onDeleteSentence(item.id)}
                    className="p-2.5 hover:bg-red-950/40 text-slate-500 hover:text-red-400 rounded-xl transition-all cursor-pointer shrink-0"
                    title="حذف الجملة"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
