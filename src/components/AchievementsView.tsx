import React from "react";
import { UserProfile, Achievement, Sentence } from "../types";
import { Award, Trophy, Lock, Unlock, Sparkles, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

interface AchievementsViewProps {
  profile: UserProfile;
  sentences: Sentence[];
  achievements: Achievement[];
}

export default function AchievementsView({ profile, sentences, achievements }: AchievementsViewProps) {
  
  // Get active progress values for requirements
  const getProgressValue = (requirementType: string) => {
    switch (requirementType) {
      case "sentences":
        return sentences.length;
      case "correct_quizzes":
        return profile.correctQuizzesCount || 0;
      case "speaking_sentences":
        return profile.successfulSpeechesCount || 0;
      case "chat_turns":
        return profile.chatTurnsCompleted || 0;
      case "xp_milestone":
        return profile.xp;
      default:
        return 0;
    }
  };

  const calculatePercent = (ach: Achievement) => {
    if (ach.unlocked) return 100;
    const current = getProgressValue(ach.requirementType);
    const target = ach.requirementValue;
    return Math.min(100, Math.round((current / target) * 100));
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const isDark = profile.theme === "dark";

  return (
    <div id="achievements-full-page" className="space-y-6 text-right dir-rtl animate-fadeIn" dir="rtl">
      
      {/* Page Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-yellow-950/20 to-slate-900 border border-slate-850 flex items-center justify-between">
        <div>
          <span className="text-sm font-black text-yellow-500 block mb-1">🏆 حائط الأوسمة والإنجازات اللغوية</span>
          <p className="text-xs text-slate-400 font-sans">تحديات متواصلة تحفزك على تحقيق التقدم وسرعة البديهة واكتساب شارات النخبة.</p>
        </div>
        <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-850 text-center shrink-0">
          <span className="text-[10px] text-slate-500 font-bold block mb-0.5">الأوسمة المغلفة</span>
          <span className="text-sm font-black text-yellow-500 font-sans">{unlockedCount} / {achievements.length} 🛡️</span>
        </div>
      </div>

      {/* Grid of accomplishments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.map((item, index) => {
          const pct = calculatePercent(item);
          const currentVal = getProgressValue(item.requirementType);
          
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 7 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 transition-all ${
                item.unlocked
                  ? "bg-gradient-to-br from-slate-900/50 to-slate-950/50 border-yellow-500/25 shadow-lg shadow-yellow-500/1"
                  : "bg-slate-950/20 border-slate-900/60 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                    item.unlocked 
                      ? "bg-yellow-950/40 text-yellow-500 border border-yellow-500/30" 
                      : "bg-slate-900 text-slate-500 border border-slate-800"
                  }`}>
                    {item.unlocked ? "🏆" : "🔒"}
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-black text-white flex items-center gap-1.5 leading-none">
                      {item.title}
                      {item.unlocked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 fill-emerald-950" />}
                    </span>
                    <p className="text-[10px] text-slate-400 leading-normal font-sans">{item.description}</p>
                  </div>
                </div>

                <div className="text-left shrink-0">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase font-sans ${
                    item.unlocked ? "bg-yellow-905 bg-yellow-500 text-slate-950" : "bg-slate-900 text-slate-550"
                  }`}>
                    +{item.xpAward} XP ⚡
                  </span>
                </div>
              </div>

              {/* Progress bar for achievement */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 font-sans">
                  <span>التقدم: {pct}%</span>
                  <span>{currentVal} من {item.requirementValue}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      item.unlocked ? "bg-gradient-to-r from-yellow-500 to-amber-500" : "bg-slate-800"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

            </motion.div>
          );
        })}
      </div>

    </div>
  );
}
