import React, { useState, useEffect } from "react";
import { Sentence, Tab, UserProfile, Achievement } from "./types";
import { 
  getStoredSentences, 
  saveStoredSentences 
} from "./utils";
import AddSentenceView from "./components/AddSentenceView";
import DailyQuizView from "./components/DailyQuizView";
import AIChatView from "./components/AIChatView";
import SpeakingPracticeView from "./components/SpeakingPracticeView";
import DashboardView from "./components/DashboardView";
import RegistrationView from "./components/RegistrationView";

import { 
  Sparkles, BookOpen, BrainCircuit, GraduationCap, Award, Calendar, 
  MessageSquare, Layers, Clock, TrendingUp, Mic, Sun, Moon, CheckCircle, 
  X, HelpCircle, Trophy, BarChart3 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const SYSTEM_ACHIEVEMENT_TEMPLATES: Achievement[] = [
  {
    id: "first_sentence",
    title: "بداية الطموح 📖",
    description: "قم بإضافة أول جملة ألمانية خاصة بك إلى مخزن التكرار.",
    iconName: "BookOpen",
    xpAward: 55,
    requirementType: "sentences",
    requirementValue: 1,
    unlocked: false,
  },
  {
    id: "quiz_champion",
    title: "بطل الاختبارات 🏆",
    description: "أجب بشكل صحيح على 4 مراجعات ذكية في الجمل.",
    iconName: "Award",
    xpAward: 100,
    requirementType: "correct_quizzes",
    requirementValue: 4,
    unlocked: false,
  },
  {
    id: "fluent_talker",
    title: "المتحدث الطليق 🗣️",
    description: "قم بنطق وتدريب التحدث لـ 3 جمل ألمانية بنسبة دقة تفوق 80%.",
    iconName: "Mic",
    xpAward: 120,
    requirementType: "speaking_sentences",
    requirementValue: 3,
    unlocked: false,
  },
  {
    id: "chat_explorer",
    title: "مستكشف الحوارات 💬",
    description: "شارك في 5 تبادلات حوارية وتصحيحية مع معلم الذكاء الاصطناعي.",
    iconName: "MessageSquare",
    xpAward: 100,
    requirementType: "chat_turns",
    requirementValue: 5,
    unlocked: false,
  },
  {
    id: "xp_milestone_1",
    title: "خبير الدويتش 🌟",
    description: "اكتسب إجمالي نقاط خبرة تراكمية تعادل 400 XP.",
    iconName: "Sparkles",
    xpAward: 150,
    requirementType: "xp_milestone",
    requirementValue: 400,
    unlocked: false,
  }
];

export default function App() {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Dashboard);
  
  // Profile state managed cleanly
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    age: 24,
    email: "",
    xp: 0,
    level: 1,
    streak: 1,
    registered: false,
    theme: "dark"
  });

  const [achievements, setAchievements] = useState<Achievement[]>(SYSTEM_ACHIEVEMENT_TEMPLATES);
  const [newlyUnlockedAchievement, setNewlyUnlockedAchievement] = useState<Achievement | null>(null);

  // Load state on mount
  useEffect(() => {
    setSentences(getStoredSentences());
    
    if (typeof window !== "undefined") {
      const storedProfile = localStorage.getItem("deutsch_spaced_rep_user_profile");
      const storedAchievements = localStorage.getItem("deutsch_spaced_rep_achievements");

      if (storedProfile) {
        try {
          setProfile(JSON.parse(storedProfile));
        } catch (e) {
          console.error("Failed to parse stored profile", e);
        }
      }

      if (storedAchievements) {
        try {
          setAchievements(JSON.parse(storedAchievements));
        } catch (e) {
          console.error("Failed to parse stored achievements", e);
        }
      }
    }
  }, []);

  // Save profile state whenever changes happen
  const saveProfileState = (newProfile: UserProfile) => {
    setProfile(newProfile);
    if (typeof window !== "undefined") {
      localStorage.setItem("deutsch_spaced_rep_user_profile", JSON.stringify(newProfile));
    }
  };

  // Onboarding registration
  const handleRegisterOnboarding = (name: string, age: number, targetLevel: string) => {
    const starterProfile: UserProfile = {
      name,
      age,
      email: "",
      xp: 50, // Starter registration gift!
      level: 1,
      streak: 1,
      registered: true,
      theme: "dark"
    };

    saveProfileState(starterProfile);
    setActiveTab(Tab.Dashboard);

    // Force run check for first achievement if anything matches
    evaluateAchievements(starterProfile, sentences, achievements);
  };

  // Master award XP and statistics updater
  const handleAwardXp = (xpAwarded: number, srcType: "speaking_sentences" | "sentences" | "correct_quizzes" | "chat_turns") => {
    // 1. Calculate next stats
    const nextXp = profile.xp + xpAwarded;
    
    // Each level requires 200 XP points
    const nextLevel = Math.floor(nextXp / 200) + 1;
    
    const updatedProfile: UserProfile = { ...profile };
    updatedProfile.xp = nextXp;
    updatedProfile.level = nextLevel;

    // Increment statistics based on source type
    if (srcType === "correct_quizzes") {
      updatedProfile.correctQuizzesCount = (profile.correctQuizzesCount || 0) + 1;
    } else if (srcType === "speaking_sentences") {
      updatedProfile.successfulSpeechesCount = (profile.successfulSpeechesCount || 0) + 1;
    } else if (srcType === "chat_turns") {
      updatedProfile.chatTurnsCompleted = (profile.chatTurnsCompleted || 0) + 1;
    }

    // Increase streak dynamically sometimes to make user feel happy
    if (Math.random() > 0.7) {
      updatedProfile.streak = profile.streak + 1;
    }

    saveProfileState(updatedProfile);
    evaluateAchievements(updatedProfile, sentences, achievements);
  };

  // Evaluate and check milestones
  const evaluateAchievements = (
    currentProfile: UserProfile, 
    currentSentences: Sentence[],
    currentAchievements: Achievement[]
  ) => {
    let newlyUnlocked: Achievement | null = null;
    
    const updated = currentAchievements.map(ach => {
      if (ach.unlocked) return ach;
      
      let isGoalMet = false;
      switch (ach.requirementType) {
        case "sentences":
          isGoalMet = currentSentences.length >= ach.requirementValue;
          break;
        case "correct_quizzes":
          isGoalMet = (currentProfile.correctQuizzesCount || 0) >= ach.requirementValue;
          break;
        case "speaking_sentences":
          isGoalMet = (currentProfile.successfulSpeechesCount || 0) >= ach.requirementValue;
          break;
        case "chat_turns":
          isGoalMet = (currentProfile.chatTurnsCompleted || 0) >= ach.requirementValue;
          break;
        case "xp_milestone":
          isGoalMet = currentProfile.xp >= ach.requirementValue;
          break;
      }

      if (isGoalMet) {
        newlyUnlocked = { ...ach, unlocked: true };
        return { ...ach, unlocked: true };
      }
      return ach;
    });

    if (updated) {
      setAchievements(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem("deutsch_spaced_rep_achievements", JSON.stringify(updated));
      }
    }

    // Award bonus XP on unlock and trigger overlay celebration!
    if (newlyUnlocked) {
      setNewlyUnlockedAchievement(newlyUnlocked);
      
      const nextXp = currentProfile.xp + (newlyUnlocked as Achievement).xpAward;
      const nextLevel = Math.floor(nextXp / 200) + 1;
      
      const finalizedProfile = {
        ...currentProfile,
        xp: nextXp,
        level: nextLevel
      };
      
      saveProfileState(finalizedProfile);
    }
  };

  // Mutator actions
  const handleAddSentence = (german: string, arabic: string) => {
    const newSentence: Sentence = {
      id: `sentence-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      german,
      arabic,
      level: 0,
      nextReview: new Date().toISOString(),
    };
    const updated = [newSentence, ...sentences];
    setSentences(updated);
    saveStoredSentences(updated);

    // Evaluate first sentence addition achievement
    evaluateAchievements(profile, updated, achievements);
  };

  const handleDeleteSentence = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذه الجملة من مخزن المراجعة؟")) {
      const updated = sentences.filter((s) => s.id !== id);
      setSentences(updated);
      saveStoredSentences(updated);
    }
  };

  const handleUpdateSentence = (updatedSentence: Sentence) => {
    const updated = sentences.map((s) => 
      s.id === updatedSentence.id ? updatedSentence : s
    );
    setSentences(updated);
    saveStoredSentences(updated);
  };

  // Toggle Theme
  const handleToggleTheme = () => {
    const nextTheme = profile.theme === "dark" ? "light" : "dark";
    const updated = {
      ...profile,
      theme: nextTheme
    };
    saveProfileState(updated);
  };

  // Derivative metrics
  const now = new Date();
  const dueSentencesCount = sentences.filter((s) => new Date(s.nextReview) <= now).length;
  const sentenceCount = sentences.length;
  const overallMastery = Math.round(
    (sentences.reduce((sum, current) => sum + (current.level > 0 ? 1 : 0), 0) / (sentenceCount || 1)) * 100
  );

  // If not registered yet, display onboarding registration page immediately
  if (!profile.registered) {
    return <RegistrationView onRegister={handleRegisterOnboarding} />;
  }

  // Choose styling classes based on Light/Dark active themes
  const isDark = profile.theme === "dark";
  const bgThemeClass = isDark 
    ? "bg-[#040608] text-[#f8fafc]" 
    : "bg-slate-50 text-slate-900";
  const cardThemeClass = isDark
    ? "bg-slate-950/70 border-slate-900"
    : "bg-white border-slate-200 shadow-[0_2px_15px_rgba(0,0,0,0.05)]";
  const sidebarHeaderClass = isDark ? "text-white" : "text-slate-900";
  const menuInactiveTextClass = isDark ? "text-[#94a3b8] hover:text-white" : "text-slate-500 hover:text-slate-950";

  return (
    <div className={`min-h-screen ${bgThemeClass} font-sans antialiased relative overflow-x-hidden selection:bg-blue-600/30 selection:text-white transition-colors duration-300`}>
      
      {/* Absolute Radial Background Spotlights - only on dark theme */}
      {isDark && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_100%_0%,rgba(12,21,36,0.6),transparent_70%)]" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_0%_100%,rgba(8,16,29,0.7),transparent_70%)]" />
          <div className="absolute top-[35%] left-[10%] w-[350px] h-[350px] bg-blue-900/5 blur-[120px] rounded-full" />
        </div>
      )}

      {/* Main Container Wrapper */}
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12 relative z-10 flex flex-col gap-8 min-h-screen">
        
        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Workspace Column */}
          <main className="lg:col-span-8 space-y-8 order-1 lg:order-1 flex flex-col h-full">
            
            {/* Header Area */}
            <header className="flex flex-col sm:flex-row items-center justify-between border-b border-white/10 pb-4 gap-4">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-8 h-8 text-blue-500 animate-pulse" />
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
                    DEUTSCH PRO 🇩🇪
                    <span className="text-blue-500">.</span>
                  </h1>
                  <span className={`inline-block text-[10px] uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-full ${isDark ? "bg-blue-950/40 text-blue-400 border border-blue-500/10" : "bg-blue-50 text-blue-700 border border-blue-100"}`}>
                    Gemini AI On Call 🤖
                  </span>
                </div>
              </div>

              {/* Theme support Sun/Moon toggler + nav */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* ☀️ / 🌙 Toggle Button */}
                <button
                  onClick={handleToggleTheme}
                  className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                    isDark 
                      ? "bg-slate-900 border-slate-800 text-yellow-400 hover:text-white" 
                      : "bg-white border-slate-200 text-blue-600 hover:bg-slate-50"
                  }`}
                  title={isDark ? "تغيير إلى الوضع النهاري ☀️" : "تغيير إلى الوضع الليلي 🌙"}
                >
                  {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
                </button>

                {/* Navigation Tabs */}
                <nav className={`flex gap-1 bg-slate-950/20 p-1 rounded-2xl border ${isDark ? "border-white/5 bg-slate-950/40" : "border-slate-200 bg-slate-100"}`} dir="rtl">
                  {[
                    { id: Tab.Dashboard, label: "الرئيسية 📈" },
                    { id: Tab.AddSentence, label: "المخزن 📖" },
                    { id: Tab.DailyQuiz, label: "الاختبار 🧩" },
                    { id: Tab.SpeakingPractice, label: "التحدث 🎙️" },
                    { id: Tab.AIChat, label: "الدردشة 💬" }
                  ].map((menuItem) => (
                    <button
                      key={menuItem.id}
                      onClick={() => setActiveTab(menuItem.id as Tab)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                        activeTab === menuItem.id
                          ? "bg-blue-600 text-white shadow-[0_2px_10px_rgba(37,99,235,0.3)]"
                          : menuInactiveTextClass
                      }`}
                    >
                      {menuItem.label}
                    </button>
                  ))}
                </nav>
              </div>
            </header>

            {/* Dynamic Tab Switchboard */}
            <div className="flex-grow">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === Tab.Dashboard && (
                    <DashboardView
                      profile={profile}
                      achievements={achievements}
                      sentences={sentences}
                      onNavigate={(selectedTab) => setActiveTab(selectedTab)}
                    />
                  )}

                  {activeTab === Tab.AddSentence && (
                    <AddSentenceView
                      sentences={sentences}
                      onAddSentence={handleAddSentence}
                      onDeleteSentence={handleDeleteSentence}
                    />
                  )}

                  {activeTab === Tab.DailyQuiz && (
                    <DailyQuizView
                      sentences={sentences}
                      onUpdateSentence={handleUpdateSentence}
                      onAwardXp={handleAwardXp}
                    />
                  )}

                  {activeTab === Tab.SpeakingPractice && (
                    <SpeakingPracticeView
                      sentences={sentences}
                      onAwardXp={handleAwardXp}
                    />
                  )}

                  {activeTab === Tab.AIChat && (
                    <AIChatView 
                      sentences={sentences} 
                      onAwardXp={handleAwardXp}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            
          </main>

          {/* Sidebar */}
          <aside className={`lg:col-span-4 rounded-3xl p-6 space-y-6 order-2 lg:order-2 self-start shadow-xl border ${cardThemeClass}`} dir="rtl">
            
            <div className="space-y-1.5">
              <h2 className={`text-base font-bold flex items-center gap-2 ${sidebarHeaderClass}`}>
                <Layers className="w-5 h-5 text-blue-500" />
                تحليل الملف التعليمي
              </h2>
              <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                تقارير التقدم والخلفيات الفنية لتدريبك الصوتي الشامل وحالة الأوسمة والنقاط.
              </p>
            </div>

            {/* Real Stats Displays */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 gap-4">
              
              <div className={`p-4 rounded-2xl flex flex-col justify-between border ${isDark ? "bg-slate-950/50 border-white/5" : "bg-slate-50 border-slate-200"}`}>
                <span className="text-xs text-[#94a3b8] font-bold">بانتظار المراجعة اليوم:</span>
                <span className="text-2xl font-black text-rose-500 mt-1">{dueSentencesCount} جملة ⏳</span>
              </div>

              <div className={`p-4 rounded-2xl flex flex-col justify-between border ${isDark ? "bg-slate-950/50 border-white/5" : "bg-slate-50 border-slate-200"}`}>
                <span className="text-xs text-[#94a3b8] font-bold">مجموع نقاط الـ XP:</span>
                <span className="text-2xl font-black text-cyan-400 mt-1">{profile.xp} XP ⭐</span>
              </div>

              <div className={`p-4 rounded-2xl flex flex-col justify-between border ${isDark ? "bg-slate-950/50 border-white/5" : "bg-slate-50 border-slate-200"}`}>
                <span className="text-xs text-[#94a3b8] font-bold">رتبة التكرار والمثابرة:</span>
                <span className="text-2xl font-black text-amber-500 mt-1">{profile.streak} أيام 🔥</span>
              </div>

            </div>

            {/* Speaking Practice Quick Link box */}
            <div className={`p-4 rounded-2xl border space-y-2 relative overflow-hidden group ${
              isDark ? "bg-slate-950/40 border-cyan-500/20" : "bg-[#f0f9ff] border-blue-100"
            }`}>
              <div className="absolute top-0 right-0 w-1.5 h-full bg-cyan-500/20 group-hover:bg-cyan-500/40 transition-colors" />
              
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-cyan-600 uppercase tracking-wide">جديد: التدريب على التحدث 🎙️</span>
                <span className="text-[9px] text-cyan-500 font-bold">نشط</span>
              </div>
              
              <p className={`text-[11px] leading-relaxed ${isDark ? "text-slate-350" : "text-slate-650"}`}>
                يقوم التطبيق الآن بمقارنة صوتك وتحدثك بالجمل الحقيقية عبر ميكروفونك ويمنحك نقاط دقة بـ AI مع توضيح للمخارج الخاطئة.
              </p>
              
              <button
                onClick={() => setActiveTab(Tab.SpeakingPractice)}
                className="w-full text-center py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-cyan-300 font-bold rounded-lg transition-colors cursor-pointer block"
              >
                جرب تدريب اللفظ الصوتي الآن
              </button>
            </div>

            {/* Signature Area */}
            <div className="pt-6 border-t border-slate-900 text-center flex flex-col items-center justify-center">
              <span className="text-[10px] text-slate-500 tracking-wider font-semibold">
                مطور التطبيق لتعلم الألمانية
              </span>
              <p className="text-xs font-bold text-blue-500 mt-1">
                تم إنشاءه من المهندس اشرف عادل عبدالعال
              </p>
            </div>

          </aside>

        </div>

      </div>

      {/* Full screen congratulatory modal celebrating dynamic unlocks */}
      <AnimatePresence>
        {newlyUnlockedAchievement && (
          <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4" dir="rtl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-yellow-500 text-center space-y-6 relative overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.3)]"
            >
              <div className="absolute top-0 right-0 w-full h-1.5 bg-gradient-to-l from-yellow-500 to-transparent" />
              
              <div className="w-16 h-16 bg-yellow-950 border border-yellow-500 rounded-full flex items-center justify-center text-4xl mx-auto animate-bounce">
                👑
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-yellow-500 font-extrabold uppercase tracking-widest block">لقد فتحت إنجازاً وساماً رائعاً!</span>
                <h3 className="text-2xl font-black text-white">{newlyUnlockedAchievement.title}</h3>
                <p className="text-sm text-slate-350 leading-relaxed">{newlyUnlockedAchievement.description}</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-850/80 inline-block">
                <span className="text-xs text-yellow-400 font-extrabold">+{(newlyUnlockedAchievement as Achievement).xpAward} XP نقاط خبرة ومستوى مكافأة! 🌟</span>
              </div>

              <div>
                <button
                  onClick={() => setNewlyUnlockedAchievement(null)}
                  className="w-full py-3 bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-500 hover:to-amber-400 text-slate-950 font-black rounded-xl transition-all shadow-[0_4px_15px_rgba(234,179,8,0.3)] cursor-pointer text-xs"
                >
                  شكراً جزيلًا! استمر بالتعلم 🚀
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
