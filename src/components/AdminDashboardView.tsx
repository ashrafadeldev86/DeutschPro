import React, { useState, useEffect } from "react";
import { PremiumRequest, UserProfile } from "../types";
import { Users, CheckCircle, XCircle, Clock, ShieldAlert, Award, AlertCircle, RefreshCw, Eye, EyeOff, UserCheck, Download, Activity } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AdminDashboardViewProps {
  profile: UserProfile;
  requests: PremiumRequest[];
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onToggleUserPremiumStatus: (isPremium: boolean) => void;
  onInjectSamplePendingRequest: () => void;
}

export default function AdminDashboardView({
  profile,
  requests,
  onApproveRequest,
  onRejectRequest,
  onToggleUserPremiumStatus,
  onInjectSamplePendingRequest,
}: AdminDashboardViewProps) {
  
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [stats, setStats] = useState<{ totalUsers: number; activeUsersToday: number; appInstalls: number; premiumUsersCount?: number } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const isAdmin = profile.email.toLowerCase().trim() === "ashrafadelnn666@gmail.com";

  const pendingRequests = requests.filter(r => r.status === "pending");
  const approvedRequests = requests.filter(r => r.status === "approved");
  const rejectedRequests = requests.filter(r => r.status === "rejected");

  useEffect(() => {
    if (!isAdmin) return;

    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/admin/stats?adminEmail=${encodeURIComponent(profile.email || "")}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.stats) {
            setStats(data.stats);
          }
        }
      } catch (err) {
        console.error("Failed to load admin stats via polling:", err);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 3500); // 3.5 seconds polling rate for swift real-time updates
    return () => clearInterval(interval);
  }, [profile.email, isAdmin]);

  return (
    <div className="space-y-8 font-sans" dir="rtl">
      
      {/* Header Info */}
      <div className="bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-right">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-rose-500 font-extrabold text-xs uppercase tracking-wider">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span>لوحة التحكم الخاصة بالإدارة &amp; المشرفين</span>
          </div>
          <h2 className="text-xl font-black text-white">لوحة تدقيق ومراجعة المدفوعات</h2>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            مرحباً بك يا كوتش. من هنا يمكنك تدقيق طلبات ترقية العضوية الذهبية الممتازة PRO، ومقارنة إيصالات صور الشاشة أو أرقام المعاملات يدوياً، ومن ثم تفعيل الاشتراك بنقرة واحدة.
          </p>
        </div>

        <button
          onClick={onInjectSamplePendingRequest}
          className="px-4 py-2 bg-blue-950 hover:bg-blue-900 border border-blue-900/50 text-blue-300 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5"
          title="لتجربة تفعيل ورفض الطلبات بسهولة دون حاجة للتحويل الحقيقي"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>حقن طلب مراجعة تجريبي</span>
        </button>
      </div>

      {/* Simulator Actions Box */}
      <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        <div>
          <h4 className="text-xs font-bold text-slate-300">محاكي حسابك الحالي السريع:</h4>
          <p className="text-[10px] text-slate-500 mt-1">تسهيلاً للتجربة والتدقيق، يمكنك تغيير حالة حسابك الحالي لإجراء اختبارات دقيقة:</p>
        </div>
        <div className="flex items-center gap-2.5 justify-end">
          <button
            onClick={() => onToggleUserPremiumStatus(true)}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
              profile.isPremium
                ? "bg-emerald-950 text-emerald-400 border border-emerald-900"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            ⭐ اجعلني Premium
          </button>
          <button
            onClick={() => onToggleUserPremiumStatus(false)}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
              !profile.isPremium
                ? "bg-red-950/50 text-rose-300 border border-red-955"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            🚫 إبطال اشتراكي الـ Premium
          </button>
        </div>
      </div>

      {/* 📊 User Statistics Section */}
      {isAdmin && (
        <div className="space-y-4 p-6 bg-slate-950/60 rounded-3xl border border-slate-900 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
                <span>إحصائيات وتحليلات المستخدمين الكلية</span>
              </h3>
              <p className="text-[11px] text-slate-400">نظام تقارير الأداء الكلي ومعدلات الزيادة الفورية في أعداد المنتسبين والتفاعلات.</p>
            </div>
            {stats && (
              <span className="self-start sm:self-center text-[10px] text-emerald-400 font-black bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-900/60 flex items-center gap-1.5 shadow">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                <span>تحديث فوري نشط (Real-Time)</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            {/* Total Users */}
            <div className="bg-slate-950 border border-slate-900 hover:border-blue-900/40 p-4.5 rounded-2xl flex items-center gap-4 transition-all duration-300 shadow-md relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="p-3 bg-blue-950 border border-blue-900 text-blue-400 rounded-xl relative shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="space-y-1 relative min-w-0">
                <span className="text-[10px] text-slate-400 font-bold block truncate">عدد الحسابات المسجلة الكلي (Total Users)</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-white leading-none">
                    {isLoadingStats ? (
                      <span className="inline-block w-8 h-5 bg-slate-900 animate-pulse rounded" />
                    ) : (
                      <span>{stats?.totalUsers ?? 1}</span>
                    )}
                  </span>
                  <span className="text-[9px] text-emerald-400 font-bold block">متنامٍ</span>
                </div>
                <span className="text-[9px] text-slate-500 block leading-tight">يزداد تلقائياً فور تسجيل أي حساب</span>
              </div>
            </div>

            {/* Active Users Today */}
            <div className="bg-slate-950 border border-slate-900 hover:border-emerald-900/40 p-4.5 rounded-2xl flex items-center gap-4 transition-all duration-300 shadow-md relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="p-3 bg-emerald-950 border border-emerald-900 text-emerald-400 rounded-xl relative shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1 relative min-w-0">
                <span className="text-[10px] text-slate-400 font-bold block truncate">النشطون اليوم (Active Today)</span>
                <div className="flex items-baseline gap-1.5 font-sans">
                  <span className="text-xl font-black text-emerald-400 leading-none">
                    {isLoadingStats ? (
                      <span className="inline-block w-8 h-5 bg-slate-900 animate-pulse rounded" />
                    ) : (
                      <span>{stats?.activeUsersToday ?? 1}</span>
                    )}
                  </span>
                  <span className="text-[9px] text-slate-500">حساب نشط</span>
                </div>
                <span className="text-[9px] text-slate-500 block leading-tight">سجلوا تفاعلات ومزامنة خلال 24 ساعة</span>
              </div>
            </div>

            {/* Premium Gold Users */}
            <div className="bg-slate-950 border border-slate-900 hover:border-amber-900/40 p-4.5 rounded-2xl flex items-center gap-4 transition-all duration-300 shadow-md relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="p-3 bg-amber-950 border border-amber-900 text-amber-405 rounded-xl relative shrink-0">
                <Award className="w-5 h-5 text-amber-400" />
              </div>
              <div className="space-y-1 relative min-w-0">
                <span className="text-[10px] text-slate-400 font-bold block truncate">المشتركون الذهبيون (Premium Users)</span>
                <div className="flex items-baseline gap-1.5 font-sans">
                  <span className="text-xl font-black text-amber-400 leading-none">
                    {isLoadingStats ? (
                      <span className="inline-block w-8 h-5 bg-slate-900 animate-pulse rounded" />
                    ) : (
                      <span>{stats?.premiumUsersCount ?? 0}</span>
                    )}
                  </span>
                  <span className="text-[9px] text-slate-500">عضو مميز</span>
                </div>
                <span className="text-[9px] text-slate-500 block leading-tight">حسابات PRO المفعلة والنشطة بالنظام</span>
              </div>
            </div>

            {/* App Installs */}
            <div className="bg-slate-950 border border-slate-900 hover:border-violet-900/40 p-4.5 rounded-2xl flex items-center gap-4 transition-all duration-300 shadow-md relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-605/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="p-3 bg-slate-900 border border-slate-800 text-violet-400 rounded-xl relative shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div className="space-y-1 relative min-w-0">
                <span className="text-[10px] text-slate-400 font-bold block truncate">تنزيل وتثبيت التطبيق (Installs)</span>
                <div className="flex items-baseline gap-1.5 font-sans">
                  <span className="text-xl font-black text-violet-400 leading-none">
                    {isLoadingStats ? (
                      <span className="inline-block w-8 h-5 bg-slate-900 animate-pulse rounded" />
                    ) : (
                      <span>{stats?.appInstalls ?? 1}</span>
                    )}
                  </span>
                  <span className="text-[9px] text-slate-500">تنزيل وتثبيت</span>
                </div>
                <span className="text-[9px] text-slate-500 block leading-tight">نظام تتبع فريد يسجل تنزيلات الأجهزة</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-amber-950 border border-amber-900 text-amber-500 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold block">طلبات معلقة بانتظار المراجعة:</span>
            <span className="text-xl font-black text-amber-500 block">{pendingRequests.length} طلب</span>
          </div>
        </div>

        <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-950 border border-emerald-950 text-emerald-500 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold block">الطلبات المقبولة والنشطة:</span>
            <span className="text-xl font-black text-emerald-450 block">{approvedRequests.length} اشتراك</span>
          </div>
        </div>

        <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-red-950/30 border border-red-900/40 text-rose-500 rounded-xl">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold block">الطلبات المرفوضة والمستبعدة:</span>
            <span className="text-xl font-black text-rose-400 block">{rejectedRequests.length} طلب</span>
          </div>
        </div>

      </div>

      {/* Requests Segment */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-white flex items-center gap-2">
          <span>طلبات ترقية Premium المقدمة للتدقيق:</span>
          <span className="px-2 py-0.5 bg-slate-900 text-cyan-400 font-mono text-[10px] rounded-full">إجمالي: {requests.length}</span>
        </h3>

        {requests.length === 0 ? (
          <div className="bg-slate-950/20 border border-slate-900/60 rounded-2xl p-10 text-center space-y-3">
            <div className="text-3xl text-slate-600">📥</div>
            <p className="text-xs text-slate-500">لا يوجد أي طلبات اشتراك في النظام حالياً.</p>
            <p className="text-[10px] text-slate-600">تفضل بنقر زر "حقن طلب مراجعة تجريبي" للبدء في اختبار تفعيل الاشتراك ورفضه فورا!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const isPending = req.status === "pending";
              return (
                <div
                  key={req.id}
                  className={`p-5 rounded-2xl border transition-all space-y-4 relative overflow-hidden ${
                    req.status === "approved"
                      ? "bg-emerald-950/5 border-emerald-900/40"
                      : req.status === "rejected"
                      ? "bg-red-950/5 border-red-900/30"
                      : "bg-slate-950 border-slate-900 shadow-md"
                  }`}
                >
                  {/* Status Overlay Band */}
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-800" style={{
                    backgroundColor: req.status === "approved" ? "#10b981" : req.status === "rejected" ? "#ef4444" : "#f59e0b"
                  }} />

                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-900/50">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-slate-900 rounded-full flex items-center justify-center text-xs font-bold text-white uppercase font-sans">
                        {req.userName.substring(0, 2)}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                          <span>{req.userName}</span>
                          {req.userName === profile.name && (
                            <span className="text-[8px] bg-cyan-950 text-cyan-400 font-extrabold px-1.5 py-0.5 rounded-full">أنت</span>
                          )}
                        </h4>
                        <span className="text-[10px] text-slate-500">تاريخ الطلب: {new Date(req.createdAt).toLocaleString("ar-EG")}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        req.status === "approved"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-900"
                          : req.status === "rejected"
                          ? "bg-red-950/40 text-rose-400 border border-red-900"
                          : "bg-amber-950 text-amber-500 border border-amber-900"
                      }`}>
                        {req.status === "approved" ? "✔ مقبول و مفعّل" : req.status === "rejected" ? "❌ مرفوض" : "⏳ معلق قيد التدقيق"}
                      </span>
                    </div>
                  </div>

                  {/* Details Core Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold leading-relaxed">
                    
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-500 block">الباقة المطلوبة:</span>
                      <span className="text-white text-xs block">{req.planName}</span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-500 block">السعر / التكلفة:</span>
                      <span className="text-yellow-400 text-xs block">{req.price}</span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-500 block">طريقة التحويل:</span>
                      <span className="text-white text-xs block">
                        {req.paymentMethod === "vodafone" ? "🟢 Vodafone Cash" : "🔵 PayPal"}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-500 block">رقم المعاملة / البريد:</span>
                      <span className="text-indigo-400 text-xs font-mono block select-all">
                        {req.paymentMethod === "paypal" ? req.paypalAccount : (req.transactionId || "لا يوجد رقم مرجعي")}
                      </span>
                    </div>

                  </div>

                  {/* Screenshot section */}
                  {req.screenshot && (
                    <div className="pt-2">
                      <span className="text-[9px] font-bold text-slate-500 block mb-1">صورة إثبات الدفع المرفقة:</span>
                      <div className="inline-block relative group">
                        <img
                          src={req.screenshot}
                          alt="إثبات الدفع"
                          className="max-h-24 rounded-lg border border-slate-900 cursor-zoom-in hover:brightness-110 transition-all shadow"
                          onClick={() => setSelectedScreenshot(req.screenshot || null)}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none rounded-lg">
                          <span className="text-[9px] text-white font-bold bg-slate-905/90 px-2 py-1 rounded">تكبير الصورة 🔍</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Operational buttons */}
                  {isPending && (
                    <div className="flex items-center gap-3 pt-3 border-t border-slate-900/30">
                      <button
                        onClick={() => onApproveRequest(req.id)}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-505 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>موافقة وتنشيط الاشتراك الذهبي 👑</span>
                      </button>
                      
                      <button
                        onClick={() => onRejectRequest(req.id)}
                        className="px-4 py-2.5 bg-slate-900 hover:bg-red-950/20 text-rose-300 hover:text-rose-200 border border-slate-800 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <XCircle className="w-4 h-4 text-rose-450" />
                        <span>رفض طلب المعاملة ❌</span>
                      </button>
                    </div>
                  )}

                  {req.expiryDate && req.status === "approved" && (
                    <p className="text-[10px] text-emerald-450 font-bold bg-emerald-950/20 px-3 py-1.5 rounded-lg inline-block">
                      تتطابق المعاملة مع قواعد الاشتراك. تاريخ الانتهاء المجدول للاشتراك: {new Date(req.expiryDate).toLocaleDateString("ar-EG")}
                    </p>
                  )}

                  {req.status === "rejected" && (
                    <p className="text-[10px] text-rose-400 font-bold bg-red-950/10 px-3 py-1.5 rounded-lg inline-block">
                      تم رفض هذه المعاملة والمطالبة من المسؤول لإعادة التحويل السليم.
                    </p>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Screen/Modal lightbox for Screenshot scaling */}
      <AnimatePresence>
        {selectedScreenshot && (
          <div
            className="fixed inset-0 bg-slate-950/95 z-50 flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setSelectedScreenshot(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-4xl max-h-[85vh] overflow-auto rounded-xl p-2 bg-slate-900 border border-slate-800"
            >
              <img
                src={selectedScreenshot}
                alt="لقطة إثبات الدفع المكبرة"
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
              <div className="text-center pt-3 text-xs text-slate-400 font-semibold">
                انقر في أي مكان للإغلاق ❌
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
