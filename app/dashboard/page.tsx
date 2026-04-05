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

interface MenuItem {
  id: string;
  label: string;
  icon: typeof Gamepad2;
  color: string;
  shadow: string;
  href: string;
  external?: boolean;
}

const menuItems: MenuItem[] = [
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
    label: 'הרשמה ללימודים',
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
  const [showIOSBanner, setShowIOSBanner] = useState(false);
  const router = useRouter();
  const auth = getAuth(app);

  useEffect(() => {
    // Exit fullscreen when returning to dashboard (with webkit fallback for iOS)
    const fsElement = document.fullscreenElement || (document as any).webkitFullscreenElement;
    if (fsElement) {
      const exitFs = document.exitFullscreen?.bind(document) || (document as any).webkitExitFullscreen?.bind(document);
      if (exitFs) exitFs().catch(() => {});
    }

    // Detect iOS Safari (not standalone/PWA) to show install banner
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
    const isStandalone = (navigator as any).standalone === true
      || window.matchMedia('(display-mode: standalone)').matches;
    const dismissed = localStorage.getItem('ios-pwa-banner-dismissed');

    if (isIOS && !isStandalone && !dismissed) {
      setShowIOSBanner(true);
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const dismissIOSBanner = () => {
    setShowIOSBanner(false);
    localStorage.setItem('ios-pwa-banner-dismissed', '1');
  };

  const handleMenuClick = async (href: string, external?: boolean) => {
    if (external) {
      // Don't enter fullscreen for external links - it blocks popups
      window.open(href, '_blank');
    } else {
      // Enter fullscreen only for game pages (not leaderboard, info, feedback)
      if (href.startsWith('/games')) {
        // Try multiple elements - different iOS versions support different targets
        const targets = [document.body, document.documentElement];
        for (const target of targets) {
          try {
            const requestFs = target.requestFullscreen?.bind(target)
              || (target as any).webkitRequestFullscreen?.bind(target);
            if (requestFs) {
              await requestFs();
              break; // Success
            }
          } catch {
            continue; // Try next
          }
        }
      }
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
    <div className="bg-slate-50 overflow-y-auto h-screen w-full relative" dir="rtl">

      {/* Animated Background Blobs - fixed so they stay visible during scroll */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full min-h-full flex flex-col items-center justify-center p-4 py-8">

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

        {/* iOS Install Banner */}
        {showIOSBanner && (
          <div
            className={`w-full max-w-md mx-auto mb-6 px-4 transition-all duration-700 ease-out ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: '300ms' }}
          >
            <div className="relative bg-white/90 backdrop-blur-md border border-violet-200/60 rounded-2xl shadow-sm p-4 overflow-hidden">
              {/* Accent bar */}
              <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-violet-500 to-purple-600"></div>

              {/* Close button */}
              <button
                onClick={dismissIOSBanner}
                className="absolute top-3 left-3 w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="סגור"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <p className="text-sm font-bold text-slate-700 mb-3 pr-1">
                לחוויית מסך מלא:
              </p>

              <div className="flex flex-col gap-2 text-sm text-slate-600 pr-1">
                <div className="flex items-center gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold">1</span>
                  <span>לחצו על</span>
                  <span className="inline-flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-0.5 font-medium text-slate-700">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                    שיתוף
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold">2</span>
                  <span>בחרו</span>
                  <span className="inline-flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-0.5 font-medium text-slate-700">
                    הוסף למסך הבית
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mt-3 pr-1">
                ניתן להסיר בכל עת בלחיצה ארוכה על הסמל
              </p>
            </div>
          </div>
        )}

        {/* Vertical Menu */}
        <div className="w-full max-w-md flex flex-col gap-3 md:gap-4 px-4">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.href, item.external)}
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

        </div>

        {/* Logout & Footer - inside main content for smooth flow */}
        <div
          className={`mt-10 mb-4 flex flex-col items-center gap-4 transition-all duration-1000 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: `${400 + menuItems.length * 100}ms` }}
        >
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 text-slate-400 hover:text-rose-500 transition-colors text-sm font-medium"
          >
            <LogOut size={16} />
            יציאה מהמערכת
          </button>

          <div className="pt-2 text-center">
            <p className="text-xs text-slate-400 font-medium">
              פרויקט גמר הנדסת תעשייה וניהול
            </p>
            <p className="text-[10px] text-slate-300 mt-1 flex items-center justify-center gap-1">
              פותח ע״י עמנואל נתניה וחן ביאזי
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
