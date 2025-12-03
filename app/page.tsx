"use client";

import { useState } from "react";
import { getAuth, signInWithPopup, GoogleAuthProvider, signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import app from "@/lib/firebase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [error, setError] = useState("");
  
  const auth = getAuth(app);

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAnonymous = async () => {
    try {
      await signInAnonymously(auth);
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "/dashboard";
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        await createUserWithEmailAndPassword(auth, email, password);
        window.location.href = "/dashboard";
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🏭 Digital Escape Room
          </h1>
          <p className="text-blue-200">
            ברוכים הבאים לסיור האינטראקטיבי במפעל
          </p>
          <p className="text-blue-300 text-sm mt-1">
            המכללה האקדמית להנדסה עזריאלי
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {!showEmailForm ? (
          <div className="space-y-4">
            <button 
              onClick={handleGoogle}
              className="w-full bg-white text-gray-800 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-3 hover:bg-gray-100 transition"
            >
              <span className="text-xl">G</span>
              כניסה עם Google
            </button>

            <button 
              onClick={() => setShowEmailForm(true)}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-3 hover:bg-blue-700 transition"
            >
              ✉️ כניסה עם אימייל
            </button>

            <button 
              onClick={handleAnonymous}
              className="w-full bg-gray-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-3 hover:bg-gray-600 transition"
            >
              👤 כניסה אנונימית
            </button>
          </div>
        ) : (
          <form onSubmit={handleEmail} className="space-y-4">
            <input
              type="email"
              placeholder="אימייל"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:border-blue-400"
              dir="ltr"
            />
            <input
              type="password"
              placeholder="סיסמה"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:border-blue-400"
              dir="ltr"
            />
            <button 
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              התחבר / הירשם
            </button>
            <button 
              type="button"
              onClick={() => setShowEmailForm(false)}
              className="w-full text-blue-300 hover:text-white transition"
            >
              חזרה
            </button>
          </form>
        )}

        <p className="text-center text-blue-200/60 text-sm mt-6">
          גלו את עולם ההנדסה התעשייתית דרך משחקים ואתגרים
        </p>

      </div>
    </div>
  );
}