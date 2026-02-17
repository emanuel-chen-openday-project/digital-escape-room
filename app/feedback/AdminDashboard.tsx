"use client";

import { useState, useEffect, useMemo } from "react";
import {
  subscribeFeedback,
  deleteAllFeedback,
  FeedbackEntryWithId,
  IntentValue,
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
import { Download, X, Trash2, BarChart3, PieChart, TableProperties, Inbox, Home, AlertCircle } from "lucide-react";
import Link from "next/link";
import "./feedback.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

// ============================================
// Types
// ============================================

interface AdminDashboardProps {
  onClose: () => void;
}

interface Filters {
  dateFrom: string;
  dateTo: string;
  minRating: string;
  registration: string;
}

// ============================================
// Constants
// ============================================

const ITEMS_PER_PAGE = 10;

const INTENT_MAP: Record<IntentValue, { text: string; class: string }> = {
  yes: { text: "בהחלט", class: "green" },
  maybe: { text: "אולי", class: "yellow" },
  no: { text: "כנראה לא", class: "red" },
};

// ============================================
// Component
// ============================================

export default function AdminDashboard({ onClose }: AdminDashboardProps) {
  const [feedbackList, setFeedbackList] = useState<FeedbackEntryWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    dateFrom: "",
    dateTo: "",
    minRating: "",
    registration: "",
  });
  const [appliedFilters, setAppliedFilters] = useState<Filters>({
    dateFrom: "",
    dateTo: "",
    minRating: "",
    registration: "",
  });

  // ============================================
  // Real-Time Data Loading
  // ============================================

  useEffect(() => {
    const unsubscribe = subscribeFeedback(
      (data) => {
        setFeedbackList(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error loading feedback:", err);
        setError("שגיאה בטעינת משובים: " + err.message);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // ============================================
  // Filtering
  // ============================================

  const filteredFeedback = useMemo(() => {
    return feedbackList.filter((fb) => {
      // Date from filter
      if (appliedFilters.dateFrom) {
        const fromDate = new Date(appliedFilters.dateFrom);
        const fbDate = fb.createdAt?.toDate?.();
        if (fbDate && fbDate < fromDate) return false;
      }

      // Date to filter
      if (appliedFilters.dateTo) {
        const toDate = new Date(appliedFilters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        const fbDate = fb.createdAt?.toDate?.();
        if (fbDate && fbDate > toDate) return false;
      }

      // Min rating filter
      if (appliedFilters.minRating) {
        const minRating = parseInt(appliedFilters.minRating);
        if (fb.enjoyment < minRating) return false;
      }

      // Registration filter
      if (appliedFilters.registration) {
        const regMap: Record<string, IntentValue> = {
          "בהחלט": "yes",
          "אולי": "maybe",
          "כנראה לא": "no",
        };
        const mappedValue = regMap[appliedFilters.registration];
        if (mappedValue && fb.registration !== mappedValue) return false;
      }

      return true;
    });
  }, [feedbackList, appliedFilters]);

  // ============================================
  // Stats
  // ============================================

  const stats = useMemo(() => {
    if (filteredFeedback.length === 0) return null;

    const total = filteredFeedback.length;
    const avgRating =
      filteredFeedback.reduce((sum, f) => sum + f.enjoyment, 0) / total;

    const yesRegistration = filteredFeedback.filter(
      (f) => f.registration === "yes"
    ).length;
    const registrationPercent = Math.round((yesRegistration / total) * 100);

    const avgUnderstanding =
      filteredFeedback.reduce((sum, f) => sum + f.understanding, 0) / total;

    // Rating distribution
    const ratingDist = [0, 0, 0, 0, 0];
    filteredFeedback.forEach((f) => {
      if (f.enjoyment >= 1 && f.enjoyment <= 5) ratingDist[f.enjoyment - 1]++;
    });

    // Registration distribution
    const regDist = { yes: 0, maybe: 0, no: 0 };
    filteredFeedback.forEach((f) => {
      if (f.registration in regDist) {
        regDist[f.registration as keyof typeof regDist]++;
      }
    });

    return {
      total,
      avgRating,
      registrationPercent,
      avgUnderstanding,
      ratingDist,
      regDist,
    };
  }, [filteredFeedback]);

  // ============================================
  // Pagination
  // ============================================

  const totalPages = Math.ceil(filteredFeedback.length / ITEMS_PER_PAGE);
  const paginatedFeedback = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredFeedback.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredFeedback, currentPage]);

  // ============================================
  // Chart Data
  // ============================================

  const barChartData = useMemo(() => {
    if (!stats) return null;
    return {
      labels: ["1", "2", "3", "4", "5"],
      datasets: [
        {
          label: "מספר משובים",
          data: stats.ratingDist,
          backgroundColor: [
            "rgba(239, 68, 68, 0.8)",
            "rgba(249, 115, 22, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(139, 92, 246, 0.8)",
            "rgba(124, 58, 237, 0.8)",
          ],
          borderRadius: 8,
          borderSkipped: false as const,
        },
      ],
    };
  }, [stats]);

  const doughnutChartData = useMemo(() => {
    if (!stats) return null;
    return {
      labels: ["בהחלט", "אולי", "כנראה לא"],
      datasets: [
        {
          data: [stats.regDist.yes, stats.regDist.maybe, stats.regDist.no],
          backgroundColor: [
            "rgba(16, 185, 129, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(239, 68, 68, 0.8)",
          ],
          borderWidth: 0,
          spacing: 4,
        },
      ],
    };
  }, [stats]);

  // ============================================
  // Handlers
  // ============================================

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    if (filteredFeedback.length === 0) return;

    const header = "תאריך,דירוג,בהירות,אתגר,הבנה,עניין,הרשמה,הערות\n";
    const rows = filteredFeedback
      .map((f) => {
        const date = f.createdAt?.toDate?.()
          ? f.createdAt.toDate().toLocaleDateString("he-IL")
          : "";
        const interest = INTENT_MAP[f.interest]?.text || "";
        const registration = INTENT_MAP[f.registration]?.text || "";
        const escapedComments = `"${(f.comments || "").replace(/"/g, '""')}"`;
        return `${date},${f.enjoyment},${f.clarity},${f.challenge},${f.understanding},${interest},${registration},${escapedComments}`;
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

  const handleDeleteAll = async () => {
    if (!confirm("למחוק את כל המשובים? פעולה זו בלתי הפיכה!")) return;
    try {
      await deleteAllFeedback();
      setFeedbackList([]);
      setCurrentPage(1);
    } catch (err) {
      console.error("Error deleting all feedback:", err);
    }
  };


  // ============================================
  // Helpers
  // ============================================

  const formatDate = (fb: FeedbackEntryWithId) => {
    if (!fb.createdAt?.toDate) return "";
    return fb.createdAt.toDate().toLocaleDateString("he-IL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="rating-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={star <= rating ? "filled" : "empty"}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
    );
  };

  const renderBadge = (value: IntentValue) => {
    const mapping = INTENT_MAP[value];
    if (!mapping) return null;
    return <span className={`badge ${mapping.class}`}>{mapping.text}</span>;
  };

  // ============================================
  // Render
  // ============================================

  return (
    <div className="admin-overlay" dir="rtl">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-header-brand">
            <div className="admin-header-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <div>
              <div className="admin-header-title">דשבורד משובים</div>
              <div className="admin-header-subtitle">יום פתוח | הנדסת תעשייה וניהול</div>
            </div>
          </div>
          <div className="admin-header-actions">
            <div className="admin-live-badge" style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "rgba(16,185,129,0.1)", borderRadius: 8, fontSize: "0.8rem", color: "#10b981", fontWeight: 600 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }} />
              LIVE
            </div>
            <button className="admin-btn admin-btn-success" onClick={handleExportCSV}>
              <Download size={18} />
              <span>ייצוא CSV</span>
            </button>
            <Link href="/dashboard" className="admin-btn admin-btn-secondary" style={{ textDecoration: "none" }}>
              <Home size={18} />
              <span>דף הבית</span>
            </Link>
            <button className="admin-btn admin-btn-secondary" onClick={onClose}>
              <X size={18} />
              <span>סגירה</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-main">
        {loading ? (
          <div className="admin-loading">
            <div className="spinner" />
            <p>טוען משובים...</p>
          </div>
        ) : error ? (
          <div className="admin-empty-state">
            <AlertCircle size={80} style={{ color: "#ef4444" }} />
            <h3>שגיאה בחיבור</h3>
            <p>{error}</p>
          </div>
        ) : feedbackList.length === 0 ? (
          <div className="admin-empty-state">
            <Inbox size={80} />
            <h3>אין משובים עדיין</h3>
            <p>משובים שישלחו יופיעו כאן</p>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="admin-filters">
              <div className="filter-group">
                <label className="filter-label">מתאריך</label>
                <input
                  type="date"
                  className="filter-input"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
                  }
                />
              </div>
              <div className="filter-group">
                <label className="filter-label">עד תאריך</label>
                <input
                  type="date"
                  className="filter-input"
                  value={filters.dateTo}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                  }
                />
              </div>
              <div className="filter-group">
                <label className="filter-label">דירוג מינימלי</label>
                <select
                  className="filter-input"
                  value={filters.minRating}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, minRating: e.target.value }))
                  }
                >
                  <option value="">הכל</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5</option>
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">כוונת הרשמה</label>
                <select
                  className="filter-input"
                  value={filters.registration}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      registration: e.target.value,
                    }))
                  }
                >
                  <option value="">הכל</option>
                  <option value="בהחלט">בהחלט</option>
                  <option value="אולי">אולי</option>
                  <option value="כנראה לא">כנראה לא</option>
                </select>
              </div>
              <button className="filter-apply-btn" onClick={handleApplyFilters}>
                החל סינון
              </button>
            </div>

            {/* Stats Grid */}
            {stats && (
              <div className="admin-stats-grid">
                {/* Total Feedback */}
                <div className="admin-stat-card">
                  <div className="admin-stat-header">
                    <div className="admin-stat-icon purple">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="admin-stat-label">סה&quot;כ משובים</div>
                  <div className="admin-stat-value">{stats.total}</div>
                </div>

                {/* Average Rating */}
                <div className="admin-stat-card">
                  <div className="admin-stat-header">
                    <div className="admin-stat-icon yellow">
                      <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="admin-stat-label">ממוצע דירוג</div>
                  <div className="admin-stat-value">{stats.avgRating.toFixed(1)}</div>
                </div>

                {/* Registration Percent */}
                <div className="admin-stat-card">
                  <div className="admin-stat-header">
                    <div className="admin-stat-icon green">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </div>
                  </div>
                  <div className="admin-stat-label">אחוז &quot;בהחלט נרשם&quot;</div>
                  <div className="admin-stat-value">{stats.registrationPercent}%</div>
                </div>

                {/* Average Understanding */}
                <div className="admin-stat-card">
                  <div className="admin-stat-header">
                    <div className="admin-stat-icon blue">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18h6" />
                        <path d="M10 22h4" />
                        <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
                      </svg>
                    </div>
                  </div>
                  <div className="admin-stat-label">ממוצע הבנת התואר</div>
                  <div className="admin-stat-value">{stats.avgUnderstanding.toFixed(1)}</div>
                </div>
              </div>
            )}

            {/* Charts */}
            {stats && barChartData && doughnutChartData && (
              <div className="admin-charts-grid">
                <div className="admin-chart-card">
                  <div className="admin-chart-title">
                    <BarChart3 size={20} />
                    התפלגות דירוגים
                  </div>
                  <div className="admin-chart-container">
                    <Bar
                      data={barChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
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
                <div className="admin-chart-card">
                  <div className="admin-chart-title">
                    <PieChart size={20} />
                    כוונת הרשמה
                  </div>
                  <div className="admin-chart-container">
                    <Doughnut
                      data={doughnutChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: "65%",
                        plugins: {
                          legend: {
                            position: "bottom" as const,
                            rtl: true,
                            labels: {
                              font: { size: 13 },
                              padding: 16,
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="admin-table-card">
              <div className="admin-table-header">
                <div className="admin-table-title">
                  <TableProperties size={20} />
                  כל המשובים ({filteredFeedback.length})
                </div>
                <button className="admin-btn admin-btn-danger" onClick={handleDeleteAll}>
                  <Trash2 size={18} />
                  <span>מחיקת הכל</span>
                </button>
              </div>

              {filteredFeedback.length === 0 ? (
                <div className="admin-empty-state">
                  <Inbox size={80} />
                  <h3>אין תוצאות</h3>
                  <p>נסה לשנות את הסינון</p>
                </div>
              ) : (
                <>
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>תאריך</th>
                          <th>דירוג</th>
                          <th>בהירות</th>
                          <th>אתגר</th>
                          <th>הבנה</th>
                          <th>עניין</th>
                          <th>הרשמה</th>
                          <th>הערות</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedFeedback.map((fb) => (
                          <tr key={fb.id}>
                            <td>{formatDate(fb)}</td>
                            <td>{renderStars(fb.enjoyment)}</td>
                            <td>{fb.clarity}/5</td>
                            <td>{fb.challenge}/5</td>
                            <td>{fb.understanding}/5</td>
                            <td>{renderBadge(fb.interest)}</td>
                            <td>{renderBadge(fb.registration)}</td>
                            <td className="comment-cell">{fb.comments || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="admin-pagination">
                      <div className="pagination-info">
                        מציג {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                        {Math.min(currentPage * ITEMS_PER_PAGE, filteredFeedback.length)} מתוך{" "}
                        {filteredFeedback.length}
                      </div>
                      <div className="pagination-buttons">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                          (page) => (
                            <button
                              key={page}
                              className={`page-btn ${page === currentPage ? "active" : ""}`}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
