import React, { useState } from "react";
import { UserProfile } from "../types";
import { GraduationCap, Award, Flame, ChevronLeft, Sparkles, User, Calendar, Volume2 } from "lucide-react";
import { motion } from "motion/react";

interface RegistrationViewProps {
  onRegister: (name: string, age: number, targetLevel: string) => void;
}

export default function RegistrationView({ onRegister }: RegistrationViewProps) {
  const [name, setName] = useState("");
  const [age, setAge] = useState<number>(24);
  const [targetLevel, setTargetLevel] = useState("A1");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("برجاء إدخال اسمك الكريم للبدء.");
      return;
    }
    setErrorMsg("");
    onRegister(name.trim(), age, targetLevel);
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-white flex items-center justify-center p-4 selection:bg-blue-600/30 font-sans" dir="rtl">
      
      {/* Background Glows */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle_at_100%_0%,rgba(12,21,36,0.5),transparent_70%)]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle_at_0%_100%,rgba(59,130,246,0.1),transparent_70%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl p-8 rounded-3xl border bg-slate-950/95 border-blue-950/80 shadow-[0_24px_64px_rgba(0,0,0,0.85)] relative z-10 space-y-8"
      >
        {/* Dynamic Glowing border strip */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-l from-blue-600 via-cyan-400 to-transparent" />

        <div className="text-center space-y-3">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center border border-blue-400/20 shadow-[0_4px_24px_rgba(59,130,246,0.4)]">
            <GraduationCap className="w-10 h-10 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">مرحباً بك في DEUTSCH PRO</h1>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
              تطبيقك الذكي لتعلم وجدولة الجمل الألمانية بالتكرار المتباعد، والتدريب على النطق الصوتي والمحادثات تحت مظلة معالج الذكاء الاصطناعي Gemini.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300">
              ما هو اسمك الكريم؟
            </label>
            <div className="relative">
              <User className="absolute right-3.5 top-3.5 w-4.5 h-4.5 text-slate-500" />
              <input
                type="text"
                placeholder="أدخل اسمك هنا للترحيب والتسجيل"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pr-11 pl-4 py-3 bg-slate-900 border border-blue-950/60 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm placeholder:text-slate-600 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                العمر (سنوات):
              </label>
              <input
                type="number"
                min="6"
                max="120"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || 24)}
                className="w-full px-4 py-3.5 bg-slate-900 border border-blue-950/60 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm transition-colors text-center font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                مستوى الاستهداف الحالي:
              </label>
              <select
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-900 border border-blue-950/60 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm transition-colors text-center font-bold font-sans cursor-pointer"
              >
                <option value="A1">A1 - مبتدئ تماماً</option>
                <option value="A2">A2 - أساسيات بسيطة</option>
                <option value="B1">B1 - متوسط الحوار</option>
                <option value="B2">B2 - متقدم ومحترف</option>
              </select>
            </div>
          </div>

          {errorMsg && (
            <div className="text-red-400 text-xs font-bold bg-red-950/20 border border-red-900/40 p-2.5 rounded-lg text-center">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-xl transition-all shadow-[0_4px_24px_rgba(59,130,246,0.3)] hover:shadow-[0_4px_30px_rgba(34,211,238,0.5)] flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <span>ابدأ رحلتك اللغوية الآن 🚀</span>
          </button>

        </form>

        {/* Feature quick showcase */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-blue-950/40 text-center">
          <div className="p-2 bg-slate-900/40 border border-blue-950/20 rounded-lg">
            <span className="text-lg block">🎙️</span>
            <span className="text-[9px] text-slate-500 font-bold">نطق وتحدث مباشر</span>
          </div>
          <div className="p-2 bg-slate-900/40 border border-blue-950/20 rounded-lg">
            <span className="text-lg block">✨</span>
            <span className="text-[9px] text-slate-500 font-bold">معلم ذكاء دائم</span>
          </div>
          <div className="p-2 bg-slate-900/40 border border-blue-950/20 rounded-lg">
            <span className="text-lg block">📈</span>
            <span className="text-[9px] text-slate-500 font-bold">نقاط ومستويات ومكافآت</span>
          </div>
        </div>

        {/* Footer Credit */}
        <div className="text-center text-[10px] text-slate-600 border-t border-blue-950/10 pt-4">
          تم إنشاءه من المهندس اشرف عادل عبدالعال
        </div>

      </motion.div>
    </div>
  );
}
