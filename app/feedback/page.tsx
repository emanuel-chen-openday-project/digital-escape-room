"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAdmin } from "@/lib/hooks/useAdmin";
import {
  submitFeedback,
  getAllFeedback,
  deleteFeedback,
  deleteAllFeedback,
  FEEDBACK_CATEGORIES,
  FeedbackEntryWithId,
} from "@/lib/feedbackService";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { ArrowRight, BarChart3, Trash2, X, Download } from "lucide-react";
import "./feedback.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const STAR_LABELS = ["גרוע", "לא טוב", "בסדר", "טוב", "מעולה"];

export default function FeedbackPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin: userIsAdmin } = useAdmin();

  // Form state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Admin state
  const [showAdmin, setShowAdmin] = useState(false);
  const [feedbackList, setFeedbackList] = useState<FeedbackEntryWithId[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Animation
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Load feedback when admin modal opens
  useEffect(() => {
    if (showAdmin) {
      loadFeedback();
    }
  }, [showAdmin]);

  const loadFeedback = async () => {
    setLoadingFeedback(true);
    try {
      const data = await getAllFeedback();
      setFeedbackList(data);
    } catch (err) {
      console.error("Error loading feedback:", err);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await submitFeedback(
        rating,
        selectedCategories,
        comment.trim(),
        user?.uid || null
      );
      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting feedback:", err);
      alert("שגיאה בשליחת המשוב. נסה שוב.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("למחוק את המשוב הזה?")) return;
    setDeleting(id);
    try {
      await deleteFeedback(id);
      setFeedbackList((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error("Error deleting feedback:", err);
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("למחוק את כל המשובים? פעולה זו בלתי הפיכה!")) return;
    try {
      await deleteAllFeedback();
      setFeedbackList([]);
    } catch (err) {
      console.error("Error deleting all feedback:", err);
    }
  };

  const handleExportCSV = () => {
    if (feedbackList.length === 0) return;
    const header = "דירוג,קטגוריות,הערה,תאריך\n";
    const rows = feedbackList
      .map((f) => {
        const date = f.createdAt?.toDate?.()
          ? f.createdAt.toDate().toLocaleDateString("he-IL")
          : "";
        const cats = f.categories.join(" | ");
        const escapedComment = `"${(f.comment || "").replace(/"/g, '""')}"`;
        return `${f.rating},${cats},${escapedComment},${date}`;
      })
      .join("\n");

    const bom = "\uFEFF";
    const blob = new Blob([bom + header + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedback_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ============================================
  // Admin Stats
  // ============================================

  const stats = useMemo(() => {
    if (feedbackList.length === 0) return null;

    const total = feedbackList.length;
    const avgRating =
      feedbackList.reduce((sum, f) => sum + f.rating, 0) / total;

    // Rating distribution
    const ratingDist = [0, 0, 0, 0, 0];
    feedbackList.forEach((f) => {
      if (f.rating >= 1 && f.rating <= 5) ratingDist[f.rating - 1]++;
    });

    // Category counts
    const catCounts: Record<string, number> = {};
    FEEDBACK_CATEGORIES.forEach((c) => (catCounts[c] = 0));
    feedbackList.forEach((f) => {
      f.categories.forEach((c) => {
        if (catCounts[c] !== undefined) catCounts[c]++;
      });
    });

    const withComments = feedbackList.filter(
      (f) => f.comment && f.comment.trim().length > 0
    ).length;

    return { total, avgRating, ratingDist, catCounts, withComments };
  }, [feedbackList]);

  const ratingChartData = useMemo(() => {
    if (!stats) return null;
    return {
      labels: ["1 ⭐", "2 ⭐", "3 ⭐", "4 ⭐", "5 ⭐"],
      datasets: [
        {
          label: "מספר תגובות",
          data: stats.ratingDist,
          backgroundColor: [
            "#ef4444",
            "#f97316",
            "#eab308",
            "#22c55e",
            "#6366f1",
          ],
          borderRadius: 8,
          borderSkipped: false as const,
        },
      ],
    };
  }, [stats]);

  const categoryChartData = useMemo(() => {
    if (!stats) return null;
    return {
      labels: Object.keys(stats.catCounts),
      datasets: [
        {
          data: Object.values(stats.catCounts),
          backgroundColor: [
            "#6366f1",
            "#8b5cf6",
            "#ec4899",
            "#f97316",
            "#22c55e",
          ],
          borderWidth: 0,
        },
      ],
    };
  }, [stats]);

  // ============================================
  // Render
  // ============================================

  return (
    <div className="feedback-page">
      <div className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center p-4 py-8">
        {/* Back + Admin button row */}
        <div
          className={`w-full max-w-lg flex items-center justify-between mb-6 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          }`}
        >
          <button className="back-btn" onClick={() => router.push("/dashboard")}>
            <ArrowRight size={18} />
            חזרה
          </button>

          {userIsAdmin && (
            <button
              className="admin-btn"
              onClick={() => setShowAdmin(true)}
            >
              <BarChart3 size={18} />
              ניהול משובים
            </button>
          )}
        </div>

        {/* Main Card */}
        <div
          className={`w-full max-w-lg bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "200ms" }}
        >
          {submitted ? (
            /* ---- Success State ---- */
            <div className="success-overlay">
              <div className="success-checkmark">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800">
                תודה על המשוב!
              </h2>
              <p className="text-slate-500">המשוב שלך התקבל בהצלחה</p>
              <button
                className="submit-btn mt-4"
                style={{ maxWidth: 240 }}
                onClick={() => router.push("/dashboard")}
              >
                חזרה לתפריט
              </button>
            </div>
          ) : (
            /* ---- Feedback Form ---- */
            <div className="p-6 md:p-8 space-y-6">
              {/* Header */}
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-extrabold text-slate-800">
                  משוב
                </h1>
                <p className="text-slate-500 text-sm">
                  נשמח לשמוע את דעתכם על החוויה ביום הפתוח
                </p>
              </div>

              {/* Star Rating */}
              <div className="space-y-2">
                <label className="block text-center text-sm font-semibold text-slate-600">
                  איך הייתה החוויה?
                </label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn ${
                        star <= (hoverRating || rating) ? "active" : ""
                      }`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      aria-label={`${star} כוכבים`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                {(hoverRating || rating) > 0 && (
                  <p className="text-center text-sm text-indigo-500 font-medium">
                    {STAR_LABELS[(hoverRating || rating) - 1]}
                  </p>
                )}
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <label className="block text-center text-sm font-semibold text-slate-600">
                  על מה תרצו לתת משוב? (אופציונלי)
                </label>
                <div className="category-chips">
                  {FEEDBACK_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`category-chip ${
                        selectedCategories.includes(cat) ? "selected" : ""
                      }`}
                      onClick={() => toggleCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-600">
                  הערות נוספות (אופציונלי)
                </label>
                <textarea
                  className="feedback-textarea"
                  placeholder="ספרו לנו מה חשבתם..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={500}
                />
                <p className="text-left text-xs text-slate-400">
                  {comment.length}/500
                </p>
              </div>

              {/* Submit */}
              <button
                className="submit-btn"
                onClick={handleSubmit}
                disabled={rating === 0 || submitting}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                    שולח...
                  </span>
                ) : (
                  "שליחת משוב"
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============================================
          Admin Modal
          ============================================ */}
      {showAdmin && (
        <div className="admin-overlay" onClick={() => setShowAdmin(false)}>
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="admin-modal-header">
              <h2 className="text-xl font-bold text-slate-800">
                ניהול משובים
              </h2>
              <button
                onClick={() => setShowAdmin(false)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {/* Body */}
            <div className="admin-modal-body">
              {loadingFeedback ? (
                <div className="text-center py-12">
                  <div className="spinner" />
                  <p className="text-slate-400 mt-4">טוען משובים...</p>
                </div>
              ) : feedbackList.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <p className="text-lg font-semibold">אין משובים עדיין</p>
                  <p className="text-sm mt-1">
                    משובים שישלחו יופיעו כאן
                  </p>
                </div>
              ) : (
                <>
                  {/* Stats Cards */}
                  {stats && (
                    <div className="stats-grid">
                      <div className="stat-card">
                        <div className="stat-card-value">{stats.total}</div>
                        <div className="stat-card-label">סה"כ משובים</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-card-value">
                          {stats.avgRating.toFixed(1)}
                        </div>
                        <div className="stat-card-label">דירוג ממוצע</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-card-value">
                          {stats.withComments}
                        </div>
                        <div className="stat-card-label">עם הערות</div>
                      </div>
                    </div>
                  )}

                  {/* Charts */}
                  {stats && ratingChartData && categoryChartData && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="chart-section">
                        <h3 className="text-sm font-bold text-slate-600 mb-2">
                          התפלגות דירוגים
                        </h3>
                        <div className="chart-container">
                          <Bar
                            data={ratingChartData}
                            options={{
                              responsive: true,
                              maintainAspectRatio: true,
                              plugins: {
                                legend: { display: false },
                              },
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  ticks: { stepSize: 1 },
                                },
                              },
                            }}
                          />
                        </div>
                      </div>
                      <div className="chart-section">
                        <h3 className="text-sm font-bold text-slate-600 mb-2">
                          קטגוריות
                        </h3>
                        <div className="chart-container">
                          <Doughnut
                            data={categoryChartData}
                            options={{
                              responsive: true,
                              maintainAspectRatio: true,
                              plugins: {
                                legend: {
                                  position: "bottom" as const,
                                  labels: { font: { size: 11 } },
                                },
                              },
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Admin Actions */}
                  <div className="admin-actions">
                    <button className="admin-btn" onClick={handleExportCSV}>
                      <Download size={16} />
                      ייצוא CSV
                    </button>
                    <button className="admin-btn" onClick={loadFeedback}>
                      רענון
                    </button>
                    <button
                      className="admin-btn danger"
                      onClick={handleDeleteAll}
                    >
                      <Trash2 size={16} />
                      מחיקת הכל
                    </button>
                  </div>

                  {/* Feedback List */}
                  <h3 className="text-sm font-bold text-slate-600 mb-3">
                    כל המשובים ({feedbackList.length})
                  </h3>
                  <div className="feedback-list">
                    {feedbackList.map((fb) => (
                      <div key={fb.id} className="feedback-item">
                        <div className="feedback-item-header">
                          <div className="feedback-item-stars">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <span
                                key={s}
                                style={{
                                  color:
                                    s <= fb.rating ? "#fbbf24" : "#d1d5db",
                                }}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="feedback-item-date">
                              {fb.createdAt?.toDate?.()
                                ? fb.createdAt
                                    .toDate()
                                    .toLocaleDateString("he-IL", {
                                      day: "numeric",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                : ""}
                            </span>
                            <button
                              className="feedback-item-delete"
                              onClick={() => handleDelete(fb.id)}
                              disabled={deleting === fb.id}
                              title="מחק משוב"
                            >
                              {deleting === fb.id ? (
                                <span
                                  className="spinner"
                                  style={{
                                    width: 14,
                                    height: 14,
                                    borderWidth: 2,
                                  }}
                                />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          </div>
                        </div>

                        {fb.categories.length > 0 && (
                          <div className="feedback-item-categories">
                            {fb.categories.map((cat) => (
                              <span key={cat} className="feedback-item-chip">
                                {cat}
                              </span>
                            ))}
                          </div>
                        )}

                        {fb.comment && (
                          <p className="feedback-item-comment">{fb.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
