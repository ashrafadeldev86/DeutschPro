import React, { useState, useEffect } from "react";
import { Sentence, Tab, UserProfile, Achievement, PremiumRequest } from "./types";
import { 
  getStoredSentences, 
  saveStoredSentences 
} from "./utils";
import AddSentenceView from "./components/AddSentenceView";
import TrainingView from "./components/TrainingView";
import WritingDictationView from "./components/WritingDictationView";
import ConversationCommunityView from "./components/ConversationCommunityView";
import DashboardView from "./components/DashboardView";
import AuthView from "./components/AuthView";
import SettingsView from "./components/SettingsView";
import PremiumUpgradeView from "./components/PremiumUpgradeView";
import AdminDashboardView from "./components/AdminDashboardView";
import LessonsView from "./components/LessonsView";
import StatsView from "./components/StatsView";
import AchievementsView from "./components/AchievementsView";

import { 
  Sparkles, BookOpen, BrainCircuit, GraduationCap, Award, Calendar, 
  MessageSquare, Layers, Clock, TrendingUp, Mic, Sun, Moon, CheckCircle, 
  X, HelpCircle, Trophy, BarChart3, Menu, User, Settings, Lock, Shield, PlusCircle, ArrowLeft
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
  const [premiumRequests, setPremiumRequests] = useState<PremiumRequest[]>([]);
  const [initialRoomId, setInitialRoomId] = useState<string | null>(null);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [pendingTabTransition, setPendingTabTransition] = useState<Tab | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [hasActiveTrainingProgress, setHasActiveTrainingProgress] = useState(false);
  const [hasActiveWritingProgress, setHasActiveWritingProgress] = useState(false);
  
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

  // Synchronize client progress with server database
  const syncWithServer = async (userEmail: string, localProfile: UserProfile, currentSentences: Sentence[], currentAchievements: Achievement[]) => {
    try {
      const response = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail.toLowerCase().trim(),
          xp: localProfile.xp,
          level: localProfile.level,
          streak: localProfile.streak,
          sentences: currentSentences,
          achievements: currentAchievements,
          correctQuizzesCount: localProfile.correctQuizzesCount || 0,
          successfulSpeechesCount: localProfile.successfulSpeechesCount || 0,
          chatTurnsCompleted: localProfile.chatTurnsCompleted || 0,
          premiumStatus: localProfile.premiumStatus,
          premiumPlan: localProfile.premiumPlan
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          const mergedProfile: UserProfile = {
            ...localProfile,
            name: data.user.name,
            age: data.user.age,
            email: data.user.email,
            xp: data.user.xp,
            level: data.user.level,
            streak: data.user.streak,
            isPremium: data.user.isPremium,
            premiumStatus: data.user.premiumStatus,
            premiumPlan: data.user.premiumPlan,
            premiumExpiry: data.user.premiumExpiry,
            correctQuizzesCount: data.user.correctQuizzesCount,
            successfulSpeechesCount: data.user.successfulSpeechesCount,
            chatTurnsCompleted: data.user.chatTurnsCompleted,
            registered: true
          };
          saveProfileState(mergedProfile);

          if (data.user.sentences) {
            setSentences(data.user.sentences);
            if (typeof window !== "undefined") {
              localStorage.setItem("deutsch_spaced_rep_sentences", JSON.stringify(data.user.sentences));
            }
          }
          if (data.user.achievements && data.user.achievements.length > 0) {
            setAchievements(data.user.achievements);
            if (typeof window !== "undefined") {
              localStorage.setItem("deutsch_spaced_rep_achievements", JSON.stringify(data.user.achievements));
            }
          }
        }
      }
    } catch (err) {
      console.warn("Muted sync background warn:", err);
    }
  };

  // Sync admin requests table for admin user
  const fetchAdminRequests = async () => {
    if (profile.email !== "ashrafadelnn666@gmail.com") return;
    try {
      const response = await fetch(`/api/admin/requests?adminEmail=${encodeURIComponent(profile.email)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.requests) {
          setPremiumRequests(data.requests);
          if (typeof window !== "undefined") {
            localStorage.setItem("deutsch_spaced_rep_premium_requests", JSON.stringify(data.requests));
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch admin requests", e);
    }
  };

  // Load state on mount
  useEffect(() => {
    setSentences(getStoredSentences());
    
    if (typeof window !== "undefined") {
      // Parse URL Search parameters to detect invitation voice room links
      const params = new URLSearchParams(window.location.search);
      const targetRoom = params.get("room");
      if (targetRoom) {
        setInitialRoomId(targetRoom);
        setActiveTab(Tab.Conversation);
      }

      const storedProfile = localStorage.getItem("deutsch_spaced_rep_user_profile");
      const storedAchievements = localStorage.getItem("deutsch_spaced_rep_achievements");

      let loadedProfile: UserProfile | null = null;
      let loadedAchievements: Achievement[] = SYSTEM_ACHIEVEMENT_TEMPLATES;

      if (storedProfile) {
        try {
          loadedProfile = JSON.parse(storedProfile);
          if (loadedProfile) setProfile(loadedProfile);
        } catch (e) {
          console.error("Failed to parse stored profile", e);
        }
      }

      if (storedAchievements) {
        try {
          loadedAchievements = JSON.parse(storedAchievements);
          setAchievements(loadedAchievements);
        } catch (e) {
          console.error("Failed to parse stored achievements", e);
        }
      }

      // If registered with email, sync with back-end immediately
      if (loadedProfile && loadedProfile.email) {
        syncWithServer(loadedProfile.email, loadedProfile, getStoredSentences(), loadedAchievements);
      }

      // Track installation metric back-end
      const reported = localStorage.getItem("deutsch_app_installed_reported_2026");
      if (!reported) {
        fetch("/api/metrics/install", { method: "POST" })
          .then((res) => {
            if (res.ok) {
              localStorage.setItem("deutsch_app_installed_reported_2026", "true");
            }
          })
          .catch((err) => console.warn("Muted metrics install error:", err));
      }
    }
  }, []);

  // Sync admin telemetry periodically if admin is logged in
  useEffect(() => {
    if (profile.registered && profile.email === "ashrafadelnn666@gmail.com") {
      fetchAdminRequests();
      const interval = setInterval(fetchAdminRequests, 7500);
      return () => clearInterval(interval);
    }
  }, [profile.registered, profile.email]);

  // Save profile state whenever changes happen
  const saveProfileState = (newProfile: UserProfile) => {
    setProfile(newProfile);
    if (typeof window !== "undefined") {
      localStorage.setItem("deutsch_spaced_rep_user_profile", JSON.stringify(newProfile));
    }
  };

  const handleUpgradeRequestSubmit = async (data: Omit<PremiumRequest, "id" | "userName" | "createdAt" | "status">) => {
    if (!profile.email) return;

    try {
      const response = await fetch("/api/premium/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: profile.email,
          userName: profile.name,
          planName: data.planName,
          price: data.price,
          paymentMethod: data.paymentMethod,
          paypalAccount: data.paypalAccount,
          transactionId: data.transactionId,
          screenshot: data.screenshot
        })
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.success) {
          const updatedRequests = [resData.request, ...premiumRequests];
          setPremiumRequests(updatedRequests);
          if (typeof window !== "undefined") {
            localStorage.setItem("deutsch_spaced_rep_premium_requests", JSON.stringify(updatedRequests));
          }

          const updatedProfile: UserProfile = {
            ...profile,
            premiumStatus: "pending",
            premiumPlan: data.planName,
          };
          saveProfileState(updatedProfile);
        }
      }
    } catch (e) {
      console.error("Failed to submit upgrade request directly to backend", e);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/admin/requests/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminEmail: profile.email })
      });

      if (response.ok) {
        fetchAdminRequests();
        
        const updatedRequests = premiumRequests.map(r => {
          if (r.id === requestId) {
            return { ...r, status: "approved" as const };
          }
          return r;
        });
        setPremiumRequests(updatedRequests);

        const target = premiumRequests.find(r => r.id === requestId);
        if (target && target.userEmail === profile.email) {
          const updatedProfile: UserProfile = {
            ...profile,
            isPremium: true,
            premiumStatus: "approved",
            premiumPlan: target.planName,
          };
          saveProfileState(updatedProfile);
        }
      }
    } catch (e) {
      console.error("Approve error:", e);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/admin/requests/${requestId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminEmail: profile.email })
      });

      if (response.ok) {
        fetchAdminRequests();

        const updatedRequests = premiumRequests.map(r => {
          if (r.id === requestId) {
            return { ...r, status: "rejected" as const };
          }
          return r;
        });
        setPremiumRequests(updatedRequests);

        const target = premiumRequests.find(r => r.id === requestId);
        if (target && target.userEmail === profile.email) {
          const updatedProfile: UserProfile = {
            ...profile,
            isPremium: false,
            premiumStatus: "rejected",
          };
          saveProfileState(updatedProfile);
        }
      }
    } catch (e) {
      console.error("Reject error:", e);
    }
  };

  const handleToggleUserPremium = (isPremium: boolean) => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    
    const updatedProfile: UserProfile = {
      ...profile,
      isPremium,
      premiumStatus: isPremium ? "approved" : "none",
      premiumExpiry: isPremium ? expiryDate.toISOString() : undefined,
      premiumPlan: isPremium ? "الباقة الذهبية للمسؤول 🧪" : undefined,
    };
    saveProfileState(updatedProfile);
  };

  const handleInjectSamplePendingRequest = () => {
    const plansList = [
      { name: "الباقة الشهرية (شهر واحد)", price: "60 جنيه", method: "vodafone" as const },
      { name: "باقة 3 أشهر (المسار المتقدم)", price: "150 جنيه", method: "paypal" as const },
      { name: "الباقة السنوية (المحترف الطليق)", price: "500 جنيه", method: "vodafone" as const }
    ];
    const randomPlan = plansList[Math.floor(Math.random() * plansList.length)];
    const names = ["أحمد مراد", "سارة الشافعي", "محمود المصري", "ياسمين صبري", "اشرف عادل"];
    const randomName = names[Math.floor(Math.random() * names.length)];

    const fresh: PremiumRequest = {
      id: `sample-${Date.now()}`,
      userName: randomName,
      planName: randomPlan.name,
      price: randomPlan.price,
      paymentMethod: randomPlan.method,
      paypalAccount: randomPlan.method === "paypal" ? "test-student@paypal.com" : undefined,
      transactionId: randomPlan.method === "vodafone" ? `VOD-${Math.floor(100000 + Math.random() * 900000)}` : undefined,
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    const updated = [fresh, ...premiumRequests];
    setPremiumRequests(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("deutsch_spaced_rep_premium_requests", JSON.stringify(updated));
    }
  };

  const handleTabChangeAttempt = (targetTab: Tab) => {
    if (activeTab === targetTab) {
      setIsDrawerOpen(false);
      return;
    }
    const hasProgress = 
      (activeTab === Tab.Training && hasActiveTrainingProgress) ||
      (activeTab === Tab.Writing && hasActiveWritingProgress);

    if (hasProgress) {
      setPendingTabTransition(targetTab);
      setShowExitConfirm(true);
    } else {
      executeTabChange(targetTab);
    }
  };

  const executeTabChange = (targetTab: Tab) => {
    const isPremiumUser = profile.isPremium || profile.email?.toLowerCase().trim() === "ashrafadelnn666@gmail.com";
    if ((targetTab === Tab.Conversation || targetTab === Tab.Lessons) && !isPremiumUser) {
      setActiveTab(Tab.Premium);
      setIsDrawerOpen(false);
      alert("المحادثات الحية والدروس المتقدمة ميزة حصرية للاشتراك المدفوع Premium. يرجى الترقية ⭐");
      return;
    }
    setActiveTab(targetTab);
    setInitialRoomId(null);
    setHasActiveTrainingProgress(false);
    setHasActiveWritingProgress(false);
    setIsDrawerOpen(false);
  };

  const handleAuthSuccess = (dbUser: any) => {
    const starterProfile: UserProfile = {
      name: dbUser.name,
      age: dbUser.age,
      email: dbUser.email,
      xp: dbUser.xp,
      level: dbUser.level,
      streak: dbUser.streak,
      registered: true,
      theme: profile.theme,
      isPremium: dbUser.isPremium,
      premiumStatus: dbUser.premiumStatus,
      premiumPlan: dbUser.premiumPlan,
      premiumExpiry: dbUser.premiumExpiry,
      correctQuizzesCount: dbUser.correctQuizzesCount || 0,
      successfulSpeechesCount: dbUser.successfulSpeechesCount || 0,
      chatTurnsCompleted: dbUser.chatTurnsCompleted || 0,
    };

    saveProfileState(starterProfile);
    
    if (dbUser.sentences) {
      setSentences(dbUser.sentences);
      saveStoredSentences(dbUser.sentences);
    }
    if (dbUser.achievements && dbUser.achievements.length > 0) {
      setAchievements(dbUser.achievements);
      if (typeof window !== "undefined") {
        localStorage.setItem("deutsch_spaced_rep_achievements", JSON.stringify(dbUser.achievements));
      }
    }

    setActiveTab(Tab.Dashboard);
    evaluateAchievements(starterProfile, dbUser.sentences || [], dbUser.achievements || achievements);
  };

  // Master award XP and statistics updater
  const handleAwardXp = (xpAwarded: number, srcType: string) => {
    const nextXp = profile.xp + xpAwarded;
    const nextLevel = Math.floor(nextXp / 200) + 1;
    
    const updatedProfile: UserProfile = { ...profile };
    updatedProfile.xp = nextXp;
    updatedProfile.level = nextLevel;

    if (srcType === "correct_quizzes") {
      updatedProfile.correctQuizzesCount = (profile.correctQuizzesCount || 0) + 1;
    } else if (srcType === "speaking_sentences") {
      updatedProfile.successfulSpeechesCount = (profile.successfulSpeechesCount || 0) + 1;
    } else if (srcType === "chat_turns") {
      updatedProfile.chatTurnsCompleted = (profile.chatTurnsCompleted || 0) + 1;
    }

    if (Math.random() > 0.7) {
      updatedProfile.streak = profile.streak + 1;
    }

    saveProfileState(updatedProfile);
    evaluateAchievements(updatedProfile, sentences, achievements);

    if (profile.email) {
      syncWithServer(profile.email, updatedProfile, sentences, achievements);
    }
  };

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

      if (profile.email) {
        syncWithServer(profile.email, finalizedProfile, currentSentences, updated);
      }
    } else {
      if (profile.email) {
        syncWithServer(profile.email, currentProfile, currentSentences, updated);
      }
    }
  };

  const handleAddSentence = (german: string, arabic: string, langLevel?: any) => {
    const isPremiumUser = profile.isPremium || profile.email?.toLowerCase().trim() === "ashrafadelnn666@gmail.com";
    if (!isPremiumUser && sentences.length >= 150) {
      alert("لقد وصلت إلى الحد الأقصى للجمل في النسخة المجانية. قم بالترقية إلى Premium للحصول على جمل غير محدودة ومميزات حصرية.");
      return;
    }

    const newSentence: Sentence = {
      id: `sentence-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      german,
      arabic,
      level: 0,
      langLevel: langLevel || "A1",
      nextReview: new Date().toISOString(),
    };
    const updated = [newSentence, ...sentences];
    setSentences(updated);
    saveStoredSentences(updated);

    evaluateAchievements(profile, updated, achievements);
  };

  const handleDeleteSentence = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذه الجملة من مخزن المراجعة؟")) {
      const updated = sentences.filter((s) => s.id !== id);
      setSentences(updated);
      saveStoredSentences(updated);

      if (profile.email) {
        syncWithServer(profile.email, profile, updated, achievements);
      }
    }
  };

  const handleToggleTheme = () => {
    const nextTheme = profile.theme === "dark" ? "light" : "dark";
    const updated = {
      ...profile,
      theme: nextTheme
    };
    saveProfileState(updated);
  };

  const handleUpdateProfile = async (name: string, age: number, targetLevel: string) => {
    try {
      const response = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile.email, name, age, targetLevel })
      });
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.error };
      
      const updatedProfile = {
        ...profile,
        name: data.user.name,
        age: data.user.age,
        targetLevel: data.user.targetLevel
      };
      saveProfileState(updatedProfile);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "حدث خطأ غير متوقع." };
    }
  };

  const handleChangePassword = async (oldPass: string, newPass: string) => {
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile.email, oldPassword: oldPass, newPassword: newPass })
      });
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.error };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "فشل تغيير كلمة المرور." };
    }
  };

  const handleLogout = () => {
    if (confirm("هل تريد بالتأكيد تسجيل الخروج وتأمين الجلسة؟")) {
      const resetProfile: UserProfile = {
        name: "",
        age: 24,
        email: "",
        xp: 0,
        level: 1,
        streak: 1,
        registered: false,
        theme: profile.theme
      };
      saveProfileState(resetProfile);
      setSentences([]);
      setAchievements(SYSTEM_ACHIEVEMENT_TEMPLATES);
      setActiveTab(Tab.Dashboard);
      if (typeof window !== "undefined") {
        localStorage.removeItem("deutsch_spaced_rep_user_profile");
        localStorage.removeItem("deutsch_spaced_rep_achievements");
        localStorage.removeItem("deutsch_spaced_rep_premium_requests");
        localStorage.removeItem("deutsch_spaced_rep_sentences");
      }
    }
  };

  if (!profile.registered || !profile.email) {
    return (
      <AuthView
        onLoginSuccess={handleAuthSuccess}
        onSignupSuccess={handleAuthSuccess}
      />
    );
  }

  const isDark = profile.theme === "dark";
  const bgThemeClass = isDark 
    ? "bg-[#040608] text-[#f8fafc]" 
    : "bg-slate-50 text-slate-900";
  const cardThemeClass = isDark
    ? "bg-slate-950/70 border-slate-900"
    : "bg-white border-slate-200 shadow-[0_2px_15px_rgba(0,0,0,0.05)]";
  const sidebarHeaderClass = isDark ? "text-white" : "text-slate-900";
  const menuInactiveTextClass = isDark ? "text-[#94a3b8] hover:text-white" : "text-slate-500 hover:text-slate-950";

  const isAdmin = profile.email.toLowerCase().trim() === "ashrafadelnn666@gmail.com";
  
  // Navigation tabs updated to support the spectacular new design modules
  const navigationItems = [
    { id: Tab.Dashboard, label: "الرئيسية 📈" },
    { id: Tab.AddSentence, label: "المخزن 📖" },
    { id: Tab.Training, label: "التدريب 🧩" },
    { id: Tab.Writing, label: "الكتابة ✍️" },
    { id: Tab.Conversation, label: "المحادثة 💬" },
    { id: Tab.Premium, label: "الترقية 👑" },
    ...(isAdmin ? [{ id: Tab.Admin, label: "الإدارة 🛠️" }] : []),
    { id: Tab.Settings, label: "الإعدادات ⚙️" }
  ];

  return (
    <div className={`min-h-screen ${bgThemeClass} font-sans antialiased relative overflow-x-hidden selection:bg-blue-600/30 selection:text-white transition-colors duration-300`}>
      
      {/* Background spotlights */}
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
                <GraduationCap className="w-8 h-8 text-blue-500 animate-pulse bg-blue-600/10 p-1.5 rounded-xl border border-blue-500/20" />
                <div className="text-right">
                  <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                    DEUTSCH PRO 🇩🇪
                  </h1>
                  <span className={`inline-block text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${isDark ? "bg-blue-950/40 text-blue-400 border border-blue-500/10 font-sans" : "bg-blue-50 text-blue-750 border border-blue-100"}`}>
                    Gemini AI On Duty 🧠
                  </span>
                </div>
              </div>

              {/* Theme Support Toggles */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={handleToggleTheme}
                  className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                    isDark 
                      ? "bg-slate-900 border-slate-800 text-yellow-400 hover:text-white" 
                      : "bg-white border-slate-200 text-blue-600 hover:bg-slate-50"
                  }`}
                  title={isDark ? "تغيير إلى الوضع النهاري ☀️" : "تغيير إلى الوضع الليلي 🌙"}
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                {/* Navigation Tabs */}
                <nav className={`flex gap-1 bg-slate-950/20 p-1 rounded-2xl border flex-wrap justify-center ${isDark ? "border-white/5 bg-slate-950/40" : "border-slate-200 bg-slate-100"}`} dir="rtl">
                  {navigationItems.map((menuItem) => (
                    <button
                      key={menuItem.id}
                      onClick={() => {
                        const targetId = menuItem.id as Tab;
                        const isPremiumUser = profile.isPremium || profile.email?.toLowerCase().trim() === "ashrafadelnn666@gmail.com";
                        if (targetId === Tab.Conversation && !isPremiumUser) {
                          alert("المحادثات الحية والدروس المتقدمة متاحة حصرياً لمشتركي Premium. ⭐");
                          setActiveTab(Tab.Premium);
                          return;
                        }
                        setActiveTab(targetId);
                        if (targetId !== Tab.Conversation) {
                          setInitialRoomId(null); // Clear URL autojoins if they navigate away
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black cursor-pointer transition-all ${
                        activeTab === menuItem.id
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/10 border-white/10"
                          : menuInactiveTextClass
                      }`}
                    >
                      {menuItem.label}
                    </button>
                  ))}
                </nav>
              </div>
            </header>

            {/* Dynamic Card Area */}
            <div className="flex-grow">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: -7 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 7 }}
                  transition={{ duration: 0.15 }}
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
                      isPremium={profile.isPremium || profile.email?.toLowerCase().trim() === "ashrafadelnn666@gmail.com"}
                    />
                  )}

                  {activeTab === Tab.Training && (
                    <TrainingView
                      sentences={sentences}
                      onAwardXp={handleAwardXp}
                      profile={profile}
                    />
                  )}

                  {activeTab === Tab.Writing && (
                    <WritingDictationView
                      sentences={sentences}
                      onAwardXp={handleAwardXp}
                      profile={profile}
                    />
                  )}

                  {activeTab === Tab.Conversation && (
                    <ConversationCommunityView 
                      userProfile={{ name: profile.name, email: profile.email, xp: profile.xp, isPremium: profile.isPremium }} 
                      onAwardXp={handleAwardXp}
                      sentences={sentences}
                      initialRoomIdFromUrl={initialRoomId}
                    />
                  )}

                  {activeTab === Tab.Premium && (
                    <PremiumUpgradeView
                      profile={profile}
                      onSubmitUpgradeRequest={handleUpgradeRequestSubmit}
                    />
                  )}

                  {isAdmin && activeTab === Tab.Admin && (
                    <AdminDashboardView
                      profile={profile}
                      requests={premiumRequests}
                      onApproveRequest={handleApproveRequest}
                      onRejectRequest={handleRejectRequest}
                      onToggleUserPremiumStatus={handleToggleUserPremium}
                      onInjectSamplePendingRequest={handleInjectSamplePendingRequest}
                    />
                  )}

                  {activeTab === Tab.Settings && (
                    <SettingsView
                      profile={profile}
                      onUpdateProfile={handleUpdateProfile}
                      onChangePassword={handleChangePassword}
                      onLogout={handleLogout}
                      onNavigateToPremium={() => setActiveTab(Tab.Premium)}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            
          </main>

          {/* Sidebar Area */}
          <aside className={`lg:col-span-4 rounded-3xl p-6 space-y-6 order-2 lg:order-2 self-start shadow-xl border ${cardThemeClass}`} dir="rtl">
            
            <div className="space-y-1">
              <h2 className={`text-sm font-black flex items-center gap-2 ${sidebarHeaderClass}`}>
                <Layers className="w-4 h-4 text-purple-400 shrink-0" />
                لوحة الأداء اللغوي التراكمي
              </h2>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                متابعة شارات التقدم العلمي وأيام المثابرة المحتسبة للتعلم.
              </p>
            </div>

            {/* Profile Statistics Panel displays */}
            <div className="grid grid-cols-1 gap-3">
              <div className={`p-4 rounded-2xl flex flex-col border ${isDark ? "bg-slate-900/40 border-slate-850" : "bg-slate-50 border-slate-200"}`}>
                <span className="text-[10px] text-slate-500 font-bold">مجموع نقاط الـ XP المكتسبة:</span>
                <span className="text-xl font-black text-cyan-405 mt-1 font-sans">{profile.xp} XP ⭐</span>
              </div>

              <div className={`p-4 rounded-2xl flex flex-col border ${isDark ? "bg-slate-900/40 border-slate-850" : "bg-slate-50 border-slate-200"}`}>
                <span className="text-[10px] text-slate-500 font-bold">جلسات المذاكرة المتتالية:</span>
                <span className="text-xl font-black text-rose-500 mt-1 font-sans">{profile.streak} يوم 🔥</span>
              </div>

              <div className={`p-4 rounded-2xl flex flex-col border ${isDark ? "bg-slate-900/40 border-slate-850" : "bg-slate-50 border-slate-200"}`}>
                <span className="text-[10px] text-slate-500 font-bold">المستوى الفردي الكلي:</span>
                <span className="text-xl font-black text-amber-500 mt-1">المرحلة {profile.level} 👑</span>
              </div>
            </div>

            {/* Audio Training Box Quick Access block */}
            <div className={`p-4.5 rounded-2xl border space-y-2 relative overflow-hidden group ${
              isDark ? "bg-slate-950/40 border-cyan-500/15" : "bg-[#f0f9ff] border-blue-100"
            }`}>
              <div className="absolute top-0 right-0 w-1 h-full bg-purple-500/30" />
              
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-purple-400 uppercase">مختبر الإملاء الصوتي الذكي 🎙️</span>
                <span className="text-[8px] bg-purple-950 text-purple-400 font-bold px-1.5 py-0.5 rounded">مفعل</span>
              </div>
              
              <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                استمع لنطق المقالات الألمانية الرفيعة بالذكاء الاصطناعي، واختبر دقة إملائك النحوي فوراً بمراجعات تدريبية متقنة.
              </p>
              
              <button
                onClick={() => setActiveTab(Tab.Writing)}
                className="w-full text-center py-2 bg-slate-950 hover:bg-slate-900 text-slate-300 font-bold text-[10px] border border-slate-850 rounded-xl transition-all cursor-pointer block"
              >
                افتح مختبر الإملاء الفوري
              </button>
            </div>

            {/* Footer rights line */}
            <div className="pt-4 border-t border-slate-900 text-center flex flex-col items-center justify-center">
              <span className="text-[9px] text-slate-650 tracking-wider font-extrabold block">
                تطوير وبناء برمجيات تطبيق دويتش برو
              </span>
              <p className="text-[10px] font-black text-blue-500 mt-0.5">
                المهندس أشرف عادل عبدالعال © ٢٠٢٦
              </p>
            </div>

          </aside>

        </div>

      </div>

      {/* Accomplishments congrats modal popups */}
      <AnimatePresence>
        {newlyUnlockedAchievement && (
          <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4" dir="rtl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-yellow-500 text-center space-y-6 relative overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.35)]"
            >
              <div className="absolute top-0 right-0 w-full h-1.5 bg-gradient-to-l from-yellow-500 to-transparent" />
              
              <div className="w-16 h-16 bg-yellow-950 border border-yellow-500 rounded-full flex items-center justify-center text-4xl mx-auto animate-bounce">
                👑
              </div>

              <div className="space-y-2">
                <span className="text-[9px] text-yellow-500 font-bold block uppercase tracking-wider">تهانينا الحارة! لقد حققت وساماً جديداً!</span>
                <h3 className="text-xl font-black text-white">{newlyUnlockedAchievement.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{newlyUnlockedAchievement.description}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-850/80 inline-block font-sans">
                <span className="text-xs text-yellow-500 font-black">+{(newlyUnlockedAchievement as Achievement).xpAward} XP مكافأة خاصة! 🌟</span>
              </div>

              <div>
                <button
                  onClick={() => setNewlyUnlockedAchievement(null)}
                  className="w-full py-3 bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-500 hover:to-amber-400 text-slate-950 font-black rounded-xl transition-all shadow-[0_4px_15px_rgba(234,179,8,0.2)] cursor-pointer text-xs"
                >
                  حسناً، واصل التقدم المتميز 🚀
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
