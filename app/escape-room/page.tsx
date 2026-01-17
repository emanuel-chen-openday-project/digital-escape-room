"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useGame } from "@/lib/contexts/GameContext";
import { ChevronRight, Gamepad2, User } from "lucide-react";

export default function EscapeRoomIntro() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { startGame, isGameActive } = useGame();
  const [isVisible, setIsVisible] = useState(false);
  const [nickname, setNickname] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // If game is already active, go to play
  useEffect(() => {
    if (isGameActive) {
      router.push("/escape-room/play");
    }
  }, [isGameActive, router]);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleStartGame = async () => {
    if (!nickname.trim()) {
      setError("יש להזין כינוי");
      return;
    }

    if (nickname.length < 2) {
      setError("הכינוי חייב להכיל לפחות 2 תווים");
      return;
    }

    setIsStarting(true);
    setError("");

    try {
      await startGame(nickname.trim());
      router.push("/escape-room/play");
    } catch (err) {
      console.error("Error starting game:", err);
      setError("שגיאה בהתחלת המשחק, נסה שוב");
      setIsStarting(false);
    }
  };

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

  return (
    <div className="bg-slate-50 min-h-screen w-full relative select-none" dir="rtl">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center p-4">
        {/* Back Button */}
        <button
          onClick={goBack}
          className="absolute top-4 right-4 flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
          <span className="font-medium">חזרה</span>
        </button>

        {/* Card */}
        <div
          className={`w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/50 p-8 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
          }`}
        >
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Gamepad2 className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-slate-800 text-center mb-2">
            חדר בריחה דיגיטלי
          </h1>
          <p className="text-slate-500 text-center mb-8">
            הנדסת תעשייה וניהול | יום פתוח
          </p>

          {/* Nickname Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                בחר כינוי למשחק
              </label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isStarting) {
                      handleStartGame();
                    }
                  }}
                  placeholder="הכינוי שלך..."
                  className="w-full pr-10 pl-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  maxLength={20}
                  disabled={isStarting}
                />
              </div>
              {error && (
                <p className="text-rose-500 text-sm mt-2">{error}</p>
              )}
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartGame}
              disabled={isStarting}
              className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-lg rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isStarting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>מתחיל...</span>
                </div>
              ) : (
                "התחל משחק"
              )}
            </button>
          </div>

          {/* Info */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-500 text-center">
              הכינוי יוצג בלוח המובילים
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
