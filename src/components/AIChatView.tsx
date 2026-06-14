import React, { useState, useEffect, useRef } from "react";
import { Sentence, ChatMessage } from "../types";
import { 
  Send, Sparkles, AlertCircle, RefreshCw, Key, BookOpen, 
  Settings, CheckCircle, BrainCircuit, MessageSquare, Info 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AIChatViewProps {
  sentences: Sentence[];
}

const LOCAL_STORAGE_CHAT_KEY = "deutsch_spaced_rep_chat_history";
const LOCAL_STORAGE_KEY_OVERRIDE = "deutsch_spaced_rep_api_key_override";

export default function AIChatView({ sentences }: AIChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [customApiKey, setCustomApiKey] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(LOCAL_STORAGE_KEY_OVERRIDE) || "";
    }
    return "";
  });
  const [showKeySetting, setShowKeySetting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load chat history on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOCAL_STORAGE_CHAT_KEY);
      if (stored) {
        try {
          setMessages(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse chat history", e);
        }
      }
    }
  }, []);

  // Save chat history when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_CHAT_KEY, JSON.stringify(messages));
    }
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const saveApiKeyOverride = (key: string) => {
    setCustomApiKey(key);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY_OVERRIDE, key);
    }
  };

  const handleStartNewChat = async () => {
    setInitLoading(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [], // Empty conversation represents request for the welcoming starter
          sentences: sentences,
          customApiKey: customApiKey
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "فشل الاتصال بخادم الذكاء الاصطناعي.");
      }

      const data = await response.json();
      if (data.response) {
        const welcomeMessage: ChatMessage = {
          role: "model",
          content: data.response,
          translation: data.translation,
          correction: data.correction
        };
        setMessages([welcomeMessage]);
      } else {
        throw new Error("تنسيق استجابة غير معرف من الذكاء الاصطناعي.");
      }
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error?.message || "حدث خطأ غير متوقع أثناء إطلاق المحادثة.");
    } finally {
      setInitLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const userMessageText = userInput.trim();
    setUserInput("");
    setErrorMessage("");

    const updatedMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: userMessageText }
    ];

    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          sentences: sentences,
          customApiKey: customApiKey
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "فشل إرسال الرسالة إلى المعلم الذكي.");
      }

      const data = await response.json();
      if (data.response) {
        const assistantMessage: ChatMessage = {
          role: "model",
          content: data.response,
          translation: data.translation,
          correction: data.correction
        };
        setMessages([...updatedMessages, assistantMessage]);
      } else {
        throw new Error("تلميح: تأكد من صحة مفتاح Gemini API المدخل.");
      }
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error?.message || "فشلت العملية. تحقق من مفتاح الـ API والاتصال بالإنترنت.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm("هل أنت متأكد من رغبتك في مسح سجل المحادثة بالكامل؟")) {
      setMessages([]);
      localStorage.removeItem(LOCAL_STORAGE_CHAT_KEY);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Settings / API Key Segment */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-blue-950/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-blue-400 shrink-0" />
          <div>
            <span className="text-sm font-bold text-white block">مساعد الذكاء الاصطناعي مبرمج بسياقك</span>
            <span className="text-[11px] text-slate-400">
              يقرأ المعلم الذكي الـ {sentences.length} جمل المخزنة لديك ليستخدمها كمرجع لمستواك اللغوي الحقيقي.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setShowKeySetting(!showKeySetting)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              showKeySetting || customApiKey 
                ? "bg-blue-950/50 border-blue-800 text-blue-300" 
                : "bg-slate-950/80 border-slate-800 text-slate-400 hover:border-blue-900"
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            {customApiKey ? "تغيير كود API يدوي" : "إعداد مفتاح Gemini API (اختياري)"}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showKeySetting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 rounded-2xl bg-slate-950 border border-blue-950/60 space-y-3.5 text-right">
              <h4 className="text-xs font-bold text-blue-300 flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-400" />
                تخصيص مفتاح الـ API لـ Gemini
              </h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                يحتوي التطبيق على مفتاح سحابي مبني تلقائياً على خادم الاستوديو، وهو نشط الآن. ومع ذلك، إذا كنت تود الإفلات من حواجز الاستخدام أو تود استخدام مفتاحك الخاص، يمكنك إدخاله هنا. يتم تشفير المفتاح وحفظه محلياً في متصفحك بشكل آمن تماماً.
              </p>
              
              <div className="flex items-center gap-2 max-w-xl">
                <input
                  type="password"
                  placeholder="أدخل مفتاح Gemini API الخاص بك"
                  value={customApiKey}
                  onChange={(e) => saveApiKeyOverride(e.target.value)}
                  className="flex-grow px-4 py-2 text-xs bg-slate-900 border border-blue-950/80 rounded-lg text-white font-mono placeholder:text-slate-700 focus:outline-none focus:border-blue-500"
                  dir="ltr"
                />
                {customApiKey && (
                  <button
                    onClick={() => saveApiKeyOverride("")}
                    className="px-3 py-2 bg-red-950/30 text-rose-300 border border-rose-900/50 hover:bg-red-900/30 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    إعادة الافتراضي
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>حالة المفتاح: {customApiKey ? "مفتاحك المخصص نشط وبانتظار تواصلك." : "مستضاف تلقائياً على خوادم الاستوديو (مفتاح سحابي افتراضي)."}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <div className="p-6 rounded-2xl border bg-slate-950 border-blue-950 shadow-[0_12px_44px_rgba(0,0,0,0.65)] relative overflow-hidden flex flex-col min-h-[550px]" style={{ maxHeight: "650px" }}>
          
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-blue-700 via-cyan-500 to-transparent" />

          {/* Chat Header controls */}
          <div className="flex items-center justify-between border-b border-blue-950/60 pb-4 mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-bold text-white">دردش وتحدث بالألمانية مع الذكاء الاصطناعي</h3>
            </div>

            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="px-2.5 py-1.5 hover:bg-red-950/40 border border-transparent hover:border-red-900/40 text-slate-400 hover:text-red-400 rounded-lg text-xs transition-all cursor-pointer"
                  title="مسح السجل"
                >
                  مسح السجل
                </button>
              )}
              
              <button
                onClick={handleStartNewChat}
                disabled={initLoading}
                className="px-3 py-2 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-500/20 hover:border-blue-400/40 text-cyan-300 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${initLoading ? "animate-spin" : ""}`} />
                <span>بدء محادثة جديدة بسياق جديد</span>
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-grow overflow-y-auto space-y-4 mb-4 pr-1 scrollbar-thin scrollbar-thumb-blue-950 scrollbar-track-transparent">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center my-auto space-y-4">
                <div className="p-4 bg-slate-900 rounded-2xl border border-blue-950 animate-pulse text-blue-400">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm mb-1">ابدأ التدريب الفعلي الآن!</h4>
                  <p className="text-slate-500 text-xs max-w-sm mx-auto leading-relaxed">
                    انقر فوق زر <b>"بدء محادثة جديدة"</b> بالأعلى وسيقوم الروبوت بقراءة الجمل المحفوظة لديك لينشأ حواراً ترحيبياً خاصاً بمستواك الفعلي من الكلمات والجمل!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, index) => {
                  const isModel = msg.role === "model";
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${isModel ? "justify-start" : "justify-end"} items-start gap-2.5`}
                    >
                      {/* Message Bubble wrapper */}
                      <div className={`max-w-[85%] rounded-2xl p-4 md:p-5 border space-y-2.5 ${
                        isModel 
                          ? "bg-slate-900/80 border-blue-950/80 text-right rounded-tr-none self-start" 
                          : "bg-blue-950/60 border-blue-800/40 text-left rounded-tl-none self-end"
                      }`}>
                        
                        {/* Header Label */}
                        <div className={`text-[10px] font-bold tracking-wider ${isModel ? "text-cyan-400 text-right" : "text-slate-400 text-left"}`}>
                          {isModel ? "المعلم الذكي الألماني" : "أنت (صديق الألمانية)"}
                        </div>

                        {/* German Content of the Message */}
                        <div 
                          className={`font-sans text-base font-medium leading-relaxed tracking-wide select-text ${
                            isModel ? "text-blue-100 text-right" : "text-white text-left"
                          }`}
                          dir="ltr"
                        >
                          {msg.content}
                        </div>

                        {/* Translation drawer for model message */}
                        {isModel && msg.translation && (
                          <div className="pt-2 border-t border-blue-950/60 text-right">
                            <span className="text-[10px] text-slate-500 font-bold block mb-1">الترجمة التقريبية:</span>
                            <p className="text-xs text-slate-300 leading-snug">{msg.translation}</p>
                          </div>
                        )}

                        {/* Dynamic Correction and guidance of current sentence */}
                        {isModel && msg.correction && (
                          <div className="pt-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-900/80 text-right">
                            <span className="text-[10px] text-yellow-500 font-bold block mb-1">💡 مراجعة وتصحيح المعلم:</span>
                            <p className="text-xs text-yellow-200/90 leading-relaxed font-sans">{msg.correction}</p>
                          </div>
                        )}

                      </div>
                    </motion.div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>
            )}

            {/* AI is thinking/loading indicator */}
            {isLoading && (
              <div className="flex justify-start items-center gap-2.5 p-1">
                <div className="bg-slate-900 rounded-2xl p-4 border border-blue-950/80 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-bounce" />
                  <span className="text-[10px] text-slate-400 font-medium mr-1.5 font-sans">معلم الذكاء الاصطناعي يقوم بصياغة المراجعة والتصحيح الآن...</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Alerts inside chat */}
          {errorMessage && (
            <div className="p-3.5 mb-3 rounded-xl bg-red-950/40 border border-red-900/50 flex items-center gap-2 text-xs text-red-300 shrink-0">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Message input elements */}
          <form onSubmit={handleSendMessage} className="mt-auto pt-4 border-t border-blue-950/60 flex items-center gap-3 shrink-0">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={messages.length === 0 || isLoading}
              placeholder={messages.length === 0 ? "يجب بدء المحادثة الجديدة أولاً بالضغط على الزر بالأعلى" : "رد على المعلم هنا باللغة الألمانية..."}
              className="flex-grow px-4 py-3 bg-slate-900 text-white text-sm border border-blue-950/60 rounded-xl focus:outline-none focus:border-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed font-sans"
              dir="ltr"
            />
            
            <button
              type="submit"
              disabled={messages.length === 0 || isLoading || !userInput.trim()}
              className="px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl font-bold transition-all disabled:opacity-45 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer shadow-[0_4px_12px_rgba(59,130,246,0.3)] shrink-0"
              title="إرسال رسالة"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
