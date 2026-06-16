import React, { useState } from "react";
import { UserProfile } from "../types";
import { User, KeyRound, Mail, BadgeAlert, Sparkles, Send, CheckCircle2, ChevronRight, LogOut, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SettingsViewProps {
  profile: UserProfile;
  onUpdateProfile: (name: string, age: number, targetLevel: string) => Promise<{ success: boolean; error?: string }>;
  onChangePassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  onLogout: () => void;
  onNavigateToPremium: () => void;
}

export default function SettingsView({
  profile,
  onUpdateProfile,
  onChangePassword,
  onLogout,
  onNavigateToPremium,
}: SettingsViewProps) {
  const [activeSection, setActiveSection] = useState<"profile" | "edit" | "password" | "support">("profile");
  
  // Edit Profile States
  const [editName, setEditName] = useState(profile.name);
  const [editAge, setEditAge] = useState<number | "">(profile.age);
  const [editLevel, setEditLevel] = useState(profile.targetLevel || "A1");

  // Change Password States
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Support State
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const handleUpdateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!editName.trim()) {
      setFeedback({ type: "error", msg: "الاسم لا يمكن أن يكون فارغاً!" });
      return;
    }
    const ageNum = Number(editAge);
    if (isNaN(ageNum) || ageNum < 6 || ageNum > 120) {
      setFeedback({ type: "error", msg: "يرجى تحديد عمر صحيح بين 6 و 120." });
      return;
    }

    setLoading(true);
    const res = await onUpdateProfile(editName.trim(), ageNum, editLevel);
    setLoading(false);

    if (res.success) {
      setFeedback({ type: "success", msg: "تم تحديث بيانات الملف الشخصي بنجاح 💾" });
    } else {
      setFeedback({ type: "error", msg: res.error || "حدث خطأ أثناء التحديث." });
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!oldPassword || !newPassword || !confirmPassword) {
      setFeedback({ type: "error", msg: "يرجى تعبئة كافة حقول كلمة المرور." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFeedback({ type: "error", msg: "كلمتا المرور الجديدتان غير متطابقتين!" });
      return;
    }
    if (newPassword.length < 4) {
      setFeedback({ type: "error", msg: "يجب أن لا تقل المرور الجديدة عن 4 أحرف!" });
      return;
    }

    setLoading(true);
    const res = await onChangePassword(oldPassword, newPassword);
    setLoading(false);

    if (res.success) {
      setFeedback({ type: "success", msg: "تم تغيير كلمة المرور بنجاح 🔐" });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setFeedback({ type: "error", msg: res.error || "كلمة المرور القديمة غير صحيحة!" });
    }
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!supportSubject || !supportMessage) {
      setFeedback({ type: "error", msg: "يرجى ملء موضوع الرسالة ونصها للتواصل." });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setFeedback({ type: "success", msg: "شكرًا لك يا بطل! تم إرسال رسالتك مباشرة لفريق الدعم، وسيتواصل معك الكوتش أشرف عادل قريباً ✉" });
      setSupportSubject("");
      setSupportMessage("");
    }, 800);
  };

  return (
    <div className="space-y-8 font-sans" dir="rtl">
      
      {/* Header Info */}
      <div className="bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-900 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center md:text-right">
          <div className="inline-flex items-center justify-center gap-1.5 text-blue-500 font-extrabold text-xs uppercase tracking-wider bg-blue-950/40 px-3 py-1 rounded-full border border-blue-900/30">
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>لوحة الإعدادات والتحكم بالملف الذاتي</span>
          </div>
          <h2 className="text-xl font-black text-white">إعدادات ملفك اللغوي ⚙️</h2>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            مرحباً بك في صفحة التهيئة الشخصية. هنا يمكنك تبديل بياناتك، تحديث كلمة المرور، مراجعة اشتراكك الممتاز والتواصل مع دعم المطور.
          </p>
        </div>

        <button
          onClick={onLogout}
          className="px-4 py-2.5 bg-red-950/20 hover:bg-rose-950/60 border border-red-900/30 text-rose-300 hover:text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج 🚪</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Navigation Rails - responsive */}
        <div className="lg:col-span-4 bg-slate-950/40 border border-slate-900 rounded-3xl p-4 space-y-2 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-2 lg:gap-0">
          {[
            { id: "profile", label: "الملف الشخصي ✨", desc: "استعراض الإحصائيات" },
            { id: "edit", label: "تعديل البيانات 📝", desc: "الاسم والسن والمستوى" },
            { id: "password", label: "تغيير المرور 🔐", desc: "حماية الحساب الشخصي" },
            { id: "support", label: "التواصل مع الدعم ✉", desc: "مساعدة المطور المباشرة" },
          ].map((sec) => (
            <button
              key={sec.id}
              onClick={() => { setActiveSection(sec.id as any); setFeedback(null); }}
              className={`w-full text-right p-3 rounded-2xl flex items-center justify-between transition-all cursor-pointer whitespace-nowrap lg:whitespace-normal ${
                activeSection === sec.id
                  ? "bg-blue-600 text-white shadow-[0_4px_15px_rgba(37,99,235,0.25)]"
                  : "hover:bg-slate-900/50 text-slate-400 hover:text-white"
              }`}
            >
              <div>
                <span className="text-xs font-black block">{sec.label}</span>
                <span className={`text-[9px] block ${activeSection === sec.id ? "text-blue-100" : "text-slate-500"}`}>{sec.desc}</span>
              </div>
              <ChevronRight className="w-4 h-4 hidden lg:block opacity-60" />
            </button>
          ))}
        </div>

        {/* Right Active View Box */}
        <div className="lg:col-span-8 bg-slate-950/30 border border-slate-900 rounded-3xl p-6 sm:p-8 space-y-6">
          
          <AnimatePresence mode="wait">
            {activeSection === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="border-b border-slate-900/60 pb-3 flex items-center justify-between">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <User className="w-4.5 h-4.5 text-blue-500" />
                    <span>ملخص الهوية في المنصة</span>
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">ID: {profile.email ? profile.email.substring(0, 4) + "***" : "Guest"}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-900 space-y-1">
                    <span className="text-[10px] text-slate-500 font-black">الاسم المسجل:</span>
                    <span className="text-white font-extrabold text-sm block">{profile.name}</span>
                  </div>

                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-900 space-y-1">
                    <span className="text-[10px] text-slate-500 font-black">البريد الإلكتروني:</span>
                    <span className="text-white font-mono text-sm block">{profile.email || "غير مسجل"}</span>
                  </div>

                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-900 space-y-1">
                    <span className="text-[10px] text-slate-500 font-black">المستوى اللغوي المستهدف:</span>
                    <span className="text-cyan-400 font-black text-sm block">{profile.targetLevel || "A1"}</span>
                  </div>

                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-900 space-y-1">
                    <span className="text-[10px] text-slate-500 font-black">عمر المتعلم:</span>
                    <span className="text-white font-extrabold text-sm block">{profile.age} سنة</span>
                  </div>
                </div>

                {/* Subscription Card */}
                <div className="p-5 rounded-2xl border relative overflow-hidden bg-gradient-to-br from-slate-950 to-slate-900 border-slate-850">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" style={{
                    backgroundColor: profile.isPremium ? "#eab308" : "#2563eb"
                  }} />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-black text-slate-400 tracking-wide block">حالة ترقية الاشتراك:</span>
                      {profile.isPremium ? (
                        <div className="space-y-1">
                          <h4 className="text-sm font-black text-yellow-400 flex items-center gap-1.5">
                            <ShieldCheck className="w-4.5 h-4.5" />
                            <span>عضوية ذهبية نشطة (PRO Premium) ♛</span>
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            خطة الاشتراك النشطة: <span className="text-white font-bold">{profile.premiumPlan || "العضوية السنوية"}</span>
                          </p>
                          {profile.premiumExpiry && (
                            <p className="text-[10px] text-slate-500">
                              تاريخ انتهاء الفاعلية المجدول: <span className="text-emerald-450 font-semibold">{new Date(profile.premiumExpiry).toLocaleDateString("ar-EG")}</span>
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <h4 className="text-sm font-black text-blue-500 flex items-center gap-1.5">
                            <BadgeAlert className="w-4.5 h-4.5" />
                            <span>العضوية الأساسية المجانية (Free)</span>
                          </h4>
                          {profile.premiumStatus === "pending" ? (
                            <p className="text-[11px] text-yellow-500 font-bold bg-yellow-500/5 px-2.5 py-1 rounded border border-yellow-500/10 inline-block">
                              ⏳ لديك طلب تفعيل اشتراك معلق حالياً قيد المراجعة اليدوية من الإدارة. سيتم التفعيل فورا فور المطابقة!
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-500">
                              يمكنك الوصول إلى الأساسيات وإضافة الجمل فقط. قم بالترقية للوصول للمميزات الكاملة والمحادثات اللامحدودة.
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {!profile.isPremium && profile.premiumStatus !== "pending" && (
                      <button
                        onClick={onNavigateToPremium}
                        className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-500 hover:to-amber-400 text-slate-950 font-black rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        ترقية العضوية الآن 👑
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === "edit" && (
              <motion.div
                key="edit"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="border-b border-slate-900/60 pb-3">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <User className="w-4.5 h-4.5 text-blue-500" />
                    <span>تعديل البيانات الأساسية</span>
                  </h3>
                </div>

                <form onSubmit={handleUpdateProfileSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400">الاسم بالكامل:</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 text-xs"
                      value={editName || ""}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-400">العمر (سنوات):</label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 text-xs text-center font-bold"
                        value={editAge === "" ? "" : editAge}
                        onChange={(e) => setEditAge(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-400">مستوى الاستهداف:</label>
                      <select
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 text-xs text-center font-sans h-[43px]"
                        value={editLevel}
                        onChange={(e) => setEditLevel(e.target.value)}
                      >
                        <option value="A1">A1 - مبتدئ</option>
                        <option value="A2">A2 - أساسي</option>
                        <option value="B1">B1 - متوسط</option>
                        <option value="B2">B2 - متقدم</option>
                        <option value="C1">C1 - محترف طليق</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    {loading ? "جاري التحديث..." : "حفظ البيانات المعدلة 💾"}
                  </button>
                </form>
              </motion.div>
            )}

            {activeSection === "password" && (
              <motion.div
                key="password"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="border-b border-slate-900/60 pb-3">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <KeyRound className="w-4.5 h-4.5 text-blue-500" />
                    <span>تغيير كلمة المرور وتأمين حسابك</span>
                  </h3>
                </div>

                <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400">كلمة المرور القديمة:</label>
                    <input
                      type="password"
                      placeholder="أدخل كلمة مرورك الحالية"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 text-xs placeholder:text-slate-600"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400">كلمة المرور الجديدة:</label>
                    <input
                      type="password"
                      placeholder="كلمة المرور الجديدة"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 text-xs placeholder:text-slate-600"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400">تأكيد كلمة المرور الجديدة:</label>
                    <input
                      type="password"
                      placeholder="أعد كتابة المدخل الجديد للتأكيد"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 text-xs placeholder:text-slate-600"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    {loading ? "جاري الحفظ الآمن..." : "تطبيق وتغيير كلمة المرور 🔐"}
                  </button>
                </form>
              </motion.div>
            )}

            {activeSection === "support" && (
              <motion.div
                key="support"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="border-b border-slate-900/60 pb-3">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Mail className="w-4.5 h-4.5 text-blue-500" />
                    <span>التواصل مع الدعم الفني والمطور</span>
                  </h3>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900 text-xs text-slate-400 leading-relaxed space-y-1">
                  <p>
                    أهلاً بك يا صديقي المتعلم. إذا واجهتك أي مشكلة برمجية أو خطأ بالتطبيق، أو أردت التواصل المباشر مع المطوّر ومنشئ البرنامج الكوتش <span className="text-cyan-400 font-bold">اشرف عادل عبدالعال</span>، يمكنك كتابة رسالتك وسنرد على بريدك الإلكتروني في أقرب وقت.
                  </p>
                </div>

                <form onSubmit={handleSupportSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-450">موضوع الرسالة:</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 text-xs"
                      placeholder="مثلاً: مشكلة في ترقية الاشتراك / اقتراح درس جديد"
                      value={supportSubject}
                      onChange={(e) => setSupportSubject(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-450">تفاصيل الرسالة أو المشكلة:</label>
                    <textarea
                      rows={4}
                      className="w-full p-4 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 text-xs leading-relaxed"
                      placeholder="أكتب المشكلة أو الاستفسار بالتفصيل هنا..."
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{loading ? "جاري الإرسال للتطوير..." : "إرسال الرسالة للمطور ✉"}</span>
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toast / Alert Feedback Area */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className={`mt-4 p-3.5 rounded-2xl text-xs font-bold border flex items-center gap-2 ${
                  feedback.type === "success"
                    ? "bg-emerald-950/20 border-emerald-900/50 text-emerald-400"
                    : "bg-red-950/20 border-red-900/50 text-rose-450"
                }`}
              >
                {feedback.type === "success" ? <CheckCircle2 className="w-4.5 h-4.5 shrink-0" /> : <BadgeAlert className="w-4.5 h-4.5 shrink-0" />}
                <p>{feedback.msg}</p>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

    </div>
  );
}
