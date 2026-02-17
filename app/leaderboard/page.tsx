"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { subscribeToRealtimeLeaderboard, resetLeaderboard } from "@/lib/gameService";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAdmin } from "@/lib/hooks/useAdmin";
import { LeaderboardPlayer } from "@/lib/types";
import {
  Trophy,
  Clock,
  Search,
  Users,
  Activity,
  Box,
  Truck,
  Map,
  Medal,
  Hourglass,
  PieChart,
  ChevronRight,
  RotateCcw
} from 'lucide-react';

// נתוני משחקים - פלטת צבעים חדשה: "Cool Tech" (Sky, Rose, Indigo)
const GAME_STAGES = [
  {
    id: 1,
    name: 'מאסטר המסלולים',
    shortName: 'מסלולים',
    icon: Map,
    color: 'text-sky-600',
    bg: 'bg-sky-100',
    barColor: 'bg-sky-500',
    gradient: 'from-sky-400 to-blue-500'
  },
  {
    id: 2,
    name: 'מאסטר המשלוחים',
    shortName: 'משלוחים',
    icon: Truck,
    color: 'text-rose-500',
    bg: 'bg-rose-100',
    barColor: 'bg-rose-500',
    gradient: 'from-rose-400 to-red-500'
  },
  {
    id: 3,
    name: 'חבילה למשלוח',
    shortName: 'חבילה',
    icon: Box,
    color: 'text-indigo-600',
    bg: 'bg-indigo-100',
    barColor: 'bg-indigo-500',
    gradient: 'from-indigo-400 to-violet-500'
  }
];

// SVG Donut Chart Component helper
const DonutChart = ({ data, total }: { data: { label: string; value: number; color: string }[]; total: number }) => {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
        {data.map((item, index) => {
          const percent = total > 0 ? item.value / total : 0;
          const strokeDasharray = `${percent * circumference} ${circumference}`;
          const strokeDashoffset = -cumulativePercent * circumference;
          cumulativePercent += percent;

          return (
            <circle
              key={index}
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke={item.color}
              strokeWidth="10"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out hover:opacity-80 drop-shadow-sm"
            />
          );
        })}
      </svg>
      {/* Center Text */}
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-4xl font-bold text-slate-700">{total}</span>
        <span className="text-xs text-slate-400 font-medium tracking-wide">סה״כ שחקנים</span>
      </div>
    </div>
  );
};

export default function LeaderboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin } = useAdmin();
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [filterText, setFilterText] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (!showResetConfirm) {
      setShowResetConfirm(true);
      return;
    }

    setIsResetting(true);
    try {
      const count = await resetLeaderboard();
      console.log(`Deleted ${count} sessions`);
      setShowResetConfirm(false);
    } catch (error) {
      console.error('Failed to reset leaderboard:', error);
    } finally {
      setIsResetting(false);
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Subscribe to realtime leaderboard and update timer
  useEffect(() => {
    const unsubscribe = subscribeToRealtimeLeaderboard((updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    // Update timer every second
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTotalTime = (player: LeaderboardPlayer) => {
    if (player.status === 'finished') {
      return (player.endTime || currentTime) - player.startTime;
    }
    return currentTime - player.startTime;
  };

  // עיבוד נתונים לטבלה ולגרפים
  const { sortedPlayers, topThree, avgTimes, systemStats } = useMemo(() => {
    // Helper: count solved puzzles
    const countSolved = (player: LeaderboardPlayer) =>
      player.stageSolved.filter(s => s === true).length;

    // סינון ומיון
    let filtered = players.filter(p =>
      p.nickname.toLowerCase().includes(filterText.toLowerCase())
    );

    // מיון משופר: סיימו > יותר חידות פתורות > פחות רמזים > זמן מהיר יותר
    const sorted = [...filtered].sort((a, b) => {
      // 1. מי שסיים קודם
      if (a.status === 'finished' && b.status !== 'finished') return -1;
      if (a.status !== 'finished' && b.status === 'finished') return 1;

      // 2. מי שפתר יותר חידות נכון
      const aSolved = countSolved(a);
      const bSolved = countSolved(b);
      if (aSolved !== bSolved) return bSolved - aSolved;

      // 3. מי שהשתמש בפחות רמזים
      if (a.hints !== b.hints) return a.hints - b.hints;

      // 4. מי שסיים מהר יותר
      return getTotalTime(a) - getTotalTime(b);
    });

    // מובילים - אותו מיון
    const winners = players
      .filter(p => p.status === 'finished')
      .sort((a, b) => {
        const aSolved = countSolved(a);
        const bSolved = countSolved(b);
        if (aSolved !== bSolved) return bSolved - aSolved;
        if (a.hints !== b.hints) return a.hints - b.hints;
        return getTotalTime(a) - getTotalTime(b);
      })
      .slice(0, 3);

    // חישוב זמנים ממוצעים
    const times = GAME_STAGES.map((stage, idx) => {
      const relevantPlayers = players.filter(p => p.stageTimes[idx] > 0);
      const totalSeconds = relevantPlayers.reduce((acc, p) => acc + p.stageTimes[idx], 0);
      const avg = relevantPlayers.length ? totalSeconds / relevantPlayers.length : 0;
      return { ...stage, avgTime: avg };
    });

    // חישוב נתוני תפוקת מערכת (לדונאט)
    const finishedCount = players.filter(p => p.status === 'finished').length;
    const activeCount = players.filter(p => p.status === 'active').length;

    const statsData = [
      { label: 'סיימו בהצלחה', value: finishedCount, color: '#10b981' }, // Emerald-500
      { label: 'פעילים במשחק', value: activeCount, color: '#0ea5e9' }, // Sky-500
    ];

    return { sortedPlayers: sorted, topThree: winners, avgTimes: times, systemStats: statsData };
  }, [players, filterText, currentTime]);

  const maxAvgTime = Math.max(...avgTimes.map(t => t.avgTime)) || 1;

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
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8 flex flex-col gap-6" dir="rtl">

      {/* Header Section with integrated buttons */}
      <header className="flex items-center justify-between bg-white px-4 md:px-6 py-4 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
        {/* Updated Header Gradient */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-rose-500"></div>

        {/* Right side - Back button */}
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors px-3 py-2 rounded-xl hover:bg-slate-50"
        >
          <ChevronRight className="w-5 h-5" />
          <span className="font-medium hidden sm:inline">חזרה</span>
        </button>

        {/* Center - Title */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-3xl font-bold text-slate-800">
              לוח ביצועים
            </h1>
            <div className="p-2 bg-slate-50 rounded-xl text-slate-700 shadow-sm border border-slate-100">
              <Activity size={20} />
            </div>
          </div>
          <p className="text-slate-500 text-xs md:text-sm font-medium mt-1">הנדסת תעשייה וניהול | חדר בריחה</p>
        </div>

        {/* Left side - Reset button (admin only) */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              {showResetConfirm && (
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="text-slate-500 hover:text-slate-700 transition-colors px-2 py-2 rounded-xl hover:bg-slate-50 text-sm"
                >
                  ביטול
                </button>
              )}
              <button
                onClick={handleReset}
                disabled={isResetting}
                className={`flex items-center gap-1 md:gap-2 transition-colors px-2 md:px-3 py-2 rounded-xl ${
                  showResetConfirm
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'text-slate-500 hover:text-red-500 hover:bg-red-50'
                } ${isResetting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <RotateCcw className={`w-4 h-4 md:w-5 md:h-5 ${isResetting ? 'animate-spin' : ''}`} />
                <span className="font-medium text-sm hidden sm:inline">{showResetConfirm ? 'אישור' : 'איפוס'}</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Top Section: Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* 1. Bar Chart: Average Times */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 flex flex-col">
          <div className="mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-700">
              <Hourglass className="text-sky-500" size={20} />
              זמן ממוצע בכל משימה
            </h2>
          </div>

          <div className="flex-1 flex items-end justify-around gap-4 pb-2">
            {avgTimes.map((item) => {
              const heightPercent = maxAvgTime > 0 ? (item.avgTime / maxAvgTime) * 100 : 0;
              const StageIcon = item.icon;
              return (
                <div key={item.id} className="flex flex-col items-center justify-end h-full w-1/3 group">
                   <div className="text-xs font-bold text-slate-500 mb-1">
                     {Math.round(item.avgTime)}s
                   </div>
                   <div className="w-full bg-slate-50 rounded-t-xl relative h-32 flex items-end overflow-hidden">
                      <div
                        className={`w-full bg-gradient-to-t ${item.gradient} rounded-t-xl transition-all duration-1000 ease-out relative group-hover:brightness-110 shadow-lg`}
                        style={{ height: `${heightPercent}%` }}
                      >
                         <div className="absolute top-0 left-0 w-full h-full bg-white/10"></div>
                      </div>
                   </div>
                   <div className="mt-3 flex flex-col items-center">
                     <div className={`p-1.5 rounded-full ${item.bg} ${item.color} mb-1.5`}>
                       <StageIcon size={14} />
                     </div>
                     <span className="text-xs font-medium text-slate-500 text-center leading-tight">{item.shortName}</span>
                   </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Podium */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 relative overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-2">
             <h2 className="text-lg font-bold flex items-center gap-2 text-slate-700">
                <Trophy className="text-yellow-500" size={20} />
                המובילים
              </h2>
          </div>

          <div className="flex items-end justify-center gap-3 flex-1 pb-2">
             {/* 2nd Place */}
             {topThree[1] && (
              <div className="flex flex-col items-center w-1/3 animate-slide-up" style={{animationDelay: '0.2s'}}>
                <div className="mb-8 text-center w-full">
                  <span className="block font-bold text-slate-600 text-sm truncate w-full">{topThree[1].nickname}</span>
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-mono relative z-10">{formatTime(getTotalTime(topThree[1]))}</span>
                </div>
                <div className="w-full bg-gradient-to-t from-slate-300 to-slate-200 rounded-t-2xl h-24 flex items-end justify-center pb-2 shadow-inner relative">
                  <div className="absolute -top-5 bg-white border-4 border-slate-200 w-8 h-8 rounded-full flex items-center justify-center font-bold text-slate-400 text-sm shadow-sm z-20">2</div>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {topThree[0] ? (
              <div className="flex flex-col items-center w-1/3 z-10 animate-slide-up">
                <div className="mb-8 text-center w-full">
                  <Trophy size={20} className="mx-auto text-yellow-500 fill-yellow-500 animate-bounce mb-2" />
                  <span className="block font-bold text-slate-800 text-base truncate w-full">{topThree[0].nickname}</span>
                  <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2.5 py-0.5 rounded-full font-mono font-bold shadow-sm relative z-10">
                    {formatTime(getTotalTime(topThree[0]))}
                  </span>
                </div>
                <div className="w-full bg-gradient-to-t from-yellow-400 to-yellow-300 rounded-t-2xl h-36 flex items-end justify-center pb-3 shadow-lg relative">
                  <div className="absolute -top-6 bg-white border-4 border-yellow-400 w-10 h-10 rounded-full flex items-center justify-center font-bold text-yellow-500 text-lg shadow-md z-20">1</div>
                  <Medal size={24} className="text-yellow-600 opacity-50" />
                </div>
              </div>
            ) : (
              <div className="text-slate-400 flex flex-col items-center justify-center h-full text-sm">
                <Clock className="mb-2 animate-spin" size={20} />
                ממתין לתוצאות...
              </div>
            )}

            {/* 3rd Place */}
            {topThree[2] && (
              <div className="flex flex-col items-center w-1/3 animate-slide-up" style={{animationDelay: '0.4s'}}>
                <div className="mb-8 text-center w-full">
                  <span className="block font-bold text-slate-600 text-sm truncate w-full">{topThree[2].nickname}</span>
                  <span className="text-xs bg-orange-50 px-2 py-0.5 rounded-full text-orange-800/70 font-mono relative z-10">{formatTime(getTotalTime(topThree[2]))}</span>
                </div>
                <div className="w-full bg-gradient-to-t from-orange-300 to-orange-200 rounded-t-2xl h-16 flex items-end justify-center pb-2 shadow-inner relative">
                  <div className="absolute -top-5 bg-white border-4 border-orange-200 w-7 h-7 rounded-full flex items-center justify-center font-bold text-orange-400 text-xs shadow-sm z-20">3</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Donut Chart: Player Status */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 flex flex-col">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-700">
              <PieChart className="text-indigo-500" size={20} />
              סטטוס משתתפים
            </h2>
          </div>

          <div className="flex-1 flex flex-col items-center gap-4">
             <DonutChart data={systemStats} total={players.length} />

             {/* Legend - Below Chart */}
             <div className="flex justify-center gap-6 w-full pt-2">
                {systemStats.map((stat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: stat.color }}></div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-xs font-medium">{stat.label}</span>
                      <span className="text-lg font-black text-slate-700 leading-none">{stat.value}</span>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col flex-1 min-h-[400px]">
        <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center bg-white gap-4">
          <h3 className="font-bold text-slate-700 flex items-center gap-2 text-lg">
            <Users size={20} className="text-slate-400" />
            משתתפים בזמן אמת
          </h3>
          <div className="relative w-full sm:w-auto">
             <input
              type="text"
              placeholder="חיפוש לפי כינוי..."
              className="pl-4 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white shadow-sm w-full sm:w-64 transition-all"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
            <Search className="absolute right-3 top-3 text-slate-400" size={16} />
          </div>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-right">
            <thead className="bg-slate-50 sticky top-0 z-10 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 font-medium w-20 pr-6">#</th>
                <th className="p-4 font-medium">כינוי</th>
                <th className="p-4 font-medium">התקדמות</th>
                <th className="p-4 font-medium text-center">רמזים</th>
                <th className="p-4 font-medium text-left pl-8">זמן משוקלל</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {sortedPlayers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    <Clock className="mx-auto mb-2 animate-spin" size={24} />
                    ממתין לשחקנים...
                  </td>
                </tr>
              ) : (
                sortedPlayers.map((player, index) => {
                  const isFinished = player.status === 'finished';
                  const totalTime = getTotalTime(player);

                  return (
                    <tr key={player.id} className="hover:bg-sky-50/50 transition-colors group">
                      <td className="p-4 text-slate-400 font-mono pr-6">{index + 1}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                           <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md transition-transform group-hover:scale-105
                            ${isFinished ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-gradient-to-br from-sky-400 to-indigo-500'}`}>
                             {player.nickname.substring(0,2).toUpperCase()}
                           </div>
                           <div>
                              <span className="font-bold text-slate-700 block text-base">{player.nickname}</span>
                           </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                           {GAME_STAGES.map((stage, i) => {
                             const timeInStage = player.stageTimes[i];
                             const isDone = timeInStage > 0;
                             const solvedStatus = player.stageSolved?.[i]; // true = solved, false = failed, null = not done
                             // Skipped if not done, but currentStage is beyond this one OR player is finished overall
                             const isSkipped = !isDone && (player.currentStage > i + 1 || player.status === 'finished');
                             const isCurrent = player.currentStage === i + 1 && !isFinished && !isSkipped;
                             const StageIcon = stage.icon;

                             let bgColor = 'bg-slate-100 text-slate-300'; // default: not started
                             if (isDone) {
                               // Check if solved correctly, wrong answer, or exited
                               if (solvedStatus === true) {
                                 bgColor = 'bg-emerald-500 text-white shadow-sm'; // Solved - green
                               } else if (solvedStatus === false) {
                                 bgColor = 'bg-orange-500 text-white shadow-sm'; // Wrong answer - orange
                               } else if (solvedStatus === null) {
                                 bgColor = 'bg-red-500 text-white shadow-sm'; // Exited/abandoned - red
                               } else {
                                 bgColor = 'bg-emerald-500 text-white shadow-sm'; // Legacy data without solved status
                               }
                             } else if (isSkipped) {
                               bgColor = 'bg-red-500 text-white shadow-sm'; // Skipped - red
                             } else if (isCurrent) {
                               bgColor = 'bg-slate-200 text-slate-500 ring-2 ring-slate-200'; // Current active
                             }

                             return (
                               <div
                                key={stage.id}
                                title={isDone ? (solvedStatus === true ? 'נפתר בהצלחה ✓' : solvedStatus === false ? 'לא נפתר ✗' : solvedStatus === null ? 'יצא מהמשחק ✗' : 'הושלם') : isSkipped ? 'דילג' : isCurrent ? 'משחק נוכחי' : 'טרם התחיל'}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${bgColor} ${isCurrent ? 'scale-110' : ''}`}
                               >
                                 <StageIcon size={14} />
                               </div>
                             )
                           })}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                         <span className={`inline-block w-8 h-6 leading-6 text-center rounded-lg font-bold text-xs ${player.hints === 0 ? 'bg-emerald-100 text-emerald-700' : player.hints >= 3 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                           {player.hints}
                         </span>
                      </td>
                      <td className="p-4 text-left pl-8">
                        <span className={`font-mono font-bold text-base ${isFinished ? 'text-emerald-600' : 'text-slate-700'}`}>
                          {formatTime(totalTime)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slide-up {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
