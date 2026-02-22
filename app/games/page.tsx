"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { useGame } from "@/lib/contexts/GameContext";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  ArrowLeft,
  ChevronRight,
  Play,
  Loader2,
  UserCircle2
} from "lucide-react";

export default function GamesIntro() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { startGame } = useGame();

  const [isVisible, setIsVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  const modalContentRef = useRef<HTMLDivElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Modal animation
  useEffect(() => {
    if (showModal && modalContentRef.current) {
      gsap.fromTo(
        modalContentRef.current,
        { scale: 0.9, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.7)" }
      );
    }
  }, [showModal]);

  const openNicknameModal = () => {
    setShowModal(true);
  };

  const closeNicknameModal = () => {
    if (modalContentRef.current) {
      gsap.to(modalContentRef.current, {
        scale: 0.9,
        y: 20,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          setShowModal(false);
          setNickname("");
          setError("");
        }
      });
    } else {
      setShowModal(false);
      setNickname("");
      setError("");
    }
  };

  const validateNickname = (value: string) => {
    if (value.length < 2) return "הכינוי חייב להכיל לפחות 2 תווים";
    if (value.length > 15) return "הכינוי יכול להכיל עד 15 תווים";
    return "";
  };

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNickname(value);
    if (error) setError(validateNickname(value));
  };

  const handleSubmitNickname = async () => {
    const validationError = validateNickname(nickname);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsStarting(true);
    try {
      await startGame(nickname.trim());
      router.push("/games/play");
    } catch (err) {
      console.error("Error starting game:", err);
      setError("שגיאה בהתחלת המשחק. נסו שוב.");
      setIsStarting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && nickname.length >= 2) {
      handleSubmitNickname();
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
    <div className="bg-slate-50 overflow-y-auto h-screen w-full relative select-none" dir="rtl">

      {/* Animated Background Blobs */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6 pb-20 overflow-y-auto">

        {/* Factory Icon */}
        <div
          className={`mb-6 transition-all duration-1000 ease-out ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-0"
          }`}
        >
          <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl shadow-2xl flex items-center justify-center text-white">
            <div className="absolute inset-2 bg-white/20 backdrop-blur-sm rounded-2xl"></div>
            <svg className="relative z-10 w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>

        {/* Title Section */}
        <div className="text-center mb-8 space-y-2">
          <h1
            className={`text-4xl md:text-5xl font-black text-slate-800 tracking-tight transition-all duration-1000 ease-out ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            חדר הבריחה הדיגיטלי
          </h1>
        </div>

        {/* Explanation Card */}
        <div
          className={`bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-xl max-w-md w-full mx-auto mb-8 transition-all duration-1000 ease-out ${
            isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-95"
          }`}
          style={{ transitionDelay: "200ms" }}
        >
          <div className="text-center space-y-4">
            <p
              className={`text-xl md:text-2xl font-bold text-slate-800 transition-all duration-500 ${
                isVisible ? "opacity-100" : "opacity-0"
              }`}
              style={{ transitionDelay: "400ms" }}
            >
              ברוכים הבאים למפעל!
            </p>
            <p
              className={`text-base md:text-lg text-slate-600 leading-relaxed transition-all duration-500 ${
                isVisible ? "opacity-100" : "opacity-0"
              }`}
              style={{ transitionDelay: "500ms" }}
            >
              נתקעתם בפנים ויש רק דרך אחת לצאת -
              <span className="text-blue-600 font-bold"> לפתור שלוש חידות</span>.
            </p>
            <p
              className={`text-base md:text-lg text-slate-600 transition-all duration-500 ${
                isVisible ? "opacity-100" : "opacity-0"
              }`}
              style={{ transitionDelay: "600ms" }}
            >
              בכל חידה תקבלו הוראות. קראו, חשבו, פתרו.
            </p>
            <p
              className={`text-lg md:text-xl font-bold text-slate-800 transition-all duration-500 ${
                isVisible ? "opacity-100" : "opacity-0"
              }`}
              style={{ transitionDelay: "700ms" }}
            >
              רק מי שיפצח את כולן יצליח לברוח.
            </p>
            <div
              className={`pt-2 transition-all duration-500 ${
                isVisible ? "opacity-100" : "opacity-0"
              }`}
              style={{ transitionDelay: "800ms" }}
            >
              <span className="text-xl md:text-2xl font-black text-blue-600">
                מוכנים?
              </span>
            </div>
          </div>
        </div>

        {/* Buttons Area */}
        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          {/* Start Button */}
          <button
            onClick={openNicknameModal}
            className={`group relative w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl text-white text-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 ${
              isVisible ? "opacity-100 scale-100" : "opacity-0 scale-50"
            }`}
            style={{ transitionDelay: "900ms" }}
          >
            <span className="flex items-center justify-center gap-2">
              יאללה, בואו נתחיל!
              <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            </span>
          </button>

          {/* Back Button */}
          <button
            onClick={goBack}
            className={`text-slate-400 hover:text-slate-600 font-medium text-sm flex items-center gap-2 transition-all duration-500 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: "1000ms" }}
          >
            <ChevronRight className="w-4 h-4" />
            חזרה לדף הבית
          </button>
        </div>

        {/* Status Dots */}
        <div className="flex gap-3 mt-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50 transition-all duration-500 ${
                isVisible ? "opacity-100 scale-100" : "opacity-0 scale-0"
              }`}
              style={{ transitionDelay: `${1100 + i * 100}ms` }}
            />
          ))}
        </div>

      </div>

      {/* Bottom Footer */}
      <div
        className={`fixed bottom-6 left-0 right-0 text-center pointer-events-none z-0 transition-all duration-1000 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
        style={{ transitionDelay: "1200ms" }}
      >
        <p className="text-xs text-slate-400 font-medium">
          פרויקט גמר הנדסת תעשייה וניהול
        </p>
        <p className="text-[10px] text-slate-300 mt-1 flex items-center justify-center gap-1">
          פותח ע״י עמנואל נתניה וחן ביאזי
        </p>
      </div>

      {/* Nickname Modal Overlay */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && closeNicknameModal()}
        >
          {/* Modal Content */}
          <div
            ref={modalContentRef}
            className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-sm border border-slate-200/50 shadow-2xl"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-white">
                <UserCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-1">
                איך קוראים לך?
              </h2>
              <p className="text-slate-500 text-sm">
                הכינוי שלך יופיע על המסך הגדול
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={nickname}
                  onChange={handleNicknameChange}
                  onKeyPress={handleKeyPress}
                  placeholder="הכינוי שלי..."
                  maxLength={15}
                  className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-xl text-slate-800 placeholder-slate-400 text-lg text-center outline-none transition-all ${
                    error
                      ? "border-red-400"
                      : nickname.length >= 2
                      ? "border-blue-500 bg-white"
                      : "border-slate-200 focus:border-blue-500"
                  }`}
                  autoFocus={false}
                />
                {error && (
                  <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
                )}
                <p
                  className={`text-xs mt-2 text-center transition-colors ${
                    nickname.length >= 2 ? "text-green-500" : "text-slate-400"
                  }`}
                >
                  {nickname.length}/15 תווים
                </p>
              </div>

              <button
                onClick={handleSubmitNickname}
                disabled={isStarting || nickname.length < 2}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-white text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {isStarting ? (
                  <>
                    <span>מתחילים...</span>
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </>
                ) : (
                  <>
                    <span>קדימה!</span>
                    <Play className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                onClick={closeNicknameModal}
                className="w-full py-2 text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
