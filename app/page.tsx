"use client";

import { useEffect, useState } from "react";
import {
  signInWithPopup,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export default function LoginPage() {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  const handleAnonymous = async () => {
    try {
      await signInAnonymously(auth);
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      if (err instanceof Error && 'code' in err && err.code === "auth/user-not-found") {
        await createUserWithEmailAndPassword(auth, email, password);
        window.location.href = "/dashboard";
      } else if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  return (
    <div 
      dir="rtl" 
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ backgroundColor: "#0F4C81" }}
    >
      {/* Background pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gear top right */}
        <div 
          className="absolute top-20 right-10 opacity-20"
          style={{ animation: "spin 15s linear infinite" }}
        >
          <svg width="60" height="60" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="25" stroke="white" strokeWidth="4" fill="none"/>
            <circle cx="30" cy="30" r="12" fill="white"/>
          </svg>
        </div>

        {/* Gear bottom left */}
        <div 
          className="absolute bottom-32 left-8 opacity-15"
          style={{ animation: "spin 20s linear infinite reverse" }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" stroke="white" strokeWidth="3" fill="none"/>
            <circle cx="20" cy="20" r="8" fill="white"/>
          </svg>
        </div>

        {/* Chart icon top left */}
        <div 
          className="absolute top-32 left-12 opacity-15"
          style={{ animation: "float 4s ease-in-out infinite" }}
        >
          <svg width="50" height="40" viewBox="0 0 50 40">
            <rect x="0" y="0" width="50" height="40" rx="4" fill="white"/>
            <rect x="8" y="20" width="8" height="15" fill="#0F4C81"/>
            <rect x="21" y="12" width="8" height="23" fill="#0F4C81"/>
            <rect x="34" y="8" width="8" height="27" fill="#0F4C81"/>
          </svg>
        </div>

        {/* Lightbulb bottom right */}
        <div 
          className="absolute bottom-40 right-12 opacity-20"
          style={{ animation: "pulse 3s ease-in-out infinite" }}
        >
          <svg width="30" height="40" viewBox="0 0 30 40">
            <circle cx="15" cy="15" r="12" fill="#F4D03F"/>
            <rect x="10" y="27" width="10" height="8" fill="#F4D03F"/>
          </svg>
        </div>
      </div>

      {/* Main Card */}
      <div 
        className={`w-full max-w-sm relative z-10 transition-all duration-700 ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              עוד לא החלטתם מה ללמוד?
            </h1>
            <p className="text-gray-500">
              תנו לנו 20 דקות ונשנה לכם את הראש
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-4 text-sm text-center">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-4">
            {!showEmailForm ? (
              <>
                {/* Google Button */}
                <button
                  onClick={handleGoogle}
                  onMouseEnter={() => setHoveredButton("google")}
                  onMouseLeave={() => setHoveredButton(null)}
                  className="w-full bg-white text-gray-700 py-4 px-6 rounded-xl font-medium flex items-center justify-center gap-3 border-2 transition-all duration-300"
                  style={{
                    borderColor: hoveredButton === "google" ? "#0F4C81" : "#e5e7eb",
                    transform: hoveredButton === "google" ? "translateY(-2px)" : "translateY(0)",
                    boxShadow: hoveredButton === "google" ? "0 10px 25px -10px rgba(15, 76, 129, 0.3)" : "none",
                  }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  המשך עם Google
                </button>

                {/* Email Button */}
                <button
                  onMouseEnter={() => setHoveredButton("email")}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => setShowEmailForm(true)}
                  className="w-full text-white py-4 px-6 rounded-xl font-medium flex items-center justify-center gap-3 transition-all duration-300"
                  style={{ 
                    backgroundColor: hoveredButton === "email" ? "#0a3d6a" : "#0F4C81",
                    transform: hoveredButton === "email" ? "translateY(-2px)" : "translateY(0)",
                    boxShadow: hoveredButton === "email" ? "0 10px 25px -10px rgba(15, 76, 129, 0.5)" : "0 4px 15px -5px rgba(15, 76, 129, 0.3)",
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  המשך עם אימייל
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"/>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-4 text-sm text-gray-400">או</span>
                  </div>
                </div>

                {/* Anonymous Button */}
                <button
                  onClick={handleAnonymous}
                  onMouseEnter={() => setHoveredButton("anon")}
                  onMouseLeave={() => setHoveredButton(null)}
                  className="w-full text-gray-600 py-4 px-6 rounded-xl font-medium flex items-center justify-center gap-3 transition-all duration-300"
                  style={{
                    backgroundColor: hoveredButton === "anon" ? "#e5e7eb" : "#f3f4f6",
                    transform: hoveredButton === "anon" ? "translateY(-2px)" : "translateY(0)",
                    boxShadow: hoveredButton === "anon" ? "0 10px 25px -10px rgba(0, 0, 0, 0.15)" : "none",
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  המשך כאורח
                </button>
              </>
            ) : (
              <form onSubmit={handleEmail} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">אימייל</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">סיסמה</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full text-white py-4 px-6 rounded-xl font-medium transition-all duration-300 hover:opacity-90"
                  style={{ backgroundColor: "#0F4C81" }}
                >
                  כניסה
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  className="w-full text-gray-500 hover:text-gray-700 py-2 transition-colors text-sm"
                >
                  ← חזרה
                </button>
              </form>
            )}
          </div>

          {/* Footer inside card */}
          <p className="text-center text-gray-400 text-xs mt-6">
            אל תגידו שלא הזהרנו אתכם 😉
          </p>
        </div>

        {/* Footer outside card */}
        <div className="text-center mt-6">
          <p className="text-white/80 text-sm font-medium">
            פרויקט גמר של עמנואל וחן
          </p>
          <p className="text-white/60 text-xs mt-1">
            הנדסת תעשייה וניהול | עזריאלי מכללה אקדמית להנדסה
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}