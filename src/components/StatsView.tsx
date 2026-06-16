import React from "react";
import { UserProfile, Sentence } from "../types";
import { BarChart3, Star, Calendar, BookOpen, Layers, Sparkles, Sliders } from "lucide-react";
import { motion } from "motion/react";

interface StatsViewProps {
  profile: UserProfile;
  sentences: Sentence[];
  onNavigateToTab: (tab: any) => void;
}

export default function StatsView({ profile, sentences, onNavigateToTab }: StatsViewProps) {
  // Compute some interesting stats
  const totalSentences = sentences.length;
  
  // Count by CEFR Level
  const levelCounts = {
    A1: 0,
    A2: 0,
    B1: 0,
    B2: 0,
    C1: 0
  };

  sentences.forEach(s => {
    const levelKey = (s.langLevel || "A1") as keyof typeof levelCounts;
    if (levelCounts[levelKey] !== undefined) {
      levelCounts[levelKey]++;
    } else {
      levelCounts.A1++; // fallback
    }
  });

  const levelPercent = (lvlName: keyof typeof levelCounts) => {
    if (totalSentences === 0) return 0;
    return Math.round((levelCounts[lvlName] / totalSentences) * 100);
  };

  // Spaced-repetition statistics (levels 0 to 5)
  const masteries = {
    new: 0,      // Level 0
    learning: 0, // Level 1-2
    mastered: 0  // Level 3-5
  };

  sentences.forEach(s => {
    const lvl = s.level || 0;
    if (lvl === 0) masteries.new++;
    else if (lvl <= 2) masteries.learning++;
    else masteries.mastered++;
  });

  const isDark = profile.theme === "dark";

  return (
    <div id="stats-dashboard" className="space-y-6 text-right dir-rtl" dir="rtl">
      
      {/* Header Container */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/20 to-slate-900 border border-slate-850">
        <span className="text-sm font-black text-blue-400 block mb-1">📊 إحصائيات الأداء اللغوي الشاملة</span>
        <p className="text-xs text-slate-400 font-sans">تتبع دقيق لتقدمك اللغوي، مستوى الإتقان، وتصنيف الجمل حسب الإطار المرجعي الأوروبي.</p>
      </div>

      {/* Grid statistics boxes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="p-4 bg-slate-950 border border-slate-900 rounded-2xl flex flex-col items-center text-center">
          <BookOpen className="w-5 h-5 text-blue-400 mb-1 shrink-0" />
          <span className="text-[10px] text-slate-500 font-bold block mb-1">الجمل في المخزن</span>
          <span className="text-lg font-black text-white font-sans">{totalSentences} جملة</span>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-900 rounded-2xl flex flex-col items-center text-center">
          <Star className="w-5 h-5 text-yellow-500 mb-1 shrink-0" />
          <span className="text-[10px] text-slate-500 font-bold block mb-1">نقاط الـ XP الكلية</span>
          <span className="text-lg font-black text-yellow-500 font-sans">{profile.xp} XP</span>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-900 rounded-2xl flex flex-col items-center text-center">
          <Calendar className="w-5 h-5 text-rose-500 mb-1 shrink-0" />
          <span className="text-[10px] text-slate-500 font-bold block mb-1">جلسات متتالية</span>
          <span className="text-lg font-black text-rose-500 font-sans">{profile.streak} أيام</span>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-900 rounded-2xl flex flex-col items-center text-center">
          <Layers className="w-5 h-5 text-purple-400 mb-1 shrink-0" />
          <span className="text-[10px] text-slate-500 font-bold block mb-1">مستوى التقييم الحالي</span>
          <span className="text-lg font-black text-purple-400 uppercase font-sans">+{profile.level} LVL</span>
        </div>

      </div>

      {/* Visual Level distribution and mastery blocks */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* CEFR Level distributer charts */}
        <div className="md:col-span-7 bg-slate-900/40 border border-slate-850 p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-black text-white">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span>توزيع الجمل حسب مستويات CEFR</span>
          </div>

          {totalSentences === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">قم بإضافة جمل في المخزن لتمثيل الرسم البياني.</div>
          ) : (
            <div className="space-y-3.5">
              {(["A1", "A2", "B1", "B2", "C1"] as Array<keyof typeof levelCounts>).map((lvl) => (
                <div key={lvl} className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-300 font-sans font-black">{lvl} (المستوى {lvl === "A1" ? "المبتدئ" : lvl === "A2" ? "التأسيسي" : lvl === "B1" ? "المتوسط" : lvl === "B2" ? "فوق المتوسط" : "المتقدم"})</span>
                    <span className="text-slate-500 font-sans">{levelCounts[lvl]} جملة ({levelPercent(lvl)}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 border border-slate-900 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full rounded-full transition-all duration-300" 
                      style={{ width: `${levelPercent(lvl)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Spaced-Repetition statistics box */}
        <div className="md:col-span-5 bg-slate-900/40 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-black text-white">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>نظام التكرار المتباعد (Spaced Repetition)</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
              يتم تصنيف الجمل تلقائياً بناءً على إجاباتك الصحيحة والخاطئة في التدريبات.
            </p>

            <div className="space-y-2.5 pt-2">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400">🆕 جمل مضافة جديدة (مستواها 0):</span>
                <span className="font-sans font-black text-white bg-slate-900 border border-slate-850 px-2 py-0.5 rounded">{masteries.new}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400">✍️ قيد الدراسة والتمكين (مستواها 1-2):</span>
                <span className="font-sans font-black text-blue-400 bg-slate-900 border border-slate-850 px-2 py-0.5 rounded">{masteries.learning}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400">🏆 تم إتقانها وحفظها (مستواها 3-5):</span>
                <span className="font-sans font-black text-emerald-400 bg-slate-900 border border-slate-850 px-2 py-0.5 rounded">{masteries.mastered}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-850 mt-4 text-center">
            <button
              onClick={() => onNavigateToTab("training")}
              className="text-[10px] font-black text-blue-400 hover:text-blue-300 underline cursor-pointer"
            >
              ابدأ مراجعة ذكية آلية الآن 🔄
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
