import React, { useState } from "react";
import { GraduationCap, User, Mail, Lock, Calendar, Sparkles, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AuthViewProps {
  onLoginSuccess: (userData: any) => void;
  onSignupSuccess: (userData: any) => void;
}

export default function AuthView({ onLoginSuccess, onSignupSuccess }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [targetLevel, setTargetLevel] = useState("A1");
  
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    // Validation
    if (!email.trim() || !password.trim()) {
      setErrorMsg("برجاء إدخال البريد الإلكتروني وكلمة المرور.");
      setLoading(false);
      return;
    }

    if (!isLogin) {
      if (!name.trim()) {
        setErrorMsg("برجاء إدخال اسمك الكريم لإتمام التسجيل.");
        setLoading(false);
        return;
      }
      if (age === "" || isNaN(Number(age))) {
        setErrorMsg("برجاء تحديد عمرك المناسب.");
        setLoading(false);
        return;
      }
      const ageNum = Number(age);
      if (ageNum < 6 || ageNum > 120) {
        setErrorMsg("برجاء إدخال عمر صحيح بين 6 و 120 سنة.");
        setLoading(false);
        return;
      }
    }

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";
      const payload = isLogin 
        ? { email: email.trim(), password }
        : { name: name.trim(), email: email.trim(), password, age: Number(age), targetLevel };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "فشلت عملية التحقق، يرجى مراجعة البيانات.");
      }

      setSuccessMsg(isLogin ? "تم تسجيل الدخول بنجاح! جاري تحميل ملفك الشخصي..." : "تم إنشاء حسابك بنجاح! مرحباً بك في عائلتنا اللغوية 🎉");
      
      setTimeout(() => {
        if (isLogin) {
          onLoginSuccess(data.user);
        } else {
          onSignupSuccess(data.user);
        }
      }, 1000);

    } catch (err: any) {
      setErrorMsg(err.message || "حدث خطأ غير متوقع بالاتصال، يرجى المحاولة لاحقاً.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#040608] text-white flex items-center justify-center p-4 selection:bg-blue-600/30 font-sans relative" dir="rtl">
      
      {/* Ambient background accent rings */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[radial-gradient(circle_at_100%_0%,rgba(37,99,235,0.18),transparent_70%)]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-[radial-gradient(circle_at_0%_100%,rgba(34,211,238,0.15),transparent_70%)]" />
        <div className="absolute top-[40%] left-10 w-[300px] h-[300px] bg-blue-900/5 blur-[100px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl p-8 rounded-3xl border bg-slate-950/95 border-slate-900 shadow-[0_32px_80px_rgba(0,0,0,0.9)] relative z-10 space-y-6"
      >
        {/* Dynamic Glowing border strip */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-l from-blue-600 via-cyan-400 to-transparent rounded-t-3xl" />

        <div className="text-center space-y-3">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center border border-blue-400/20 shadow-[0_4px_24px_rgba(59,130,246,0.4)]">
            <GraduationCap className="w-10 h-10 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-1.5">
              <span>DEUTSCH PRO</span>
              <span className="text-blue-500">🇩🇪</span>
            </h1>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed max-w-sm mx-auto">
              بوابتك الذكية لتعلم وجدولة الجمل الألمانية بالتكرار المتباعد، مع تدريب النطق الصوتي التفاعلي والمحادثة المدعومة بالذكاء الاصطناعي.
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-slate-800/80 w-full">
          <button
            onClick={() => { setIsLogin(true); setErrorMsg(""); setSuccessMsg(""); }}
            className={`flex-1 py-3 text-center text-xs font-black rounded-xl transition-all cursor-pointer ${
              isLogin 
                ? "bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)]" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            تسجيل الدخول 🔑
          </button>
          <button
            onClick={() => { setIsLogin(false); setErrorMsg(""); setSuccessMsg(""); }}
            className={`flex-1 py-3 text-center text-xs font-black rounded-xl transition-all cursor-pointer ${
              !isLogin 
                ? "bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)]" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            إنشاء حساب جديد ✨
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-350">
              البريد الإلكتروني:
            </label>
            <div className="relative">
              <Mail className="absolute right-3.5 top-3.5 w-4.5 h-4.5 text-slate-500" />
              <input
                type="email"
                required
                placeholder="example@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pr-11 pl-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm placeholder:text-slate-650 transition-colors"
                dir="ltr"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-350">
              كلمة المرور:
            </label>
            <div className="relative">
              <Lock className="absolute right-3.5 top-3.5 w-4.5 h-4.5 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pr-11 pl-12 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm placeholder:text-slate-650 transition-colors"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-3 p-1 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Registration fields */}
          <AnimatePresence>
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                {/* Full Name */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-bold text-slate-350">
                    الاسم بالكامل:
                  </label>
                  <div className="relative">
                    <User className="absolute right-3.5 top-3.5 w-4.5 h-4.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="أدخل اسمك الكريم الكامل"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pr-11 pl-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm placeholder:text-slate-600 transition-colors"
                    />
                  </div>
                </div>

                {/* Grid of Age & Target Level */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-350">
                      العمر (سنوات):
                    </label>
                    <div className="relative">
                      <Calendar className="absolute right-3 h-4.5 w-4.5 top-3.5 text-slate-500" />
                      <input
                        type="number"
                        placeholder="العمر مثلاً: 25"
                        value={age === "" ? "" : age}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            setAge("");
                          } else {
                            setAge(parseInt(val) || "");
                          }
                        }}
                        className="w-full pr-10 pl-3 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm transition-colors text-center font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-350">
                      مستوى الاستهداف:
                    </label>
                    <select
                      value={targetLevel}
                      onChange={(e) => setTargetLevel(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm transition-colors text-center font-bold font-sans cursor-pointer h-[46px]"
                    >
                      <option value="A1">A1 - مبتدئ تماماً</option>
                      <option value="A2">A2 - أساسيات بسيطة</option>
                      <option value="B1">B1 - متوسط الحوار</option>
                      <option value="B2">B2 - متقدم ومحترف</option>
                      <option value="C1">C1 - طليق بامتياز</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feedback alerts */}
          {errorMsg && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-rose-450 text-xs font-bold bg-red-950/20 border border-red-900/40 p-3 rounded-xl flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-emerald-400 text-xs font-bold bg-emerald-950/20 border border-emerald-900/40 p-3 rounded-xl flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-550 hover:to-cyan-455 text-white font-black rounded-xl transition-all shadow-[0_4px_20px_rgba(59,130,246,0.35)] hover:shadow-[0_4px_30px_rgba(34,211,238,0.5)] flex items-center justify-center gap-2 cursor-pointer text-xs disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
            ) : isLogin ? (
              <span>تسجيل الدخول الآمن 🚀</span>
            ) : (
              <span>إنشاء الحساب وبدء التعلم 🚀</span>
            )}
          </button>

        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={handleToggleMode}
            className="text-xs text-blue-500 hover:text-blue-450 font-bold underline transition-colors cursor-pointer"
          >
            {isLogin ? "أو يمكنك إنشاء حساب لغوي جديد من هنا" : "لديك حساب بالفعل؟ سجل دخولك مباشرة"}
          </button>
        </div>

        {/* Feature quick showcase */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-900/40 text-center text-slate-500">
          <div className="p-2 bg-slate-950/40 border border-slate-900 rounded-xl space-y-1">
            <span className="text-lg block">🎙️</span>
            <span className="text-[9px] text-slate-500 font-bold block">التحدث الفوري بـ AI</span>
          </div>
          <div className="p-2 bg-slate-950/40 border border-slate-900 rounded-xl space-y-1">
            <span className="text-lg block">✨</span>
            <span className="text-[9px] text-slate-500 font-bold block">معلم ذكي دائم</span>
          </div>
          <div className="p-2 bg-slate-950/40 border border-slate-900 rounded-xl space-y-1">
            <span className="text-lg block">👑</span>
            <span className="text-[9px] text-slate-500 font-bold block">عضوية ذهبية ممتازة</span>
          </div>
        </div>

        {/* Footer Credit */}
        <div className="text-center text-[10px] text-slate-600 border-t border-slate-900 pt-3">
          تم كتابته وتطويره بواسطة المهندس اشرف عادل عبدالعال
        </div>

      </motion.div>
    </div>
  );
}
