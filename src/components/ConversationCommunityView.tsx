import React, { useState, useEffect, useRef } from "react";
import { ChatMessage, Sentence } from "../types";
import { 
  MessageSquare, Users, Send, Volume2, HelpCircle, Check, Play, Square,
  Shield, VolumeX, Hand, Copy, Trash2, Mic, Settings, X, PlusCircle, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ConversationCommunityViewProps {
  userProfile: { name: string; email?: string; xp: number; isPremium?: boolean };
  onAwardXp: (amount: number, type: string) => void;
  customApiKey?: string;
  sentences?: Sentence[];
  initialRoomIdFromUrl?: string | null;
}

interface RoomParticipant {
  id: string;
  name: string;
  isHost: boolean;
  isMuted: boolean;
  isHandRaised: boolean;
  connected: boolean;
}

interface VoiceRoom {
  id: string;
  name: string;
  level: string;
  hostEmail: string;
  hostName: string;
  participants: RoomParticipant[];
  createdAt: string;
}

export default function ConversationCommunityView({ 
  userProfile, 
  onAwardXp, 
  customApiKey,
  sentences = [],
  initialRoomIdFromUrl = null
}: ConversationCommunityViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"ai_tutor" | "community">("ai_tutor");
  
  // AI Tutor States
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [apiErrorMessage, setApiErrorMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Audio elements for read aloud
  const [currentlyPlayingMsgIndex, setCurrentlyPlayingMsgIndex] = useState<number | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  // Community States
  const [rooms, setRooms] = useState<VoiceRoom[]>([]);
  const [activeJoinedRoom, setActiveJoinedRoom] = useState<VoiceRoom | null>(null);
  
  // Create Room fields
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomLevel, setNewRoomLevel] = useState("A1");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Join States
  const [isUserMuted, setIsUserMuted] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [copiedRoomId, setCopiedRoomId] = useState("");

  const pollIntervalRef = useRef<any>(null);

  // Initial load: restore AI chat history and load rooms
  useEffect(() => {
    const cached = localStorage.getItem("deutsch_spaced_rep_chat_history_v3");
    if (cached) {
      try {
        setMessages(JSON.parse(cached));
      } catch (e) {
        console.error("Failed to parse cached chat history", e);
      }
    } else {
      // Trigger initial welcoming setup
      triggerInitialAIWelcome();
    }

    fetchRooms();
    
    // Auto refresh rooms list every 5 seconds to keep participant count synced on main directory
    pollIntervalRef.current = setInterval(() => {
      fetchRooms();
    }, 5000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (ttsAudioRef.current) ttsAudioRef.current.pause();
    };
  }, []);

  // Handle auto-joining room from link or query params
  useEffect(() => {
    if (initialRoomIdFromUrl && rooms.length > 0) {
      const found = rooms.find(r => r.id === initialRoomIdFromUrl);
      if (found && (!activeJoinedRoom || activeJoinedRoom.id !== initialRoomIdFromUrl)) {
        setActiveSubTab("community");
        joinVoiceRoom(found.id);
      }
    }
  }, [initialRoomIdFromUrl, rooms]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiTyping]);

  const triggerInitialAIWelcome = async () => {
    setIsAiTyping(true);
    setApiErrorMessage("");
    try {
      const storedKey = localStorage.getItem("deutsch_spaced_rep_api_key_override") || "";
      const apiToSend = storedKey || customApiKey || "";

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [],
          sentences: sentences,
          customApiKey: apiToSend,
          email: userProfile.email
        })
      });

      if (!response.ok) {
        let errMsg = "فشلت استجابة خادم المعلم الذكي.";
        try {
          const errData = await response.json();
          if (errData?.error) errMsg += ` (تفاصيل الخطأ: ${errData.error})`;
        } catch (_) {}
        throw new Error(errMsg);
      }
      const data = await response.json();
      
      const welcomeMsg: ChatMessage = {
        role: "model",
        content: data.response || "Hallo! Ich bin dein Deutschlehrer. Wie geht es dir heute? Lass uns auf Deutsch chatten!",
        translation: data.translation || "مرحباً! أنا معلمك للألمانية. كيف حالك اليوم؟ دعنا ندردش بالألمانية!",
        correction: data.correction || "تنبيه: يمكنك كتابة أي جملة ألمانية وسأقوم بفحص قواعدها فوراً وإرشادك للأفضل."
      };

      setMessages([welcomeMsg]);
      localStorage.setItem("deutsch_spaced_rep_chat_history_v3", JSON.stringify([welcomeMsg]));
    } catch (e: any) {
      setApiErrorMessage(e.message || "فشل الاتصال بالمعلم الذكي الذكاء الاصطناعي.");
    } finally {
      setIsAiTyping(false);
    }
  };

  const clearChatHistory = () => {
    if (window.confirm("هل أنت متأكد من رغبتك في حذف وحذف كامل محفوظات الدردشة مع المعلم الذكي؟")) {
      localStorage.removeItem("deutsch_spaced_rep_chat_history_v3");
      triggerInitialAIWelcome();
    }
  };

  // Send a text message to the AI Tutor
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isAiTyping) return;

    const userMessageText = userInput.trim();
    setUserInput("");
    setApiErrorMessage("");

    const newUserMessage: ChatMessage = {
      role: "user",
      content: userMessageText
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setIsAiTyping(true);

    try {
      const storedKey = localStorage.getItem("deutsch_spaced_rep_api_key_override") || "";
      const apiToSend = storedKey || customApiKey || "";

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          sentences: sentences,
          customApiKey: apiToSend,
          email: userProfile.email
        })
      });

      if (!response.ok) {
        let errMsg = "الرجاء فحص اتصال الإنترنت ومفتاح Gemini.";
        try {
          const errData = await response.json();
          if (errData?.error) errMsg += ` (تفاصيل الخطأ: ${errData.error})`;
        } catch (_) {}
        throw new Error(errMsg);
      }
      const data = await response.json();

      const aiReply: ChatMessage = {
        role: "model",
        content: data.response || "Ich verstehe. Erzähl mir mehr darüber!",
        translation: data.translation,
        correction: data.correction
      };

      const finalMessages = [...updatedMessages, aiReply];
      setMessages(finalMessages);
      localStorage.setItem("deutsch_spaced_rep_chat_history_v3", JSON.stringify(finalMessages));
      
      // Award XP for completing chat turns
      onAwardXp(8, "chat_turns");
    } catch (err: any) {
      console.error(err);
      setApiErrorMessage(err.message || "فشلت معالجة الرد من خادم الذكاء الاصطناعي.");
    } finally {
      setIsAiTyping(false);
    }
  };

  // Play audio readout
  const speakMessageText = (text: string, index: number) => {
    if (currentlyPlayingMsgIndex === index) {
      ttsAudioRef.current?.pause();
      setCurrentlyPlayingMsgIndex(null);
      return;
    }

    try {
      setCurrentlyPlayingMsgIndex(index);
      const url = `/api/tts?q=${encodeURIComponent(text)}&tl=de`;
      
      if (ttsAudioRef.current) {
        ttsAudioRef.current.src = url;
      } else {
        ttsAudioRef.current = new Audio(url);
      }

      ttsAudioRef.current.onended = () => {
        setCurrentlyPlayingMsgIndex(null);
      };
      ttsAudioRef.current.onerror = () => {
        setCurrentlyPlayingMsgIndex(null);
        setApiErrorMessage("عذراً، تعذر النطق الصوتي للجملة.");
      };

      ttsAudioRef.current.play();
    } catch (e) {
      console.error(e);
      setCurrentlyPlayingMsgIndex(null);
    }
  };

  // Evaluate Overall user chat performance
  const evaluateUserFluency = () => {
    const userWordsCount = messages
      .filter(m => m.role === "user")
      .map(m => m.content.split(/\s+/).length)
      .reduce((sum, len) => sum + len, 0);

    if (userWordsCount === 0) return "مبتدئ - بانتظار كتابة أولى رسائلك اللغوية";
    if (userWordsCount < 15) return "تأسيسي A1 - تبني الخطى الأولى في المحادثة";
    if (userWordsCount < 40) return "تأسيسي متطور A2 - تستمع وتجيب بشكل رائع";
    if (userWordsCount < 90) return "متوسط B1 - رائع جداً، صياغة واثقة وكلمات مركبة";
    return "طلاقة B2/C1 - تمتلك معجم هائل وصياغة ألمانية سليمة وممتازة!";
  };

  // COMMUNITY NETWORK FUNCTIONS
  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/community/rooms");
      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms || []);
        
        // Also update joined room details if currently inside one
        if (activeJoinedRoom) {
          const fresh = data.rooms.find((r: any) => r.id === activeJoinedRoom.id);
          if (fresh) {
            setActiveJoinedRoom(fresh);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch community rooms", err);
    }
  };

  const createVoiceRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    try {
      const response = await fetch("/api/community/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoomName.trim(),
          level: newRoomLevel,
          hostName: userProfile.name || "متعلم ألماني",
          hostEmail: userProfile.email || "anonymous"
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRooms([...rooms, data.room]);
        setNewRoomName("");
        setShowCreateModal(false);
        // Automatically join this newly created room
        joinVoiceRoom(data.room.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const joinVoiceRoom = async (roomId: string) => {
    try {
      const response = await fetch(`/api/community/rooms/${roomId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: userProfile.email || "anon-uid",
          participantName: userProfile.name || "مستكشف دويتش",
          isHost: rooms.find(r => r.id === roomId)?.hostEmail === userProfile.email
        })
      });

      if (response.ok) {
        const data = await response.json();
        setActiveJoinedRoom(data.room);
        setIsUserMuted(false);
        setIsHandRaised(false);
        
        // Add Simulated Learner participants to keep rooms vibrant and fun!
        simulateClassmatesActivity(data.room.id, data.room.level);
        onAwardXp(12, "speaking_sentences"); // XP for connecting to community
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Simulate active peer users joining and interacting 
  const simulateClassmatesActivity = (roomId: string, level: string) => {
    const classmates = [
      { name: "Lukas 🇩🇪", delay: 1000 },
      { name: "Sofie 🇦🇹", delay: 3500 },
      { name: "Amine 🇲🇦", delay: 6000 }
    ];

    classmates.forEach(async (cm) => {
      setTimeout(async () => {
        try {
          await fetch(`/api/community/rooms/${roomId}/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              participantId: `sim-${cm.name.replace(/\s+/g, "")}`,
              participantName: cm.name,
              isHost: false
            })
          });
          fetchRooms();
        } catch (e) {
          console.error(e);
        }
      }, cm.delay);
    });
  };

  const updateMyVoiceRoomState = async (muted: boolean, raisedHand: boolean) => {
    if (!activeJoinedRoom) return;
    try {
      const response = await fetch(`/api/community/rooms/${activeJoinedRoom.id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: userProfile.email || "anon-uid",
          isMuted: muted,
          isHandRaised: raisedHand
        })
      });

      if (response.ok) {
        const data = await response.json();
        setActiveJoinedRoom(data.room);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleMute = () => {
    const nextMute = !isUserMuted;
    setIsUserMuted(nextMute);
    updateMyVoiceRoomState(nextMute, isHandRaised);
  };

  const toggleRaiseHand = () => {
    const nextHand = !isHandRaised;
    setIsHandRaised(nextHand);
    updateMyVoiceRoomState(isUserMuted, nextHand);
  };

  const leaveVoiceRoom = async () => {
    if (!activeJoinedRoom) return;
    try {
      await fetch(`/api/community/rooms/${activeJoinedRoom.id}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: userProfile.email || "anon-uid" })
      });
      setActiveJoinedRoom(null);
      setIsUserMuted(false);
      setIsHandRaised(false);
      fetchRooms();
    } catch (err) {
      console.error(err);
    }
  };

  // Host Action: Kick target user
  const hostKickUser = async (targetId: string) => {
    if (!activeJoinedRoom) return;
    try {
      const response = await fetch(`/api/community/rooms/${activeJoinedRoom.id}/kick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetParticipantId: targetId })
      });

      if (response.ok) {
        const data = await response.json();
        setActiveJoinedRoom(data.room);
        fetchRooms();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Host Action: Mute target user
  const hostMuteUser = async (targetId: string, currentMuteState: boolean) => {
    if (!activeJoinedRoom) return;
    try {
      const response = await fetch(`/api/community/rooms/${activeJoinedRoom.id}/mute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          targetParticipantId: targetId,
          muteState: !currentMuteState 
        })
      });

      if (response.ok) {
        const data = await response.json();
        setActiveJoinedRoom(data.room);
        fetchRooms();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyRoomInviteLink = (roomId: string) => {
    const inviteLink = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedRoomId(roomId);
    setTimeout(() => setCopiedRoomId(""), 2500);
  };

  const isCurrentHost = activeJoinedRoom?.hostEmail === userProfile.email;

  return (
    <div id="conv-comm-wrapper" className="space-y-6 max-w-4xl mx-auto px-4 py-2 text-right dir-rtl">
      {/* Sub tabs header selector */}
      <div className="flex bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <button
          onClick={() => setActiveSubTab("ai_tutor")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === "ai_tutor"
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-purple-500/10"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <MessageSquare className="w-4 h-4 shrink-0" />
          <span>محادثة المعلم الذكي AI</span>
        </button>

        <button
          onClick={() => setActiveSubTab("community")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === "community"
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-purple-500/10"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>المجتمع اللغوي الصوتي</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* AI TUTOR SYSTEM */}
        {activeSubTab === "ai_tutor" && (
          <motion.div
            key="ai_tutor_screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-4 gap-6"
          >
            {/* Left stats bar */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 backdrop-blur-lg space-y-4">
                <span className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 block uppercase">
                  تطوير المهارات الحوارية
                </span>
                
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block">تقييم طلاقة العبارات الحالية:</span>
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-850">
                    <span className="text-xs font-bold text-white block leading-relaxed">{evaluateUserFluency()}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block">ميزة تصحيح الأخطاء التلقائي:</span>
                  <p className="text-[10px] text-slate-400 leading-normal font-sans">
                    المعلم سيفحص كل رسالة ترسلها باللغة الألمانية لتحديد الأخطاء النحوية والإملائية وبناء الجمل وترشيح ردود متقدمة.
                  </p>
                </div>

                <button
                  onClick={clearChatHistory}
                  className="w-full flex items-center justify-center gap-1.5 py-2 hover:bg-red-950/20 text-rose-300 hover:text-rose-100 border border-slate-850 rounded-xl text-[10px] font-bold cursor-pointer transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  حذف محفوظات المحادثة
                </button>
              </div>
            </div>

            {/* Main Chat System */}
            <div className="lg:col-span-3 bg-slate-900/40 border border-slate-800 rounded-3xl backdrop-blur-xl flex flex-col h-[550px] overflow-hidden">
              {/* Chat header info */}
              <div className="p-4 border-b border-slate-850 flex items-center justify-between bg-slate-950/50">
                <div className="flex items-center gap-2.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-black text-white">المعلم الألماني الذكي</span>
                  <span className="text-[8px] bg-purple-950/40 text-purple-300 border border-purple-900/40 px-2 py-0.5 rounded font-black">AI TUTOR</span>
                </div>
                <span className="text-[9px] text-slate-500 font-bold">اللغة المعتمدة للتخاطب: الألمانية فقط 🇩🇪</span>
              </div>

              {/* Message scroll container */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-left">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col max-w-[85%] ${
                      msg.role === "user" ? "ml-auto text-right" : "mr-auto text-left"
                    }`}
                  >
                    {/* Message Bubble Card */}
                    <div className={`p-4 rounded-2xl relative group ${
                      msg.role === "user"
                        ? "bg-purple-600/20 text-white border border-purple-500/20 rounded-tr-none"
                        : "bg-slate-950 text-slate-100 border border-slate-850 rounded-tl-none font-sans"
                    }`}>
                      {/* Read aloud trigger */}
                      {msg.role === "model" && (
                        <button
                          onClick={() => speakMessageText(msg.content, idx)}
                          className={`absolute top-2.5 right-2 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-[8px] font-bold cursor-pointer ${
                            currentlyPlayingMsgIndex === idx ? "text-purple-400 border-purple-600 animate-pulse" : ""
                          }`}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <p className="text-xs font-bold leading-relaxed tracking-wide select-text mt-2 pr-7">
                        {msg.content}
                      </p>

                      {/* Display Arabic Translation for model as option */}
                      {msg.role === "model" && msg.translation && (
                        <div className="mt-2 pt-2 border-t border-slate-900 text-right dir-rtl">
                          <span className="text-[8px] text-slate-500 block font-bold mb-1">الترجمة العربية:</span>
                          <span className="text-[11px] text-slate-400 font-sans font-bold leading-normal">{msg.translation}</span>
                        </div>
                      )}
                    </div>

                    {/* Correction or Lightbulb suggestion display for the AI system response */}
                    {msg.role === "model" && msg.correction && (
                      <div className="mt-1.5 p-3 rounded-xl bg-purple-950/20 border border-purple-900/30 text-right dir-rtl space-y-1">
                        <div className="flex items-center gap-1 text-[9px] text-amber-400 font-black">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>توجيه ومراجعة إملائية / نحوية:</span>
                        </div>
                        <p className="text-[10px] text-slate-300 font-sans leading-relaxed">{msg.correction}</p>
                      </div>
                    )}
                  </div>
                ))}

                {isAiTyping && (
                  <div className="flex items-center gap-1.5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-850/80 mr-auto max-w-[50%]">
                    <span className="text-[10px] text-slate-400 font-bold font-sans animate-bounce">المعلم الألماني يفكر ويصوغ العبارة...</span>
                  </div>
                )}

                {apiErrorMessage && (
                  <div className="p-3 bg-red-950/10 text-red-300 border border-red-900/50 rounded-xl text-xs text-center font-bold">
                    {apiErrorMessage}
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-850 bg-slate-950/40 flex gap-2">
                <input
                  type="text"
                  dir="ltr"
                  disabled={isAiTyping}
                  value={userInput}
                  onChange={(e) => {
                    setUserInput(e.target.value);
                    setApiErrorMessage("");
                  }}
                  placeholder={isAiTyping ? "انتظر صياغة المعلم..." : "Schreibe auf Deutsch..."}
                  className="flex-grow bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold font-sans text-white focus:outline-none focus:border-purple-600 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isAiTyping || !userInput.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-40 text-white px-4 rounded-xl flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-lg shadow-purple-500/10"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* LANGUAGE VOICE COMMUNITY ROOMS */}
        {activeSubTab === "community" && (
          <motion.div
            key="community_screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* If not inside a room: list directory */}
            {!activeJoinedRoom ? (
              <div className="space-y-6">
                {/* Lobby controller */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-850">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-white block">صالة الغرف الحوارية الدولية 🌍</span>
                    <span className="text-[9px] text-slate-500 font-bold block">تبادل الحديث بالصوت مع متعلمي اللغة الألمانية حول العالم.</span>
                  </div>

                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-purple-500/10"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    إنشاء غرفة مخصصة
                  </button>
                </div>

                {/* Rooms Card Directory GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rooms.map((room) => {
                    const attendeesCount = room.participants ? room.participants.filter(p => p.connected).length : 0;
                    return (
                      <div
                        key={room.id}
                        className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between gap-4 hover:border-slate-700 transition-all hover:translate-y-[-2px]"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] bg-purple-950 text-purple-400 font-extrabold px-2 py-0.5 rounded-full border border-purple-900/50 uppercase">
                              المستوى {room.level}
                            </span>
                            <span className="text-[9px] text-slate-500 font-bold">نشطة الآن ●</span>
                          </div>

                          <h4 className="text-xs font-black text-white leading-normal line-clamp-2">{room.name}</h4>
                          <p className="text-[10px] text-slate-500 font-medium">المشرف: {room.hostName}</p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-850">
                          <span className="text-[10px] font-bold text-slate-400">
                            🟢 الحاضرين حالياً: <span className="text-white font-sans font-black">{attendeesCount}</span>
                          </span>

                          <button
                            onClick={() => joinVoiceRoom(room.id)}
                            className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 text-[10px] font-black rounded-lg transition-all cursor-pointer"
                          >
                            دخول الغرفة الآن
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              // Active room interface screen fully styled
              <div className="rounded-3xl bg-slate-900/40 border border-slate-800/80 p-6 md:p-8 backdrop-blur-xl space-y-6">
                
                {/* Room top action summary */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-850">
                  <div className="space-y-1.5 text-center sm:text-right">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-purple-600/30 text-purple-300 border border-purple-500/30 text-[9px] font-black font-sans uppercase">
                        مستوى النقاش: {activeJoinedRoom.level}
                      </span>
                      <span className="text-[9px] bg-emerald-950/20 text-emerald-400 font-bold px-2 py-0.5 border border-emerald-900/30 rounded">
                        متصل حالياً ●
                      </span>
                    </div>
                    <h3 className="text-base font-black text-white leading-tight">{activeJoinedRoom.name}</h3>
                    <p className="text-[10px] text-slate-500">الغرفة الصوتية الدولية - قم بتشغيل الصوت للبدء بالحديث الفوري.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyRoomInviteLink(activeJoinedRoom.id)}
                      className="px-3 py-2 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white text-[10px] font-bold rounded-xl border border-slate-850 flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedRoomId === activeJoinedRoom.id ? "تم نسخ الرابط! ✓" : "انسخ رابط الدعوة"}</span>
                    </button>

                    <button
                      onClick={leaveVoiceRoom}
                      className="px-4 py-2 hover:bg-rose-950/25 border border-slate-800 text-rose-300 hover:text-red-200 text-[10px] font-bold rounded-xl transition-all cursor-pointer"
                    >
                      مغادرة الغرفة الصوتية
                    </button>
                  </div>
                </div>

                {/* Sub-body directory: Controller + participants list */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  
                  {/* Participant controls right-column */}
                  <div className="lg:col-span-1 space-y-4">
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-4">
                      <span className="text-[10px] text-slate-500 font-extrabold block text-center uppercase border-b border-slate-900 pb-2">
                        لوحة التحكم السريع بالمايك
                      </span>

                      {/* Microphone controllers buttons */}
                      <button
                        onClick={toggleMute}
                        className={`w-full py-3.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                          isUserMuted
                            ? "bg-red-950/20 text-red-300 border-red-900/40"
                            : "bg-emerald-600/20 text-emerald-300 border-emerald-500/20"
                        }`}
                      >
                        {isUserMuted ? (
                          <>
                            <VolumeX className="w-4 h-4 shrink-0" />
                            <span>ميكروفونك صامت حالياً</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4 shrink-0" />
                            <span>ميكروفونك مفعل (يتحدث)</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={toggleRaiseHand}
                        className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                          isHandRaised
                            ? "bg-purple-600 text-white border-purple-500"
                            : "bg-slate-900 text-slate-400 border-slate-850"
                        }`}
                      >
                        <Hand className="w-4 h-4 shrink-0" />
                        <span>{isHandRaised ? "أنزِل يدك (تحدث)" : "ارفع يدك لطلب الكلمة"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Main Participants panel */}
                  <div className="lg:col-span-3 space-y-3">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-black px-1">
                      <span>الأعضاء المتواجدين حالياً في الغرفة:</span>
                      <span>عدد الحاضرين مباشرة للحديث: {activeJoinedRoom.participants ? activeJoinedRoom.participants.length : 0}</span>
                    </div>

                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
                      {activeJoinedRoom.participants && activeJoinedRoom.participants.map((person) => {
                        const isMe = person.id === userProfile.email;
                        return (
                          <div
                            key={person.id}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-4 ${
                              isMe ? "bg-purple-950/10 border-purple-900/30" : "bg-slate-950/80 border-slate-850"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" title="حالة الاتصال: متصل" />
                              <div className="text-right">
                                <span className="text-xs font-black text-white block">
                                  {person.name} {isMe && "(أنت)"}
                                </span>
                                <span className="text-[8px] text-slate-500 block">
                                  {person.isHost ? "♛ منشيء الغرفة/المشرف" : "متعلم مشارك"}
                                </span>
                              </div>
                            </div>

                            {/* Participant states indicators */}
                            <div className="flex items-center gap-2">
                              {person.isHandRaised && (
                                <span className="px-2.5 py-0.5 rounded bg-purple-600 text-white text-[8px] font-black flex items-center gap-0.5 font-sans">
                                  <Hand className="w-2.5 h-2.5" />
                                  يطلب التحدث
                                </span>
                              )}

                              <span className={`px-2 py-1 rounded text-[8px] font-black ${
                                person.isMuted
                                  ? "bg-slate-900 text-slate-500 border border-slate-800"
                                  : "bg-emerald-950/30 text-emerald-400 border border-emerald-900/30"
                              }`}>
                                {person.isMuted ? "🤫 صامت" : "🔊 يتكلم الآن"}
                              </span>

                              {/* Host actions next to participants */}
                              {isCurrentHost && !isMe && (
                                <div className="flex items-center gap-1 border-l border-slate-900 pl-2 ml-2">
                                  <button
                                    onClick={() => hostMuteUser(person.id, person.isMuted)}
                                    className="p-1 hovered bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[9px] text-slate-400 font-bold rounded cursor-pointer transition-colors"
                                    title="كتم الصوت الإجباري"
                                  >
                                    كتم
                                  </button>
                                  <button
                                    onClick={() => hostKickUser(person.id)}
                                    className="p-1 bg-red-950/40 hover:bg-red-900 text-rose-300 font-bold border border-red-900 text-[9px] rounded cursor-pointer transition-colors"
                                    title="طرد المستخدم المخالف"
                                  >
                                    طرد
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {(!activeJoinedRoom.participants || activeJoinedRoom.participants.length === 0) && (
                        <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-900 text-center text-xs text-slate-500">
                          بانتظار انضمام متعلمين آخرين للغرفة الصوتية...
                        </div>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE CUSTOM ROOM MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 text-right dir-rtl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-850">
                <span className="text-xs font-black text-white">إنشاء غرفة صوتية دولية جديدة</span>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={createVoiceRoom} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold block">اسم الغرفة النقاشية:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: التدرب على الحديث بالمقالات اليومية..."
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold block">مستوى اللغة المقترح للمنضمّين:</label>
                  <select
                    value={newRoomLevel}
                    onChange={(e: any) => setNewRoomLevel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2.5 py-2.5 text-xs font-bold text-slate-300 focus:outline-none"
                  >
                    <option value="A1">مبتدئ A1</option>
                    <option value="A2">تأسيسي A2</option>
                    <option value="B1">متوسط B1</option>
                    <option value="B2">فوق متوسط B2</option>
                    <option value="C1">متقدم C1</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl text-xs font-black cursor-pointer transition-all shadow-md shadow-purple-500/10"
                >
                  شغل الغرفة وانضم فوراً
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
