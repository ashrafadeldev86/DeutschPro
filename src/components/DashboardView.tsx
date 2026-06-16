import React, { useState, useEffect } from "react";
import { UserProfile, Achievement, Sentence, Tab } from "../types";
import { 
  Award, Flame, Sparkles, TrendingUp, BookOpen, Clock, 
  CheckCircle, MessageSquare, Play, Gamepad2, PenTool, Radio, HelpCircle,
  Lock, Unlock, Star, AlertCircle, BookOpenCheck, X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DashboardViewProps {
  profile: UserProfile;
  achievements: Achievement[];
  sentences: Sentence[];
  onNavigate: (tab: Tab) => void;
}

const MOTIVATIONAL_MESSAGES = [
  "أنت تحقق تقدماً رائعاً، افتح Premium للوصول إلى جميع الأدوات الاحترافية. ⭐",
  "المحادثات الحية والدروس المتقدمة متاحة حصرياً لمشتركي Premium. 🔒",
  "استثمر في تطوير لغتك الألمانية وافتح جميع المميزات الحصرية. 📈",
  "خطوة واحدة تفصلك عن تجربة تعلم ألمانية متكاملة بدون قيود. 🚀"
];

export default function DashboardView({ profile, achievements, sentences, onNavigate }: DashboardViewProps) {
  const [randomMessage, setRandomMessage] = useState("");
  const [showLessonsModal, setShowLessonsModal] = useState(false);

  useEffect(() => {
    const idx = Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length);
    setRandomMessage(MOTIVATIONAL_MESSAGES[idx]);
  }, []);

  const isPremium = profile.isPremium || profile.email?.toLowerCase().trim() === "ashrafadelnn666@gmail.com";

  // Derivative statistics
  const now = new Date();
  const dueSentencesCount = sentences.filter((s) => new Date(s.nextReview) <= now).length;
  const sentenceCount = sentences.length;
  
  // Calculate level boundary (each level is 200 XP)
  const xpNeededForNextLevel = 200;
  const xpInCurrentLevel = profile.xp % xpNeededForNextLevel;
  const progressPercent = Math.min(100, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100));

  // Count unlocked achievements
  const unlockedAchievementsCount = achievements.filter(a => a.unlocked).length;

  return (
    <div id="dashboard-container" className="space-y-8 text-right dir-rtl" dir="rtl">
      
      {/* MOTIVATIONAL BANNER FOR FREE USERS */}
      {!isPremium && randomMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent border border-amber-500/20 shadow-md flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <span className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-yellow-500 text-lg">
              📢
            </span>
            <p className="text-xs sm:text-sm font-black text-amber-200">
              {randomMessage}
            </p>
          </div>
          <button
            onClick={() => onNavigate(Tab.Premium)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-extrabold text-[10px] rounded-xl transition-all shadow-sm shrink-0 cursor-pointer"
          >
            جرب Premium 👑
          </button>
        </motion.div>
      )}

      {/* Welcome Card Info */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 md:p-8 rounded-3xl border bg-gradient-to-br from-slate-900/80 via-slate-950 to-blue-950/25 border-blue-900/30 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-md relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-cyan-500 via-blue-500 to-transparent" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-center md:text-right">
            <span className="text-xs font-black text-cyan-400 tracking-wider uppercase bg-cyan-950/50 px-3 py-1 rounded-full border border-cyan-900/30 inline-block">
              الملف التعليمي الموحّد {isPremium && "👑 Premium"}
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-white flex items-center justify-center md:justify-start gap-2">
              أهلاً بك يا <span className="text-blue-405">{profile.name || "العضو الجديد"}</span> 👋
              {isPremium && (
                <span className="text-xs bg-gradient-to-r from-yellow-500 to-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black animate-bounce align-middle">
                  PREMIUM
                </span>
              )}
            </h2>
            <p className="text-slate-400 text-xs max-w-xl leading-relaxed">
              يسجل نظامك الحسابي إجمالي نقاط خبرة تراكمية لتقييم مستواك الفعلي. قم بزيارة مخزن الجمل لإدخال مفرداتك المخصصة للتكرار المتباعد وزيادة إتقانك اللغوي.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 p-4 rounded-2xl shrink-0">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-[0_0_15px_rgba(124,58,237,0.3)] shrink-0 font-sans">
              {profile.level}
            </div>
            <div>
              <span className="text-[9px] text-slate-500 font-extrabold block">المستوى الحالي (Level)</span>
              <span className="text-sm font-black text-white">متحدث دويتش برو</span>
              <div className="w-32 bg-slate-900 rounded-full h-1.5 mt-1.5 overflow-hidden border border-white/5">
                <div 
                  className="bg-purple-500 h-full rounded-full" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[9px] text-slate-500 block mt-1 font-sans">{xpInCurrentLevel}/200 XP للمستوى {profile.level + 1}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Stats Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-900 shadow flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-bold block">إجمالي شارات الخبرة:</span>
          <span className="text-2xl font-black text-cyan-400 mt-1 font-sans">{profile.xp} <span className="text-[10px] text-slate-650">XP</span></span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-900 shadow flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-bold block">المواظبة التكرارية:</span>
          <span className="text-2xl font-black text-rose-500 mt-1 font-sans">{profile.streak} <span className="text-xs text-slate-500">أيام</span></span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-900 shadow flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-bold block">مجموع جملك الخاصة:</span>
          <span className="text-2xl font-black text-blue-500 mt-1 font-sans">{sentenceCount} <span className="text-xs text-slate-500">جملة</span></span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-905 shadow flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-bold block">الأوسمة المتاحة:</span>
          <span className="text-2xl font-black text-yellow-500 mt-1 font-sans">{unlockedAchievementsCount} <span className="text-xs text-slate-500">شارات</span></span>
        </div>
      </div>

      {/* FOUR EXCLUSIVELY DESIGNED CORE INTERACTIVE SECTIONS (Including Lessons explained) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-1 text-right">
          <Sparkles className="w-5 h-5 text-purple-400 animate-spin" style={{ animationDuration: "10s" }} />
          <h3 className="text-base font-black text-white">المسارات الحوارية والألعاب الذكية</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* 1. TRAINING BLOCK CARD */}
          <motion.div
            whileHover={{ y: -3, borderColor: "rgba(147, 51, 234, 0.4)" }}
            className="p-5 rounded-3xl bg-slate-950/80 border border-slate-900 flex flex-col justify-between h-[235px] shadow-2xl relative overflow-hidden group cursor-pointer"
            onClick={() => onNavigate(Tab.Training)}
          >
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-600/20 transition-all">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-black text-white group-hover:text-purple-300 transition-colors">1. التدريب التفاعلي</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                ألعاب ترتيب الكلمات والبطاقات العشوائية، ترجمة حية بمطابقة فورية، وفحص القواعد بالذكاء الاصطناعي مع نقاط XP.
              </p>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-900 text-[10px] font-bold text-slate-500">
              <span>ترتيب وترجم بـ AI</span>
              <span className="text-purple-400 font-extrabold flex items-center gap-0.5">ابدأ ➔</span>
            </div>
          </motion.div>

          {/* 2. WRITING BLOCK CARD */}
          <motion.div
            whileHover={{ y: -3, borderColor: "rgba(37, 99, 235, 0.4)" }}
            className="p-5 rounded-3xl bg-slate-950/80 border border-slate-900 flex flex-col justify-between h-[235px] shadow-2xl relative overflow-hidden group cursor-pointer"
            onClick={() => onNavigate(Tab.Writing)}
          >
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-600/20 transition-all">
                <PenTool className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-black text-white group-hover:text-blue-300 transition-colors">2. الكتابة والإملاء</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                مختبر الإملاء الصوتي الذكي. استمع لنطق الجملة الألمانية الفصيحة واكتبها للاطلاع على الأخطاء فوراً.
              </p>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-900 text-[10px] font-bold text-slate-500">
              <span>ديكتاشن صوتي</span>
              <span className="text-blue-400 font-extrabold flex items-center gap-0.5">افتح ➔</span>
            </div>
          </motion.div>

          {/* 3. CONVERSATION BLOCK CARD (Premium Only) */}
          <motion.div
            whileHover={{ y: -3, borderColor: isPremium ? "rgba(236, 72, 153, 0.4)" : "rgba(234, 179, 8, 0.4)" }}
            className="p-5 rounded-3xl bg-slate-950/80 border border-slate-900 flex flex-col justify-between h-[235px] shadow-2xl relative overflow-hidden group cursor-pointer"
            onClick={() => {
              if (isPremium) {
                onNavigate(Tab.Conversation);
              } else {
                onNavigate(Tab.Premium);
              }
            }}
          >
            {/* GOLD BADGE / BLUR COVER FOR FREE USERS */}
            {!isPremium && (
              <>
                <div className="absolute top-2.5 left-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md z-20">
                  <Lock className="w-2.5 h-2.5 animate-[bounce_1.5s_infinite]" />
                  <span>🔒 Premium Feature</span>
                </div>
                <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px] group-hover:backdrop-blur-none transition-all duration-300 z-10" />
              </>
            )}

            <div className="space-y-2 relative z-0">
              <div className="h-10 w-10 rounded-xl bg-rose-600/10 border border-rose-500/20 flex items-center justify-center text-rose-450 group-hover:bg-rose-600/20 transition-all">
                <Radio className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-black text-white group-hover:text-rose-300 transition-colors">3. المحادثة والمجتمع</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                حوار متبادل كتابي وصوتي مع المعلم الألماني AI، وانضم لغرف النقاش الصوتي الحية والمستويات المتعددة.
              </p>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-900 text-[10px] font-bold text-slate-500 relative z-0">
              <span>تواصل وغرف صوتية</span>
              <span className="text-rose-450 font-extrabold flex items-center gap-0.5">افتح ➔</span>
            </div>
          </motion.div>

          {/* 4. LESSONS BLOCK CARD (Premium Only - New!) */}
          <motion.div
            whileHover={{ y: -3, borderColor: isPremium ? "rgba(16, 185, 129, 0.4)" : "rgba(234, 179, 8, 0.4)" }}
            className="p-5 rounded-3xl bg-slate-950/80 border border-slate-900 flex flex-col justify-between h-[235px] shadow-2xl relative overflow-hidden group cursor-pointer"
            onClick={() => {
              if (isPremium) {
                setShowLessonsModal(true);
              } else {
                onNavigate(Tab.Premium);
              }
            }}
          >
            {/* BADGE / BLUR COVER FOR FREE USERS */}
            {!isPremium ? (
              <>
                <div className="absolute top-2.5 left-2.5 bg-gradient-to-r from-red-550 to-amber-600 bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md z-20">
                  <Lock className="w-2.5 h-2.5 animate-[spin_3s_infinite]" />
                  <span>🔒 محتوى مدفوع</span>
                </div>
                <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px] group-hover:backdrop-blur-none transition-all duration-300 z-10" />
              </>
            ) : (
              <div className="absolute top-2.5 left-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md z-20">
                <Unlock className="w-2.5 h-2.5" />
                <span>مفتوح 🔓</span>
              </div>
            )}

            <div className="space-y-2 relative z-0">
              <div className="h-10 w-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-600/20 transition-all">
                <BookOpen className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-black text-white group-hover:text-emerald-300 transition-colors">📚 شرح الدروس</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                تحليل قواعد ونحويات اللغة الألمانية، شرح الأزمنة وتكوين الجمل، وتدريبات احترافية مع ملفات PDF مخصصة.
              </p>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-900 text-[10px] font-bold text-slate-500 relative z-0">
              <span>منهج متكامل احترافي</span>
              <span className="text-emerald-400 font-extrabold flex items-center gap-0.5">اقرأ الدروس ➔</span>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Achievements List */}
      <div className="bg-slate-950/40 p-6 rounded-3xl border border-slate-900">
        <h3 className="text-base font-black text-white flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-yellow-500" />
          مقررات الأوسمة والانجازات الألمانية (Deutsche Achievements)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((item) => (
            <div 
              key={item.id} 
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                item.unlocked 
                  ? "bg-slate-900/40 border-slate-800 text-white" 
                  : "bg-slate-950/20 border-slate-905 opacity-40"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  item.unlocked ? "bg-yellow-950/40 text-yellow-400 border border-yellow-800" : "bg-slate-900 text-slate-500"
                }`}>
                  🏆
                </div>
                <div>
                  <span className="text-xs font-extrabold block">{item.title}</span>
                  <span className="text-[10px] text-slate-500 block">{item.description}</span>
                </div>
              </div>

              <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                item.unlocked ? "bg-emerald-950 text-emerald-400" : "bg-slate-900 text-slate-500"
              }`}>
                {item.unlocked ? "مكتمل ✓" : "قيد الدراسة"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* DETAILED LESSONS MODAL PROGRESS POPUP */}
      <AnimatePresence>
        {showLessonsModal && (
          <div className="fixed inset-0 bg-slate-95 z-50 flex items-center justify-center p-4" dir="rtl">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-950/90" onClick={() => setShowLessonsModal(false)} />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="max-w-2xl w-full p-6 sm:p-8 rounded-3xl bg-slate-900 border border-emerald-500/30 text-right space-y-6 relative overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.15)] z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="absolute top-0 right-0 w-full h-1.5 bg-gradient-to-l from-emerald-500 to-transparent" />
              
              <button 
                onClick={() => setShowLessonsModal(false)} 
                className="absolute top-4 left-4 p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 rounded-lg cursor-pointer transition-all hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <span className="text-3xl">📚</span>
                <h3 className="text-xl font-black text-white">شرح الدروس</h3>
              </div>

              <div className="space-y-4 border-b border-slate-800 pb-4">
                <p className="text-emerald-400 font-black text-sm">شكراً لاشتراكك في النسخة المدفوعة.</p>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  نعمل حالياً على إعداد محتوى تعليمي احترافي وشامل لتعلم اللغة الألمانية بأفضل جودة ممكنة.
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">🚀 قريباً سيتم إضافة:</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-350 font-sans">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/50 border border-slate-800/60">
                    <span className="text-emerald-400 font-extrabold">•</span>
                    <span>شرح قواعد اللغة الألمانية.</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/50 border border-slate-800/60">
                    <span className="text-emerald-400 font-extrabold">•</span>
                    <span>شرح الأزمنة.</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/50 border border-slate-800/60">
                    <span className="text-emerald-400 font-extrabold">•</span>
                    <span>شرح الضمائر.</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/50 border border-slate-800/60">
                    <span className="text-emerald-400 font-extrabold">•</span>
                    <span>شرح تكوين الجمل.</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/50 border border-slate-800/60">
                    <span className="text-emerald-400 font-extrabold">•</span>
                    <span>المحادثات اليومية.</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/50 border border-slate-800/60">
                    <span className="text-emerald-400 font-extrabold">•</span>
                    <span>تدريبات تفاعلية.</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/50 border border-slate-800/60">
                    <span className="text-emerald-400 font-extrabold">•</span>
                    <span>ملفات PDF تعليمية.</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/50 border border-slate-800/60">
                    <span className="text-emerald-400 font-extrabold">•</span>
                    <span>فيديوهات تعليمية.</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-1.5 text-xs text-slate-400 font-sans leading-normal">
                <p>⏳ المحتوى التعليمي قيد التجهيز حالياً وسيتم نشره تدريجياً.</p>
                <p>🔔 سيتم إشعار جميع المشتركين فور إضافة الدروس الجديدة.</p>
              </div>

              <div className="pt-2 text-center text-xs font-extrabold text-emerald-400 border-t border-slate-800/80">
                شكراً لثقتك ودعمك للمشروع. ❤️
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
