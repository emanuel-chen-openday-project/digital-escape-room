"use client";

import { useState, useEffect } from "react";
import { getAuth, signInWithPopup, GoogleAuthProvider, signInAnonymously } from "firebase/auth";
import app from "@/lib/firebase";
import { Lock, User } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  const auth = getAuth(app);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleGoogle = async () => {
    try {
      if (navigator.vibrate) navigator.vibrate(5);
      // Enter fullscreen when logging in
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      await signInWithPopup(auth, new GoogleAuthProvider());
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAnonymous = async () => {
    try {
      if (navigator.vibrate) navigator.vibrate(5);
      // Enter fullscreen when logging in
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      await signInAnonymously(auth);
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-slate-50 overflow-hidden h-screen w-full relative select-none" dir="rtl">

      {/* Animated Background Blobs */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6">

        {/* Login Card Container */}
        <div
          className={`w-full max-w-sm bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-2xl rounded-3xl p-8 transition-all duration-1000 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >

          {/* Login Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Lock className="w-8 h-8" />
            </div>
          </div>

          {/* Header Text */}
          <div className="text-center mb-8 space-y-3">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              ברוכים הבאים
            </h1>
            <p className="text-slate-600 font-medium text-lg leading-relaxed">
              רוצים לדעת איך נראה התואר הכי מבוקש בתעשייה? תמשיכו איתנו
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-700 p-3 rounded-lg mb-4 text-sm text-center">
              {error}
            </div>
          )}

          {/* Main Options */}
          <div className="space-y-4">

            {/* Google Button */}
            <button
              onClick={handleGoogle}
              className="group w-full bg-white text-slate-700 py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-300"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              המשך עם Google
            </button>

            {/* Guest Button */}
            <button
              onClick={handleAnonymous}
              className="group w-full bg-slate-50 text-slate-600 py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 border border-slate-100 hover:bg-slate-100 hover:text-slate-800 transition-all duration-300"
            >
              <User className="w-5 h-5" />
              כניסה כאורח
            </button>

          </div>

          <div className="h-1"></div>
        </div>
      </div>

      {/* Bottom Footer */}
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
