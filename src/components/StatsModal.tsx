import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Trophy, Clock, CheckCircle2, XCircle, RotateCcw, Share2, Check } from "lucide-react";
import type { GameSummary } from "../types/game";
import type { ThemeConfig } from "../utils/themes";

interface StatsModalProps {
  summary: GameSummary;
  theme: ThemeConfig;
  onReplay: () => void;
  onMenu: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ summary, theme, onReplay, onMenu }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      void confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: [theme.accent, theme.accentGreen, theme.accentYellow],
      });
    } catch {}
  }, [theme]);

  const accuracy = Math.round((summary.successes / summary.roundCount) * 100);

  const handleCopyShare = () => {
    const text = `🏆 VimBeGood Web Result
Mode: ${summary.gameId} | Difficulty: ${summary.difficulty}
Accuracy: ${summary.successes}/${summary.roundCount} (${accuracy}%)
Average Time: ${summary.averageTime}s

Test your vim motions: https://github.com/ahmad-006/vim-be-good-web`;

    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none font-mono">
      <div
        className="w-full max-w-lg rounded-xl border shadow-2xl overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border,
          color: theme.text,
        }}
      >
        <div
          className="p-6 border-b text-center relative"
          style={{ borderColor: theme.border, backgroundColor: theme.bg }}
        >
          <div
            className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center border shadow-inner"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.accent,
              color: theme.accent,
            }}
          >
            <Trophy className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Game Completed</h2>
          <p className="text-xs opacity-60 mt-1">
            Mode:{" "}
            <span className="font-semibold" style={{ color: theme.accent }}>
              {summary.gameId}
            </span>{" "}
            ({summary.difficulty})
          </p>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div
              className="p-3.5 rounded-lg border text-center"
              style={{ backgroundColor: theme.bg, borderColor: theme.border }}
            >
              <div className="text-[11px] opacity-60 uppercase tracking-wider mb-1">Score</div>
              <div className="text-lg font-bold tabular-nums" style={{ color: theme.accentGreen }}>
                {summary.successes} / {summary.roundCount}
              </div>
            </div>

            <div
              className="p-3.5 rounded-lg border text-center"
              style={{ backgroundColor: theme.bg, borderColor: theme.border }}
            >
              <div className="text-[11px] opacity-60 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" /> Avg Time
              </div>
              <div className="text-lg font-bold tabular-nums" style={{ color: theme.accent }}>
                {summary.averageTime}s
              </div>
            </div>

            <div
              className="p-3.5 rounded-lg border text-center"
              style={{ backgroundColor: theme.bg, borderColor: theme.border }}
            >
              <div className="text-[11px] opacity-60 uppercase tracking-wider mb-1">Accuracy</div>
              <div className="text-lg font-bold tabular-nums" style={{ color: theme.accentYellow }}>
                {accuracy}%
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] uppercase tracking-wider opacity-50 font-semibold px-1">
              Rounds Breakdown
            </div>
            <div
              className="max-h-36 overflow-y-auto rounded-lg border divide-y p-1 text-xs"
              style={{
                backgroundColor: theme.bg,
                borderColor: theme.border,
              }}
            >
              {summary.records.map((rec) => (
                <div key={rec.roundNum} className="flex items-center justify-between py-1.5 px-3">
                  <span className="opacity-70">Round {rec.roundNum}</span>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums opacity-60 text-[11px]">
                      {rec.timeTaken.toFixed(2)}s
                    </span>
                    {rec.success ? (
                      <CheckCircle2 className="w-3.5 h-3.5" style={{ color: theme.accentGreen }} />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" style={{ color: theme.accentRed }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-2">
            <button
              onClick={onReplay}
              className="py-2.5 px-4 rounded-lg font-semibold text-xs border flex items-center justify-center gap-1.5 transition-all active:scale-95 hover:opacity-90 cursor-pointer"
              style={{
                backgroundColor: theme.accent,
                borderColor: theme.accent,
                color: theme.surface,
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Replay
            </button>

            <button
              onClick={handleCopyShare}
              className="py-2.5 px-3 rounded-lg font-medium text-xs border flex items-center justify-center gap-1.5 transition-all active:scale-95 hover:bg-white/5 cursor-pointer"
              style={{
                backgroundColor: theme.bg,
                borderColor: theme.border,
                color: theme.text,
              }}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
              {copied ? "Copied!" : "Share Score"}
            </button>

            <button
              onClick={onMenu}
              className="py-2.5 px-3 rounded-lg font-medium text-xs border flex items-center justify-center gap-1.5 transition-all active:scale-95 hover:bg-white/5 cursor-pointer opacity-80 hover:opacity-100"
              style={{
                backgroundColor: theme.bg,
                borderColor: theme.border,
                color: theme.text,
              }}
            >
              Main Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
