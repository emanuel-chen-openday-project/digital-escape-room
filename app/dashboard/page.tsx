"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, signOut } from "firebase/auth";
import app from "@/lib/firebase";
import {
  Gamepad2,
  Trophy,
  UserPlus,
  Info,
  MessageSquare,
  ChevronLeft,
  LogOut
} from "lucide-react";

const menuItems = [
  {
    id: 'escape-room',
    label: 'חדר בריחה דיגיטלי',
    icon: Gamepad2,
    color: 'from-violet-500 to-purple-600',
    shadow: 'shadow-purple-500/30',
    href: '/games'
  },
  {
    id: 'leaderboard',
    label: 'לוח ביצועים',
    icon: Trophy,
    color: 'from-amber-400 to-orange-500',
    shadow: 'shadow-orange-500/30',
    href: '/leaderboard'
  },
  {
    id: 'register',
    label: 'להרשמה מהירה',
    icon: UserPlus,
    color: 'from-cyan-400 to-blue-500',
    shadow: 'shadow-blue-500/30',
    href: 'https://yedion.jce.ac.il/yedion/fireflyweb.aspx?prgname=RegForm&arguments=-N60#',
    external: true
  },
  {
    id: 'info',
    label: 'מידע נוסף',
    icon: Info,
    color: 'from-emerald-400 to-teal-500',
    shadow: 'shadow-teal-500/30',
    href: '/info'
  },
  {
    id: 'feedback',
    label: 'משוב',
    icon: MessageSquare,
    color: 'from-rose-400 to-pink-500',
    shadow: 'shadow-pink-500/30',
    href: '/feedback'
  }
];

export default function DashboardPage() {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();
  const auth = getAuth(app);

  useEffect(() => {
    // Exit fullscreen when returning to dashboard
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleMenuClick = (href: string, external?: boolean) => {
    // Enter fullscreen on any menu click
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    if (external) {
      window.open(href, '_blank');
    } else {
      router.push(href);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="bg-slate-50 overflow-hidden h-screen w-full relative" dir="rtl">

      {/* Animated Background Blobs */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4">

        {/* Header Section */}
        <div className="text-center mb-10 space-y-2">
          <h1
            className={`text-6xl md:text-8xl font-black text-slate-800 tracking-tight drop-shadow-sm transition-all duration-1000 ease-out ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'
            }`}
          >
            ברוכים הבאים
          </h1>
          <div
            className={`inline-block px-2 transition-all duration-1000 ease-out ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: '200ms' }}
          >
            <p className="text-xl md:text-2xl font-medium text-slate-600 tracking-wide">
              יום פתוח | <span className="font-bold">הנדסת תעשייה וניהול</span>
            </p>
          </div>
        </div>

        {/* Vertical Menu */}
        <div className="w-full max-w-md flex flex-col gap-3 md:gap-4 px-4">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.href, (item as any).external)}
                className={`group relative flex items-center justify-between w-full p-4 md:p-5 bg-white/90 backdrop-blur-md border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-500 ease-out overflow-hidden ${
                  isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
                }`}
                style={{ transitionDelay: `${400 + index * 100}ms` }}
              >
                {/* Hover Gradient Background */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-r ${item.color} transition-opacity duration-300`}></div>

                {/* Right Colored Accent Bar */}
                <div className={`absolute right-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${item.color} opacity-100`}></div>

                <div className="flex items-center gap-5 z-10">
                  {/* Icon Box */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${item.color} text-white shadow-md ${item.shadow} group-hover:rotate-6 transition-transform duration-300`}>
                    <Icon size={24} strokeWidth={2.5} />
                  </div>

                  {/* Text */}
                  <span className="text-xl font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                    {item.label}
                  </span>
                </div>

                {/* Arrow */}
                <ChevronLeft className="text-slate-300 group-hover:text-slate-500 group-hover:-translate-x-1 transition-all" size={24} />
              </button>
            );
          })}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`mt-4 flex items-center justify-center gap-2 text-slate-400 hover:text-rose-500 transition-all duration-500 ease-out text-sm font-medium ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: `${400 + menuItems.length * 100}ms` }}
          >
            <LogOut size={16} />
            יציאה מהמערכת
          </button>
        </div>

      </div>

      {/* Mobile App Footer */}
      <div
        className={`absolute bottom-6 left-0 right-0 text-center transition-all duration-1000 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
        style={{ transitionDelay: '1200ms' }}
      >
        <p className="text-xs text-slate-400 font-medium">
          פרויקט גמר הנדסת תעשייה וניהול
        </p>
        <p className="text-[10px] text-slate-300 mt-1 flex items-center justify-center gap-1">
          פותח ע״י עמנואל נתניה וחן ביאזי
        </p>
      </div>

    </div>
  );
}
