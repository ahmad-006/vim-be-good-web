import React from "react";
import type { ThemeConfig } from "../utils/themes";

interface KeystrokeHUDProps {
  keystrokes: string[];
  kps: number;
  totalKeys: number;
  theme: ThemeConfig;
}

export const KeystrokeHUD: React.FC<KeystrokeHUDProps> = ({
  keystrokes,
  kps,
  totalKeys,
  theme,
}) => {
  return (
    <div
      className="flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs font-mono select-none transition-colors"
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
        color: theme.text,
      }}
    >
      <div className="flex items-center gap-1.5 overflow-hidden">
        <span className="text-[10px] tracking-wider uppercase font-semibold opacity-50 mr-1">
          Keys:
        </span>
        {keystrokes.length === 0 ? (
          <span className="text-[11px] opacity-40 italic">waiting for input...</span>
        ) : (
          keystrokes.map((key, idx) => {
            const isLatest = idx === keystrokes.length - 1;
            return (
              <span
                key={idx}
                className={`px-1.5 py-0.5 rounded border text-[11px] font-semibold transition-all ${
                  isLatest ? "scale-110 shadow-sm" : "opacity-70"
                }`}
                style={{
                  backgroundColor: isLatest ? theme.border : theme.bg,
                  borderColor: isLatest ? theme.accent : theme.border,
                  color: isLatest ? theme.accent : theme.text,
                }}
              >
                {key === " " ? "␣" : key}
              </span>
            );
          })
        )}
      </div>

      <div className="flex items-center gap-3 text-[11px]">
        <div className="flex items-center gap-1">
          <span className="opacity-50">KPS:</span>
          <span
            className="font-bold tabular-nums"
            style={{ color: kps > 3 ? theme.accentGreen : theme.accent }}
          >
            {kps.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="opacity-50">Count:</span>
          <span className="font-bold tabular-nums opacity-80">{totalKeys}</span>
        </div>
      </div>
    </div>
  );
};
