"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAdmin } from "@/lib/hooks/useAdmin";
import { submitFeedback, IntentValue } from "@/lib/feedbackService";
import {
  Clock,
  MessageCircle,
  Lock,
  Check,
  Home,
} from "lucide-react";
import Link from "next/link";
import "./feedback.css";
import dynamic from "next/dynamic";

const AdminDashboard = dynamic(() => import("./AdminDashboard"), {
  ssr: false,
});

const TOTAL_QUESTIONS = 6;
const TOTAL_STEPS = 9; // welcome + 6 questions + comments + success

const STAR_MESSAGES: Record<number, string> = {
  1: "😕 אפשר יותר טוב...",
  2: "🤔 לא הכי",
  3: "😊 בסדר",
  4: "😄 טוב מאוד!",
  5: "🤩 מעולה! שמחים שנהנית",
};

interface FormData {
  enjoyment: number;
  clarity: number;
  challenge: number;
  understanding: number;
  interest: IntentValue | "";
  registration: IntentValue | "";
  comments: string;
}

export default function FeedbackPage() {
  const { user } = useAuth();
  const { isAdmin: userIsAdmin } = useAdmin();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    enjoyment: 0,
    clarity: 0,
    challenge: 0,
    understanding: 0,
    interest: "",
    registration: "",
    comments: "",
  });
  const [showAdmin, setShowAdmin] = useState(false);
  const confettiRef = useRef<HTMLDivElement>(null);

  // Progress
  const progress =
    currentStep === 0 ? 0 : (currentStep / (TOTAL_STEPS - 2)) * 100;

  // Step dots
  const stepDots = Array.from({ length: TOTAL_QUESTIONS }, (_, i) => {
    const stepIndex = i + 1;
    if (stepIndex < currentStep) return "completed";
    if (stepIndex === currentStep) return "active";
    return "";
  });

  // Navigation
  const goNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep]);

  const goPrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  // Submit
  const handleSubmit = useCallback(async () => {
    if (
      formData.enjoyment === 0 ||
      formData.clarity === 0 ||
      formData.challenge === 0 ||
      formData.understanding === 0 ||
      !formData.interest ||
      !formData.registration
    ) {
      return;
    }

    try {
      await submitFeedback({
        enjoyment: formData.enjoyment,
        clarity: formData.clarity,
        challenge: formData.challenge,
        understanding: formData.understanding,
        interest: formData.interest as IntentValue,
        registration: formData.registration as IntentValue,
        comments: formData.comments,
        userId: user?.uid || null,
      });
    } catch (err) {
      console.error("Error submitting feedback:", err);
    }
  }, [formData, user]);

  // Auto-advance on selection + submit on final step
  const handleGoNextWithSubmit = useCallback(() => {
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    if (nextStep === TOTAL_STEPS - 1) {
      // Success step - submit & confetti
      handleSubmit();
      launchConfetti();
    }
  }, [currentStep, handleSubmit]);

  // Star selection
  const selectStar = (value: number) => {
    setFormData((prev) => ({ ...prev, enjoyment: value }));
    setTimeout(() => handleGoNextWithSubmit(), 400);
  };

  // Scale selection
  const selectScale = (field: "clarity" | "challenge" | "understanding", value: number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTimeout(() => handleGoNextWithSubmit(), 400);
  };

  // Choice selection
  const selectChoice = (field: "interest" | "registration", value: IntentValue) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTimeout(() => handleGoNextWithSubmit(), 400);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && currentStep > 0 && currentStep < TOTAL_STEPS - 1) {
        if ((e.target as HTMLElement)?.tagName !== "TEXTAREA") {
          handleGoNextWithSubmit();
        }
      }

      // A, B, C shortcuts for choice cards (steps 5, 6)
      if (currentStep === 5 || currentStep === 6) {
        const field = currentStep === 5 ? "interest" : "registration";
        if (e.key.toLowerCase() === "a") selectChoice(field, "yes");
        if (e.key.toLowerCase() === "b") selectChoice(field, "maybe");
        if (e.key.toLowerCase() === "c") selectChoice(field, "no");
      }

      // Number keys for scale questions (steps 2, 3, 4)
      if (currentStep >= 2 && currentStep <= 4) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 5) {
          const fields: ("clarity" | "challenge" | "understanding")[] = [
            "clarity",
            "challenge",
            "understanding",
          ];
          selectScale(fields[currentStep - 2], num);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, handleGoNextWithSubmit]);

  // Confetti
  const launchConfetti = () => {
    const container = confettiRef.current;
    if (!container) return;

    const colors = ["#8b5cf6", "#7c3aed", "#f97316", "#10b981", "#ec4899", "#06b6d4"];

    for (let i = 0; i < 100; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.style.left = Math.random() * 100 + "%";
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
      piece.style.width = Math.random() * 10 + 5 + "px";
      piece.style.height = Math.random() * 10 + 5 + "px";
      piece.style.setProperty("--fall-duration", `${Math.random() * 3 + 2}s`);
      piece.style.setProperty("--fall-delay", `${Math.random() * 0.5}s`);
      container.appendChild(piece);
    }

    setTimeout(() => {
      if (container) container.innerHTML = "";
    }, 5000);
  };

  // Slide class
  const slideClass = (step: number) => {
    if (step === currentStep) return "question-slide active";
    if (step < currentStep) return "question-slide exit-up";
    return "question-slide";
  };

  // Button text
  const getNextBtnContent = () => {
    if (currentStep === 0) {
      return (
        <>
          בואו נתחיל
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </>
      );
    }
    if (currentStep === TOTAL_STEPS - 2) {
      return (
        <>
          שליחת משוב
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </>
      );
    }
    return (
      <>
        המשך
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </>
    );
  };

  // Render scale question
  const renderScaleQuestion = (
    step: number,
    questionNum: number,
    question: string,
    field: "clarity" | "challenge" | "understanding",
    labelLeft: string,
    labelRight: string
  ) => (
    <div className={slideClass(step)} key={step}>
      <div className="question-badge">
        <span className="question-badge-number">{questionNum}</span>
        מתוך 6
      </div>
      <h2 className="question-text">{question}</h2>
      <div className="scale-cards">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            type="button"
            className={`scale-card-btn ${formData[field] === v ? "selected" : ""}`}
            onClick={() => selectScale(field, v)}
          >
            <span>{v}</span>
          </button>
        ))}
      </div>
      <div className="scale-indicator">
        {[1, 2, 3, 4, 5].map((v) => (
          <div
            key={v}
            className={`scale-indicator-segment ${v <= formData[field] ? "filled" : ""}`}
          />
        ))}
      </div>
      <div className="scale-labels">
        <span>{labelLeft}</span>
        <span>{labelRight}</span>
      </div>
    </div>
  );

  // Render choice question
  const renderChoiceQuestion = (
    step: number,
    questionNum: number,
    question: string,
    field: "interest" | "registration",
    options: { value: IntentValue; icon: string; label: string; key: string }[]
  ) => (
    <div className={slideClass(step)} key={step}>
      <div className="question-badge">
        <span className="question-badge-number">{questionNum}</span>
        מתוך 6
      </div>
      <h2 className="question-text">{question}</h2>
      <div className="choice-cards">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`choice-card-btn ${formData[field] === opt.value ? "selected" : ""}`}
            onClick={() => selectChoice(field, opt.value)}
          >
            <div className="choice-icon">{opt.icon}</div>
            <div className="choice-title">{opt.label}</div>
            <span className="choice-key">{opt.key}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="feedback-page">
      <div className="fb-bg-gradient" />
      <div className="floating-shapes">
        <div className="shape" />
        <div className="shape" />
        <div className="shape" />
      </div>
      <div className="confetti-container" ref={confettiRef} />

      {/* Progress Bar */}
      <div className="progress-container">
        <div
          className="progress-bar"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Navigation */}
      <nav className="fb-nav">
        <div className="nav-brand">
          <div className="nav-logo">
            <MessageCircle size={18} />
          </div>
          <span>משוב סדנה אינטראקטיבית | יום פתוח הנדסת תעשייה וניהול</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {userIsAdmin && (
            <button
              className="admin-btn admin-btn-secondary"
              onClick={() => setShowAdmin(true)}
              style={{ padding: "8px 14px", fontSize: "0.8rem" }}
            >
              דשבורד
            </button>
          )}
          <div className="step-dots">
            {stepDots.map((status, i) => (
              <div key={i} className={`step-dot ${status}`} />
            ))}
          </div>
        </div>
      </nav>

      {/* Form Container */}
      <div className="form-container">
        {/* Step 0: Welcome */}
        <div className={slideClass(0)}>
          <div className="welcome-screen">
            <div className="welcome-icon">👋</div>
            <h1 className="welcome-title">תודה שהשתתפת!</h1>
            <p className="welcome-subtitle">
              נשמח לשמוע מה חשבת על הסדנה שלנו.
              <br />
              המשוב שלך עוזר לנו להשתפר ולהתפתח.
            </p>
            <div className="welcome-features">
              <div className="feature">
                <Clock size={18} />
                פחות מדקה
              </div>
              <div className="feature">
                <MessageCircle size={18} />
                6 שאלות קצרות
              </div>
              <div className="feature">
                <Lock size={18} />
                אנונימי לחלוטין
              </div>
            </div>
          </div>
        </div>

        {/* Step 1: Star Rating - Enjoyment */}
        <div className={slideClass(1)}>
          <div className="question-badge">
            <span className="question-badge-number">1</span>
            מתוך 6
          </div>
          <h2 className="question-text">עד כמה נהנית מהסדנה?</h2>
          <div className="star-rating-container">
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star-btn ${star <= formData.enjoyment ? "active" : ""}`}
                  onClick={() => selectStar(star)}
                >
                  <svg
                    className="star-icon"
                    viewBox="0 0 24 24"
                    strokeWidth={1}
                    fill={star <= formData.enjoyment ? "#fbbf24" : "#e5e7eb"}
                    stroke={star <= formData.enjoyment ? "#f59e0b" : "#d1d5db"}
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
            </div>
            <div
              className={`star-feedback ${formData.enjoyment > 0 ? "visible" : ""}`}
            >
              {formData.enjoyment > 0 && STAR_MESSAGES[formData.enjoyment]}
            </div>
          </div>
        </div>

        {/* Step 2: Clarity Scale */}
        {renderScaleQuestion(
          2, 2,
          "עד כמה המשחקים היו מובנים?",
          "clarity",
          "בכלל לא מובן",
          "מאוד מובן"
        )}

        {/* Step 3: Challenge Scale */}
        {renderScaleQuestion(
          3, 3,
          "עד כמה המשחקים היו מאתגרים ברמה הנכונה?",
          "challenge",
          "קל/קשה מדי",
          "בדיוק נכון"
        )}

        {/* Step 4: Understanding Scale */}
        {renderScaleQuestion(
          4, 4,
          "עד כמה הבנת מה עושים בהנדסת תעשייה וניהול?",
          "understanding",
          "לא הבנתי",
          "הבנתי לגמרי"
        )}

        {/* Step 5: Interest Choice */}
        {renderChoiceQuestion(5, 5, "האם הסדנה הגבירה את העניין שלך בתחום?", "interest", [
          { value: "yes", icon: "🚀", label: "בהחלט כן", key: "A" },
          { value: "maybe", icon: "🤔", label: "קצת", key: "B" },
          { value: "no", icon: "😐", label: "לא ממש", key: "C" },
        ])}

        {/* Step 6: Registration Choice */}
        {renderChoiceQuestion(6, 6, "האם היית שוקל/ת להירשם לתואר?", "registration", [
          { value: "yes", icon: "✅", label: "בהחלט", key: "A" },
          { value: "maybe", icon: "💭", label: "אולי", key: "B" },
          { value: "no", icon: "❌", label: "כנראה לא", key: "C" },
        ])}

        {/* Step 7: Comments (Optional) */}
        <div className={slideClass(7)}>
          <div className="optional-tag">
            <Check size={14} />
            אופציונלי
          </div>
          <h2 className="question-text">יש לך הערות או הצעות לשיפור?</h2>
          <div className="textarea-container">
            <textarea
              className="feedback-textarea"
              placeholder="נשמח לשמוע מה חשבת..."
              maxLength={500}
              value={formData.comments}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, comments: e.target.value }))
              }
            />
            <div className="char-count">
              <span>{formData.comments.length}</span>/500
            </div>
          </div>
        </div>

        {/* Step 8: Success */}
        <div className={slideClass(8)}>
          <div className="success-screen">
            <div className="success-icon-circle">
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                width="50"
                height="50"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="success-title">תודה רבה! 🎉</h2>
            <p className="success-subtitle">
              המשוב שלך התקבל בהצלחה.
              <br />
              בהצלחה בבחירת מסלול הלימודים!
            </p>
            <Link href="/" className="fb-btn fb-btn-primary" style={{ marginTop: 28, display: "inline-flex" }}>
              <Home size={18} />
              חזרה לדף הבית
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      {currentStep < TOTAL_STEPS - 1 && (
        <div className="nav-buttons">
          {currentStep > 0 && (
            <button className="fb-btn fb-btn-secondary" onClick={goPrev}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              הקודם
            </button>
          )}
          <button
            className="fb-btn fb-btn-primary"
            onClick={handleGoNextWithSubmit}
          >
            {getNextBtnContent()}
          </button>
        </div>
      )}

      {/* Admin Dashboard */}
      {showAdmin && <AdminDashboard onClose={() => setShowAdmin(false)} />}
    </div>
  );
}
