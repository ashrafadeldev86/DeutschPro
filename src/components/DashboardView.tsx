import React from "react";
import { UserProfile, Achievement, Sentence } from "../types";
import { 
  Award, Flame, Sparkles, TrendingUp, BookOpen, Clock, 
  CheckCircle, ShieldAlert, GraduationCap, Trophy, Play 
} from "lucide-react";
import { motion } from "motion/react";

interface DashboardViewProps {
  profile: UserProfile;
  achievements: Achievement[];
  sentences: Sentence[];
  onNavigate: (tab: any) => void;
}

export default function DashboardView({ profile, achievements, sentences, onNavigate }: DashboardViewProps) {
  // Derivative statistics
  const now = new Date();
  const dueSentencesCount = sentences.filter((s) => new Date(s.nextReview) <= now).length;
  const sentenceCount = sentences.length;
  const masteredCount = sentences.filter(s => s.level >= 3).length;
  const learningCount = sentences.filter(s => s.level > 0 && s.level < 3).length;
  
  const overallMastery = Math.round(
    (sentences.reduce((sum, current) => sum + (current.level > 0 ? 1 : 0), 0) / (sentenceCount || 1)) * 100
  );

  // Calculate level boundary (each level is 200 XP)
  const xpNeededForNextLevel = 200;
  const xpInCurrentLevel = profile.xp % xpNeededForNextLevel;
  const progressPercent = Math.min(100, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100));

  // Count unlocked achievements
  const unlockedAchievementsCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="space-y-8" dir="rtl">
      
      {/* Welcome Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 md:p-8 rounded-3xl border bg-gradient-to-br from-slate-900/80 via-slate-950 to-blue-950/20 border-blue-900/30 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-md relative overflow-hidden"
      >
        {/* Ambient top glowing line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-cyan-500 via-blue-500 to-transparent" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-center md:text-right">
            <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase bg-cyan-950/40 px-3 py-1 rounded-full border border-cyan-900/30 inline-block">
              الملف التعلمي المخصص 💻
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-white">
              مرحباً بك مجدداً يا <span className="text-blue-400">{profile.name}</span>! 👋
            </h2>
            <p className="text-slate-400 text-xs max-w-xl leading-relaxed">
              عمرك المسجل هو {profile.age} عاماً. يسير نظامك التعليمي اليومي على مستواك الفعلي من التكرار وجلسات التدقيق التلقائي للأخطاء، لضمان أعلى فاعلية تذكر.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shrink-0">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center text-slate-950 font-black text-lg shadow-[0_0_15px_rgba(245,158,11,0.3)] shrink-0">
              {profile.level}
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-extrabold block">المستوى الحالي (Level)</span>
              <span className="text-base font-black text-white">خبير دويتش برو 🇩🇪</span>
              <div className="w-32 bg-slate-950 rounded-full h-1.5 mt-1.5 overflow-hidden border border-white/5">
                <div 
                  className="bg-yellow-500 h-full rounded-full" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[9px] text-[#94a3b8] block mt-1">{xpInCurrentLevel}/200 XP للمستوى {profile.level + 1}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Board Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-900 shadow-xl flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-bold block mb-1">النقاط الكلية (XP):</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black text-cyan-400">{profile.xp}</span>
            <span className="text-[10px] text-slate-650 font-bold">XP</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-900 shadow-xl flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-bold block mb-1">السلسلة المستمرة:</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black text-rose-500">{profile.streak}</span>
            <span className="text-xs text-rose-450 block">يوم 🔥</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-900 shadow-xl flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-bold block mb-1">الجمل المخزنة:</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black text-blue-500">{sentenceCount}</span>
            <span className="text-xs text-slate-500">جملة 📖</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-900 shadow-xl flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-bold block mb-1">الإتقان اللغوي:</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black text-yellow-500">{overallMastery}%</span>
            <span className="text-[9px] text-slate-500">({sentences.filter(s => s.level > 0).length} جملة &gt; 0)</span>
          </div>
        </div>

      </div>

      {/* Visual Analytics & Core progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sentence breakdown bar chart */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-slate-950 border border-blue-950/40 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              مستويات إتقان الجمل المحفوظة لديك
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              يصنف النظام جملك المحفوظة إلى ثلاث فئات تفصيلية لحساب نسبة المذاكرة الفعالة.
            </p>
          </div>

          <div className="space-y-4">
            
            {/* Mastered Category */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-405">
                <span>جمل تم استيعابها وإتقانها (مستوى 3 فأعلى)</span>
                <span className="text-emerald-400 font-extrabold">{masteredCount} جملة</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-white/5">
                <div 
                  className="bg-emerald-500 h-full rounded-full" 
                  style={{ width: `${(masteredCount / (sentenceCount || 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* In Progress Category */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-405">
                <span>تحت المراجعة والتعلم (مستوى 1 و 2)</span>
                <span className="text-blue-400 font-extrabold">{learningCount} جملة</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-white/5">
                <div 
                  className="bg-blue-500 h-full rounded-full" 
                  style={{ width: `${(learningCount / (sentenceCount || 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Zero Mastery Category */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-405">
                <span>جمل جديدة مضافة تحتاج إلى مراجعة أولية</span>
                <span className="text-yellow-500 font-extrabold">{sentences.filter(s => s.level === 0).length} جملة</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-white/5">
                <div 
                  className="bg-yellow-500 h-full rounded-full" 
                  style={{ width: `${(sentences.filter(s => s.level === 0).length / (sentenceCount || 1)) * 100}%` }}
                />
              </div>
            </div>

          </div>

          {dueSentencesCount > 0 ? (
            <div className="mt-6 p-3 rounded-xl bg-cyan-950/20 border border-cyan-900/30 flex items-center justify-between gap-4 text-xs">
              <span className="text-slate-350">هناك <b>{dueSentencesCount}</b> جملة متأخرة بالجدول بانتظارك!</span>
              <button 
                onClick={() => onNavigate("daily_quiz")}
                className="px-3 py-1.5 bg-cyan-500 text-slate-950 font-sans font-extrabold rounded-lg hover:bg-cyan-400 transition-colors cursor-pointer"
              >
                راجع الآن
              </button>
            </div>
          ) : (
            <div className="mt-6 p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/30 text-center text-xs text-emerald-400">
              أنت متميز للغاية! لقد راجعت كل جملك المتأخرة بالكامل اليوم! ✨
            </div>
          )}
        </div>

        {/* Quick play action cards */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-slate-950 border border-blue-950/40 relative overflow-hidden flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
              <Trophy className="w-5 h-5 text-yellow-500" />
              الأوسمة وشارات الإنجاز (Achievements)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              أكمل المهام اليومية لربح الشارات ونقاط الـ XP لمضاعفة رتبتك اللغوية بالتطبيق. لقد فتحت {unlockedAchievementsCount} من أصل {achievements.length} وساماً.
            </p>
          </div>

          {/* List of achievements */}
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {achievements.map((item) => (
              <div 
                key={item.id} 
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                  item.unlocked 
                    ? "bg-slate-900/80 border-slate-800 hover:bg-slate-900 text-white" 
                    : "bg-[#0a0c10]/40 border-[#1f2937]/50 opacity-45"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm ${
                    item.unlocked ? "bg-yellow-950 border border-yellow-850 text-yellow-400" : "bg-slate-900 text-slate-600"
                  }`}>
                    ★
                  </div>
                  <div>
                    <span className="text-xs font-bold block">{item.title}</span>
                    <span className="text-[10px] text-slate-455 block">{item.description}</span>
                  </div>
                </div>

                <div className="text-left">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                    item.unlocked 
                      ? "bg-emerald-950 text-emerald-450 border border-emerald-905" 
                      : "bg-slate-900 text-slate-500"
                  }`}>
                    {item.unlocked ? `مكتمل +${item.xpAward} XP` : "قيد الدراسة"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
