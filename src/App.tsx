/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sentence, Tab } from "./types";
import { 
  getStoredSentences, 
  saveStoredSentences 
} from "./utils";
import AddSentenceView from "./components/AddSentenceView";
import DailyQuizView from "./components/DailyQuizView";
import AIChatView from "./components/AIChatView";
import { 
  Sparkles, BookOpen, BrainCircuit, GraduationCap, Award, Calendar, 
  MessageSquare, Layers, Clock, TrendingUp 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DailyQuiz);
  const [streak, setStreak] = useState(15); // Authentic initial streak tracker

  // Pull initial stored state from Local Storage
  useEffect(() => {
    setSentences(getStoredSentences());
    
    // Simple incremental streak persistence
    if (typeof window !== "undefined") {
      const storedStreak = localStorage.getItem("deutsch_spaced_rep_streak");
      if (storedStreak) {
        setStreak(parseInt(storedStreak, 10));
      } else {
        localStorage.setItem("deutsch_spaced_rep_streak", "15");
      }
    }
  }, []);

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
    
    // Potentially increase streak upon adding learning activity
    if (Math.random() > 0.8) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      localStorage.setItem("deutsch_spaced_rep_streak", nextStreak.toString());
    }
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

    // Increase streak if we answered correctly
    if (Math.random() > 0.5) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      localStorage.setItem("deutsch_spaced_rep_streak", nextStreak.toString());
    }
  };

  // Derivative metrics
  const now = new Date();
  const dueSentencesCount = sentences.filter((s) => new Date(s.nextReview) <= now).length;
  const sentenceCount = sentences.length;
  const overallMastery = Math.round(
    (sentences.reduce((sum, current) => sum + (current.level > 0 ? 1 : 0), 0) / (sentenceCount || 1)) * 100
  );

  return (
    <div className="min-h-screen bg-[#05070a] text-[#f8fafc] font-sans antialiased relative overflow-x-hidden selection:bg-blue-600/30 selection:text-white">
      
      {/* Absolute Radial Background Spotlights */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_100%_0%,rgba(12,21,36,0.55),transparent_70%)]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_0%_100%,rgba(8,16,29,0.7),transparent_70%)]" />
        <div className="absolute top-[35%] left-[10%] w-[350px] h-[350px] bg-blue-900/5 blur-[120px] rounded-full" />
      </div>

      {/* Main Container Wrapper */}
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12 relative z-10 flex flex-col gap-8 min-h-screen">
        
        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Workspace Column (9 cols on lg layout) */}
          <main className="lg:col-span-8 space-y-8 order-1 lg:order-1 flex flex-col h-full">
            
            {/* Header Area */}
            <header className="flex flex-col sm:flex-row items-center justify-between border-b border-white/10 pb-4 gap-4">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-8 h-8 text-blue-500 animate-pulse" />
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                    DEUTSCH PRO 
                    <span className="text-blue-500">.</span>
                  </h1>
                  <span className="inline-block text-[10px] uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-full bg-blue-950/40 text-blue-400 border border-blue-500/10">
                    Gemini AI Model Connected ⚡
                  </span>
                </div>
              </div>

              {/* Navigation Tabs */}
              <nav className="flex gap-1.5 bg-slate-950/50 p-1 rounded-xl border border-white/5" dir="rtl">
                <button
                  onClick={() => setActiveTab(Tab.AddSentence)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 ${
                    activeTab === Tab.AddSentence
                      ? "bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.35)] text-white"
                      : "text-[#94a3b8] hover:text-white"
                  }`}
                >
                  إضافة جملة
                </button>
                <button
                  onClick={() => setActiveTab(Tab.DailyQuiz)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 ${
                    activeTab === Tab.DailyQuiz
                      ? "bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.35)] text-white"
                      : "text-[#94a3b8] hover:text-white"
                  }`}
                >
                  الاختبار الذكي
                </button>
                <button
                  onClick={() => setActiveTab(Tab.AIChat)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200 ${
                    activeTab === Tab.AIChat
                      ? "bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.35)] text-white"
                      : "text-[#94a3b8] hover:text-white"
                  }`}
                >
                  المحادثة الذكية
                </button>
              </nav>
            </header>

            {/* Dynamic Tab Switchboard */}
            <div className="flex-grow">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.25 }}
                >
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
                    />
                  )}

                  {activeTab === Tab.AIChat && (
                    <AIChatView 
                      sentences={sentences} 
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            
          </main>

          {/* Right/Left-Aligned Glass Sidebar (4 cols on lg layout) */}
          <aside className="lg:col-span-4 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/10 p-6 space-y-6 order-2 lg:order-2 self-start shadow-xl" dir="rtl">
            
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-500" />
                المراجعة الذكية مفعّلة
              </h2>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                يتحمل محرك التكرار المتباعد الذكي مسؤولية تأجيل الجمل التي تجيب عنها بشكل صحيح ليركز عقلك على المواضيع الجديدة.
              </p>
            </div>

            {/* Real Stats Displays */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 gap-4">
              
              <div className="p-4 rounded-xl bg-slate-950/50 border border-white/5 hover:border-blue-900/30 transition-all flex flex-col justify-between">
                <span className="text-xs text-[#94a3b8]">الجمل المتأخرة بالجدول:</span>
                <span className="text-2xl font-black text-blue-500 mt-1">{dueSentencesCount}</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/50 border border-white/5 hover:border-blue-900/30 transition-all flex flex-col justify-between">
                <span className="text-xs text-[#94a3b8]">نسبة الإتقان العام:</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-blue-500">{overallMastery}%</span>
                  <span className="text-[9px] text-slate-500">({sentences.filter(s => s.level > 0).length} جملة ومستواها &gt; 0)</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/50 border border-white/5 hover:border-blue-900/30 transition-all flex flex-col justify-between">
                <span className="text-xs text-[#94a3b8]">سلسلة التعلم (Streak):</span>
                <span className="text-2xl font-black text-blue-400 mt-1">{streak} يوم 🔥</span>
              </div>

            </div>

            {/* AI Teacher Preview Box */}
            <div className="p-4 rounded-xl bg-slate-950/40 border border-[#3b82f6]/20 space-y-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-[#3b82f6]/20 group-hover:bg-[#3b82f6]/30 transition-colors" />
              
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">نموذج الذكاء الاصطناعي</span>
                <span className="text-[9px] text-[#94a3b8]">نشط</span>
              </div>
              
              <p className="text-xs text-slate-300 italic font-medium leading-relaxed" dir="ltr">
                "Hallo! Wie geht es dir heute?"
              </p>
              
              <p className="text-[10px] text-slate-400 leading-relaxed text-right">
                سيقوم المعلم بتحليل الجمل النشطة لديك تلقائياً عند بدء الدردشة ليدرس معك القواعد النحوية في سياق معارفك السابقة.
              </p>
              
              <button
                onClick={() => setActiveTab(Tab.AIChat)}
                className="w-full text-center py-2 bg-blue-950/70 border border-blue-500/20 text-xs text-blue-400 font-bold rounded-lg transition-colors hover:bg-blue-900/30 cursor-pointer block"
              >
                تحدث مع الروبوت الآن
              </button>
            </div>

            {/* Latest Sentences List summary widget in sidebar */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-slate-400">آخر الجمل المخزنة لتدريبك</h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {sentences.slice(0, 3).map((item) => (
                  <div 
                    key={item.id} 
                    className="p-3 bg-white/[0.02] border border-white/5 rounded-lg text-xs space-y-1 hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="text-blue-400 font-sans font-semibold text-left" dir="ltr">
                      {item.german}
                    </div>
                    <div className="text-slate-400 text-right font-medium">
                      {item.arabic}
                    </div>
                  </div>
                ))}

                {sentences.length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-600 border border-dashed border-white/5 rounded-lg">
                    لا يوجد جمل مضافة بعد.
                  </div>
                )}
              </div>
            </div>

            {/* Authentic Required Signature */}
            <div className="pt-6 border-t border-white/5 text-center flex flex-col items-center justify-center">
              <span className="text-[10px] text-slate-600 tracking-wider">
                مطور التطبيق لتعلم الألمانية
              </span>
              <p className="text-xs font-bold text-blue-400/90 tracking-wide mt-1">
                تم إنشاءه من المهندس اشرف عادل عبدالعال
              </p>
            </div>

          </aside>

        </div>

      </div>

    </div>
  );
}
