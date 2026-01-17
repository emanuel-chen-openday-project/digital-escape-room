"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { subscribeToRealtimeLeaderboard } from "@/lib/gameService";
import { useAuth } from "@/lib/hooks/useAuth";
import { LeaderboardPlayer } from "@/lib/types";
import { ChevronRight, Trophy, Clock, Lightbulb, Users } from "lucide-react";

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function getStageLabel(stage: number): string {
  const labels = ["TSP", "Hungarian", "Knapsack"];
  return labels[stage - 1] || "סיום";
}

function getStageIcon(stage: number): string {
  const icons = ["🚚", "👷", "🎒"];
  return icons[stage - 1] || "✅";
}

export default function LeaderboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Subscribe to realtime leaderboard
  useEffect(() => {
    const unsubscribe = subscribeToRealtimeLeaderboard((updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    // Fade in animation
    const timer = setTimeout(() => setIsVisible(true), 100);

    // Update current time every second for live times
    const interval = setInterval(() => setNow(Date.now()), 1000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

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

  const finishedPlayers = players.filter((p) => p.status === "finished");
  const activePlayers = players.filter((p) => p.status === "active");

  return (
    <div className="bg-slate-50 min-h-screen w-full relative select-none" dir="rtl">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full min-h-screen flex flex-col p-4 md:p-6">
        {/* Header */}
        <div
          className={`flex items-center justify-between mb-6 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
            <span className="font-medium">חזרה</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">טבלת המובילים</h1>
          </div>
        </div>

        {/* Stats Summary */}
        <div
          className={`grid grid-cols-2 gap-4 mb-6 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "100ms" }}
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/50 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{activePlayers.length}</p>
                <p className="text-sm text-slate-500">משחקים עכשיו</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/50 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{finishedPlayers.length}</p>
                <p className="text-sm text-slate-500">סיימו את המשחק</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Players Section */}
        {activePlayers.length > 0 && (
          <div
            className={`mb-6 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            <h2 className="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">
              <span className="animate-pulse">🔴</span> משחקים עכשיו
            </h2>
            <div className="space-y-3">
              {activePlayers.map((player, index) => {
                const elapsedTime = now - player.startTime;
                return (
                  <div
                    key={player.id}
                    className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 border border-blue-200/50 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getStageIcon(player.currentStage)}</span>
                        <div>
                          <p className="font-bold text-slate-800">{player.nickname}</p>
                          <p className="text-sm text-blue-600 font-medium">
                            שלב {player.currentStage}: {getStageLabel(player.currentStage)}
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-1 text-slate-600">
                          <Clock className="w-4 h-4" />
                          <span className="font-mono font-bold">{formatTime(elapsedTime)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-600 text-sm">
                          <Lightbulb className="w-3 h-3" />
                          <span>{player.hints} רמזים</span>
                        </div>
                      </div>
                    </div>

                    {/* Stage Progress */}
                    <div className="flex gap-2 mt-3">
                      {[1, 2, 3].map((stage) => (
                        <div
                          key={stage}
                          className={`flex-1 h-2 rounded-full ${
                            stage < player.currentStage
                              ? "bg-green-400"
                              : stage === player.currentStage
                              ? "bg-blue-400 animate-pulse"
                              : "bg-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Finished Players Section */}
        <div
          className={`transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "300ms" }}
        >
          <h2 className="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" /> סיימו את המשחק
          </h2>

          {finishedPlayers.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-200/50 shadow-sm text-center">
              <p className="text-slate-500">אף אחד עוד לא סיים... היה הראשון!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {finishedPlayers.map((player, index) => {
                const totalTime = player.endTime
                  ? player.endTime - player.startTime
                  : player.stageTimes.reduce((a, b) => a + b * 1000, 0);
                const isTopThree = index < 3;
                const rankColors = ["bg-amber-400", "bg-slate-400", "bg-amber-600"];
                const rankEmojis = ["🥇", "🥈", "🥉"];

                return (
                  <div
                    key={player.id}
                    className={`bg-white/90 backdrop-blur-xl rounded-2xl p-4 border shadow-sm ${
                      isTopThree ? "border-amber-200/50" : "border-slate-200/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isTopThree ? (
                          <span className="text-2xl">{rankEmojis[index]}</span>
                        ) : (
                          <span className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-sm">
                            {index + 1}
                          </span>
                        )}
                        <div>
                          <p className="font-bold text-slate-800">{player.nickname}</p>
                          <p className="text-sm text-green-600 font-medium">סיים!</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-1 text-slate-800">
                          <Clock className="w-4 h-4" />
                          <span className="font-mono font-bold">{formatTime(totalTime)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-600 text-sm">
                          <Lightbulb className="w-3 h-3" />
                          <span>{player.hints} רמזים</span>
                        </div>
                      </div>
                    </div>

                    {/* Stage Times Breakdown */}
                    <div className="flex gap-2 mt-3 text-xs">
                      {["TSP", "Hungarian", "Knapsack"].map((stage, i) => (
                        <div
                          key={stage}
                          className="flex-1 bg-slate-50 rounded-lg p-2 text-center"
                        >
                          <p className="text-slate-400 mb-1">{stage}</p>
                          <p className="font-mono font-bold text-slate-700">
                            {player.stageTimes[i] > 0
                              ? formatTime(player.stageTimes[i] * 1000)
                              : "-"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Empty State */}
        {players.length === 0 && (
          <div
            className={`flex-1 flex items-center justify-center transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-slate-500 text-lg">טוען את טבלת המובילים...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
