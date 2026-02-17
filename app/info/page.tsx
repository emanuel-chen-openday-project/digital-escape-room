"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { gsap } from "gsap";
import {
  Smartphone,
  Briefcase,
  CheckCircle2,
  Star,
  MapPin,
  Handshake,
  HeartHandshake,
  TrendingUp,
  ExternalLink,
  ChevronRight
} from "lucide-react";

export default function InfoPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const pageTitleRef = useRef<HTMLHeadingElement>(null);
  const mainCardRef = useRef<HTMLDivElement>(null);
  const rolesCardRef = useRef<HTMLDivElement>(null);
  const whyAzrieliCardRef = useRef<HTMLDivElement>(null);
  const qrCardRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // GSAP entrance animations
  useEffect(() => {
    if (authLoading || !user) return;

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.to(pageTitleRef.current, { y: 0, opacity: 1, duration: 0.8 })
      .to(mainCardRef.current, { y: 0, opacity: 1, scale: 1, duration: 0.8 }, "-=0.4")
      .to(rolesCardRef.current, { y: 0, opacity: 1, scale: 1, duration: 0.8 }, "-=0.2")
      .to(whyAzrieliCardRef.current, { y: 0, opacity: 1, scale: 1, duration: 0.8 }, "-=0.2")
      .to(qrCardRef.current, { y: 0, opacity: 1, scale: 1, duration: 0.8 }, "-=0.2")
      .to(footerRef.current, { y: 0, opacity: 1, duration: 0.8 }, "-=0.6");

    return () => {
      tl.kill();
    };
  }, [authLoading, user]);

  const goBack = () => {
    router.push("/dashboard");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const roles = [
    "מנהלי פרויקטים",
    "מנתחי מערכות ונתונים",
    "מהנדסי תהליכים וייצור",
    "מנהלי תפעול ולוגיסטיקה",
    "יועצי ארגון ושיטות",
    "מומחי מערכות מידע ו-ERP"
  ];

  const whyAzrieliItems = [
    {
      icon: MapPin,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      title: "קמפוס חדשני בירושלים",
      description: "מעבדות מתקדמות, כיתות חכמות ומעונות סטודנטים במקום"
    },
    {
      icon: Handshake,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      title: "שיתופי פעולה עם התעשייה",
      description: "תכניות הלימוד מותאמות לצרכי השוק בזמן אמת"
    },
    {
      icon: HeartHandshake,
      iconBg: "bg-pink-100",
      iconColor: "text-pink-600",
      title: "יחס אישי",
      description: "מכללה בגודל שמאפשר קשר ישיר עם המרצים והסגל"
    },
    {
      icon: TrendingUp,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      title: "90% השמה",
      description: "רוב הבוגרים משתלבים בתעשייה ובהייטק"
    }
  ];

  return (
    <div className="bg-slate-50 overflow-hidden h-screen w-full relative select-none" dir="rtl">

      {/* Animated Background Blobs */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content Container (Scrollable) */}
      <div className="relative z-10 w-full h-full overflow-y-auto pb-24 no-scrollbar">
        <div className="flex flex-col items-center justify-start p-6 pt-12 min-h-full">

          {/* Back Button */}
          <button
            onClick={goBack}
            className="self-start mb-4 flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors px-3 py-2 rounded-xl hover:bg-white/50"
          >
            <ChevronRight className="w-5 h-5" />
            <span className="font-medium text-sm">חזרה</span>
          </button>

          {/* Header */}
          <div className="text-center mb-8 space-y-2">
            <h1
              ref={pageTitleRef}
              className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight"
              style={{ opacity: 0, transform: "translateY(40px)" }}
            >
              על הפרויקט
            </h1>
          </div>

          {/* Main Explanation Card */}
          <div
            ref={mainCardRef}
            className="rounded-3xl p-6 md:p-8 shadow-xl max-w-md w-full mb-6 border-t-4 border-t-blue-500"
            style={{
              opacity: 0,
              transform: "translateY(40px) scale(0.95)",
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(226, 232, 240, 0.6)",
              borderTop: "4px solid rgb(59, 130, 246)"
            }}
          >
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                <Smartphone className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">זו לא סתם אפליקציה...</h2>
            </div>

            <div className="space-y-4 text-slate-600 leading-relaxed text-sm md:text-base">
              <p>
                האפליקציה שאתם משתמשים בה כרגע היא{" "}
                <span className="font-bold text-slate-800">פרויקט גמר אמיתי</span>{" "}
                שפותח על ידי הסטודנטים עמנואל נתניה וחן ביאזי, בהנחיית ד&quot;ר פיני דוידוב וד&quot;ר אינסה איינבינדר.
              </p>
              <p className="font-medium text-slate-700">
                ככה נראית נקודת הסיום של התואר - פרויקט אמיתי שמשלב טכנולוגיה, חשיבה הנדסית ויצירתיות. ארבע שנים מעכשיו, גם אתם יכולים להיות פה - עם פרויקט משלכם.
              </p>
            </div>
          </div>

          {/* Job Roles Card */}
          <div
            ref={rolesCardRef}
            className="rounded-3xl p-6 shadow-xl max-w-md w-full mb-6"
            style={{
              opacity: 0,
              transform: "translateY(40px) scale(0.95)",
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(226, 232, 240, 0.6)"
            }}
          >
            <h3 className="text-lg font-bold text-slate-800 mb-2 text-center flex items-center justify-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-500" />
              לאן הולכים אחרי התואר?
            </h3>
            <p className="text-slate-500 text-xs text-center mb-4">בוגרי הנדסת תעשייה וניהול עובדים בכל סוג של ארגון</p>

            <div className="grid grid-cols-1 gap-2">
              {roles.map((role, index) => (
                <div key={index} className="flex items-center gap-3 bg-white/50 p-3 rounded-xl border border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-700 text-sm font-medium">{role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Why Azrieli Card */}
          <div
            ref={whyAzrieliCardRef}
            className="rounded-3xl p-6 shadow-xl max-w-md w-full mb-6"
            style={{
              opacity: 0,
              transform: "translateY(40px) scale(0.95)",
              background: "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(226, 232, 240, 0.6)",
              borderRight: "4px solid rgb(59, 130, 246)"
            }}
          >
            <h3 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              למה עזריאלי?
            </h3>
            <div className="space-y-5">
              {whyAzrieliItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex gap-4 items-start">
                    <div className={`${item.iconBg} p-2 rounded-lg ${item.iconColor} shrink-0 mt-1`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-700 text-sm">{item.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Registration Link Card */}
          <div
            ref={qrCardRef}
            className="rounded-3xl p-8 shadow-xl max-w-md w-full flex flex-col items-center text-center"
            style={{
              opacity: 0,
              transform: "translateY(40px) scale(0.95)",
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(226, 232, 240, 0.6)"
            }}
          >
            <h3 className="text-xl font-bold text-slate-800 mb-6">רוצים גם?</h3>

            <button
              onClick={() => window.open("https://www.jce.ac.il/", "_blank")}
              className="group relative w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl text-white font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3"
            >
              <span>לחצו כאן למעבר לאתר</span>
              <ExternalLink className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Footer (Fixed) */}
      <div
        ref={footerRef}
        className="fixed bottom-4 left-0 right-0 text-center pointer-events-none z-20 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent pt-4 pb-2"
        style={{ opacity: 0, transform: "translateY(16px)" }}
      >
        <p className="text-[10px] text-slate-300">
          פותח ע״י עמנואל נתניה וחן ביאזי
        </p>
      </div>
    </div>
  );
}
