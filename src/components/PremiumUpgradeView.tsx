import React, { useState } from "react";
import { UserProfile, PremiumRequest } from "../types";
import { Sparkles, CreditCard, Copy, Check, Upload, HelpCircle, AlertCircle, Calendar, ShieldCheck, Heart } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PremiumUpgradeViewProps {
  profile: UserProfile;
  onSubmitUpgradeRequest: (request: Omit<PremiumRequest, "id" | "userName" | "createdAt" | "status">) => void;
}

export default function PremiumUpgradeView({ profile, onSubmitUpgradeRequest }: PremiumUpgradeViewProps) {
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: string } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"vodafone" | "paypal">("vodafone");
  
  // Inputs
  const [paypalAccount, setPaypalAccount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string>("");
  
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const plans = [
    { id: "1m", name: "الباقة الشهرية (شهر واحد)", durationDays: 30, price: "60 جنيه", desc: "مثالي لتجربة قوة التكرار والتدقيق الذكي" },
    { id: "2m", name: "باقة شهرين (حزمة التأسيس)", durationDays: 60, price: "100 جنيه", desc: "الحل الاقتصادي لتأسيس مخارج الحروف والمفردات" },
    { id: "3m", name: "باقة 3 أشهر (المسار المتقدم)", durationDays: 90, price: "150 جنيه", desc: "الأكثر شيوعاً لضمان الانتقال لمستوى لغوي كامل" },
    { id: "1y", name: "الباقة السنوية (المحترف الطليق)", durationDays: 365, price: "500 جنيه", desc: "امتيازات غير محدودة طوال العام مع تحديثات أسبوعية" },
  ];

  const handleCopyNumber = () => {
    navigator.clipboard.writeText("01019789926");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshotName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setScreenshotName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) {
      setErrorMsg("رجاءً اختر إحدى الباقات أولاً للمتابعة.");
      return;
    }

    if (paymentMethod === "paypal" && !paypalAccount.trim()) {
      setErrorMsg("برجاء إدخال رابط أو بريد حساب PayPal الخاص بك للتحقق.");
      return;
    }

    if (!transactionId.trim() && !screenshot) {
      setErrorMsg("برجاء إدخال رقم العملية (رقم التحويل) أو رفع لقطة الشاشة كإثبات للدفع.");
      return;
    }

    setErrorMsg("");
    setIsSubmitting(true);

    try {
      onSubmitUpgradeRequest({
        planName: selectedPlan.name,
        price: selectedPlan.price,
        paymentMethod,
        paypalAccount: paymentMethod === "paypal" ? paypalAccount.trim() : undefined,
        transactionId: transactionId.trim() || undefined,
        screenshot: screenshot || undefined,
      });

      setSuccessMsg("تم إرسال طلب الترقية للمراجعة بنجاح! سيقوم المشرف بمراجعة طلبك وتفعيل الباقة قريباً.");
      setSelectedPlan(null);
      setPaypalAccount("");
      setTransactionId("");
      setScreenshot(null);
      setScreenshotName("");
    } catch (err) {
      setErrorMsg("حدث خطأ أثناء حفظ الطلب. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 font-sans" dir="rtl">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-yellow-500/10 via-amber-600/5 to-slate-950 p-6 sm:p-8 rounded-3xl border border-yellow-500/20 shadow-lg text-center space-y-4">
        <div className="w-14 h-14 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(234,179,8,0.25)]">
          <Sparkles className="w-8 h-8 text-yellow-500 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white">ترقية إلى العضوية الممتازة PRO 👑</h2>
          <p className="text-xs text-slate-400 max-w-xl mx-auto leading-relaxed">
            استثمر في مستقبلك اللغوي واحصل على كافة مميزات التطبيق الحصرية: محادثات ذكاء اصطناعي غير محدودة، تحليل مخارج النطق الدقيق لجميع الجمل، تخزين لا نهائي في مخزن التكرار المتباعد.
          </p>
        </div>
        
        {/* Current status indicator */}
        <div className="pt-2 max-w-md mx-auto">
          {profile.isPremium ? (
            <div className="bg-emerald-900/20 border border-emerald-500/30 text-emerald-300 rounded-2xl p-4 text-xs font-bold space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-base text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
                <span>حسابك مفعّل بعضوية Pro الذهبية!</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">تاريخ انتهاء الاشتراك: {profile.premiumExpiry ? new Date(profile.premiumExpiry).toLocaleDateString("ar-EG") : "غير محدد"}</p>
              <span className="inline-block mt-1 font-mono text-[9px] px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded-full">الخطة: {profile.premiumPlan || "باقة ممتازة"}</span>
            </div>
          ) : profile.premiumStatus === "pending" ? (
            <div className="bg-amber-950/40 border border-amber-600/30 text-amber-300 rounded-2xl p-4 text-xs font-bold space-y-1 animate-pulse">
              <div className="flex items-center justify-center gap-1.5 text-base text-amber-500">
                <AlertCircle className="w-5 h-5" />
                <span>طلب الترقية قيد المراجعة الفنية</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">لقد تم حفظ تفاصيل الدفع بأمان. يرجى الانتظار حتى يقوم المسؤول بمراجعتها وتنشيط اشتراكك الممتاز (يستغرق الأمر غالباً دقائق معدودة).</p>
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 text-slate-400 rounded-2xl p-3 text-xs font-semibold">
              حالة حسابك الحالي: الباقة المجانية المحدودة 🚫
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Column 1: Choose package (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <span className="text-base text-cyan-400">1</span>
              <span>اختر الباقة المناسبة لك:</span>
            </h3>
            <p className="text-[11px] text-slate-500">اختر من بين الحزم المرنة التي تلبي طموحاتك ومحفظتك المالية</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plans.map((p) => {
              const isSelected = selectedPlan?.name === p.name;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPlan({ name: p.name, price: p.price })}
                  className={`p-5 rounded-2xl border text-right transition-all flex flex-col justify-between h-40 group relative cursor-pointer ${
                    isSelected 
                      ? "bg-slate-950 border-yellow-500 shadow-[0_8px_30px_rgba(234,179,8,0.15)] ring-1 ring-yellow-500" 
                      : "bg-slate-950/40 border-slate-900 hover:border-slate-800"
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-3.5 left-3.5 bg-yellow-500 text-slate-950 rounded-full p-0.5">
                      <Check className="w-3.5 h-3.5 stroke-[4px]" />
                    </span>
                  )}
                  <div className="space-y-1.5">
                    <h4 className={`text-xs font-extrabold group-hover:text-white transition-colors ${isSelected ? "text-yellow-400" : "text-slate-200"}`}>{p.name}</h4>
                    <p className="text-[10px] text-slate-500 leading-normal line-clamp-2">{p.desc}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-900/40 flex items-baseline justify-between w-full">
                    <span className="text-[9px] text-slate-500 font-bold">السعر الإجمالي:</span>
                    <span className={`text-lg font-black ${isSelected ? "text-yellow-400" : "text-white"}`}>{p.price}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Premium Features Checklist */}
          <div className="bg-slate-950/40 border border-slate-900/60 p-6 rounded-2xl space-y-4">
            <h4 className="text-xs font-bold text-slate-300">مزايا حصرية ستحصل عليها:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="text-xs text-yellow-500">✔</span>
                <span>مراجعات تكرار مجدول غير محدودة للجمل</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-yellow-500">✔</span>
                <span>تقييم النطق عبر ميكروفون مدمج بـ AI</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-yellow-500">✔</span>
                <span>محادثات ذكية غير محدودة مع معلم الألمانية</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-yellow-500">✔</span>
                <span>تصحيح واقتراحات دقيقة ومفصلة للقواعد</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-yellow-500">✔</span>
                <span>دعم فني مخصص ذو أولوية طوال اليوم</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-yellow-500">✔</span>
                <span>شارات Premium فريدة تظهر بملفك التعريفي</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Payment options and submit (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <span className="text-base text-cyan-400">2</span>
              <span>طريقة الدفع والتأكيد:</span>
            </h3>
            <p className="text-[11px] text-slate-500">اختر وسيلة الدفع التي تناسبك واملأ بيانات التحويل</p>
          </div>

          <form onSubmit={handleSubmitRequest} className="space-y-5 bg-slate-950/80 p-6 rounded-2xl border border-slate-900 shadow-sm relative">
            
            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-900 rounded-xl">
              <button
                type="button"
                onClick={() => setPaymentMethod("vodafone")}
                className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                  paymentMethod === "vodafone" 
                    ? "bg-red-650 text-white shadow" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                🔴 Vodafone Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("paypal")}
                className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                  paymentMethod === "paypal" 
                    ? "bg-blue-650 text-white shadow" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                🔵 PayPal
              </button>
            </div>

            {/* Selected package indicator in form */}
            <div className="bg-slate-900/60 p-3 rounded-xl flex items-center justify-between text-xs font-bold">
              <span className="text-slate-400">الباقة المختارة:</span>
              <span className="text-yellow-400">{selectedPlan ? `${selectedPlan.name} - ${selectedPlan.price}` : "يرجى تحديد باقة أولاً"}</span>
            </div>

            {/* Conditional Fields based on method */}
            {paymentMethod === "vodafone" ? (
              <div className="space-y-3.5 border-t border-slate-900 pt-3">
                <div className="bg-red-950/25 border border-red-900/40 rounded-xl p-4 space-y-2 text-center text-xs">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-red-400">رقم تحويل المحفظة المباشر 📲</span>
                  
                  {/* Glowing Phone Number */}
                  <div className="text-xl font-mono text-white tracking-widest font-black py-1">
                    01019789926
                  </div>
                  
                  <div className="flex justify-center pt-1">
                    <button
                      type="button"
                      onClick={handleCopyNumber}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 rounded-lg text-[10px] font-bold text-red-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer border border-red-950"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">تم نسخ الرقم!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ الرقم</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal pt-2">
                    قم بتحويل قيمة الباقة المختارة إلى الرقم المدرج وتفضل بإدخال رقم التحويل أو تفاصيل المعاملة بالأسفل ليتم تفعيل الحساب فوراً.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 border-t border-slate-900 pt-3">
                <label className="block text-xs font-bold text-slate-300">
                  حساب PayPal المدفوع منه (بريد إلكتروني أو رابط):
                </label>
                <input
                  type="text"
                  placeholder="name@example.com أو رابط العملية"
                  value={paypalAccount}
                  onChange={(e) => setPaypalAccount(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono transition-colors"
                />
                <p className="text-[9px] text-slate-500 leading-relaxed">
                  برجاء إرسال المبلغ لبوابة المدفوعات على PayPal وإثبات الإرسال بإرفاق بريدك لإثبات الملكية لبريد الإرسال.
                </p>
              </div>
            )}

            {/* Proof of Payment (REQUIRED fields requested by user) */}
            <div className="space-y-4 border-t border-slate-900 pt-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200">
                  رقم العملية / مرجع التحويل:
                </label>
                <input
                  type="text"
                  placeholder="أدخل الرقم المرجعي للعملية (اختياري بحال رفع لقطة الشاشة)"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-red-950/40"
                />
              </div>

              {/* Advanced screenshot Drag & Drop Upload field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200">
                  أو رفع لقطة شاشة لإثبات الدفع:
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all relative ${
                    screenshot 
                      ? "border-emerald-600/50 bg-emerald-950/5 text-emerald-300" 
                      : "border-slate-800 hover:border-slate-700 hover:bg-slate-900/20 text-slate-500"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    id="screenshot-input"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  
                  <div className="space-y-2 relative z-0 flex flex-col items-center justify-center">
                    <Upload className={`w-6 h-6 ${screenshot ? "text-emerald-400" : "text-slate-450"}`} />
                    <span className="text-[10px] font-bold block">
                      {screenshotName ? `تم اختيار: ${screenshotName}` : "اسحب ملف الصورة هنا أو انقر للتصفح"}
                    </span>
                    <span className="text-[9px] text-slate-600 block">الملفات المدعومة: PNG, JPG, JPEG</span>
                  </div>
                </div>

                {screenshot && (
                  <div className="mt-2 text-center">
                    <img
                      src={screenshot}
                      alt="لوحة إثبات الدفع"
                      className="inline-block max-h-24 rounded-lg border border-slate-800 shadow"
                    />
                  </div>
                )}
              </div>
            </div>

            {errorMsg && (
              <div className="text-red-400 text-xs font-bold bg-red-950/20 border border-red-900/40 p-2.5 rounded-xl text-center flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="text-emerald-400 text-xs font-bold bg-emerald-950/20 border border-emerald-900/40 p-3 rounded-xl text-center leading-relaxed">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !selectedPlan}
              className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 text-xs ${
                selectedPlan 
                  ? "bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-black shadow-[0_4px_16px_rgba(234,179,8,0.25)] cursor-pointer" 
                  : "bg-slate-900 text-slate-600 border border-slate-900 cursor-not-allowed"
              }`}
            >
              <span>{isSubmitting ? "جاري تحزين المعاملة..." : "إرسال طلب الترقية وإثبات الدفع 🚀"}</span>
            </button>

          </form>
        </div>

      </div>

    </div>
  );
}
