import React from "react";
import { Volume2, VolumeX, Tv, Palette, RotateCcw } from "lucide-react";
import type { ThemeConfig } from "../utils/themes";
import { THEMES } from "../utils/themes";
import type { ThemeName } from "../types/game";

interface TerminalHeaderProps {
  theme: ThemeConfig;
  currentTheme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  scanlinesEnabled: boolean;
  onToggleScanlines: () => void;
  onRestartMenu: () => void;
  isPlaying?: boolean;
}

export const TerminalHeader: React.FC<TerminalHeaderProps> = ({
  theme,
  currentTheme,
  onThemeChange,
  soundEnabled,
  onToggleSound,
  scanlinesEnabled,
  onToggleScanlines,
  onRestartMenu,
  isPlaying = false,
}) => {
  return (
    <div
      className="flex items-center justify-between px-4 py-2.5 border-b select-none transition-colors"
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
        color: theme.text,
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onRestartMenu}
          title="Quit to Menu"
        />
        <div
          className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onToggleScanlines}
          title="Toggle CRT Scanlines"
        />
        <div
          className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onToggleSound}
          title="Toggle Mechanical Audio"
        />
        <span className="ml-2 text-xs font-mono font-medium opacity-60 hidden sm:inline">
          nvim [VimBeGood]
        </span>
      </div>

      <div className="text-xs font-mono font-semibold tracking-wide flex items-center gap-2 opacity-90">
        <span style={{ color: theme.accent }}>~/vim-be-good</span>
        <span className="opacity-40 hidden md:inline">•</span>
        <span className="text-[11px] opacity-60 hidden md:inline">ThePrimeagen Motion Trainer</span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={onRestartMenu}
          className="p-1.5 px-2.5 rounded transition-all hover:brightness-125 active:scale-95 text-xs flex items-center gap-1.5 font-mono cursor-pointer"
          style={
            isPlaying
              ? {
                  backgroundColor: "rgba(243, 139, 168, 0.15)",
                  color: theme.accentRed,
                  border: "1px solid rgba(243, 139, 168, 0.4)",
                }
              : {
                  opacity: 0.8,
                }
          }
          title={isPlaying ? "Cancel current game and return to Menu (:q)" : "Return to Menu"}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="text-[11px] font-semibold">{isPlaying ? "Exit to Menu" : "Menu"}</span>
        </button>

        <button
          onClick={onToggleScanlines}
          className={`p-1.5 rounded transition-all active:scale-95 ${
            scanlinesEnabled ? "opacity-100 bg-white/10" : "opacity-60 hover:opacity-100"
          }`}
          title="Toggle CRT Scanlines"
        >
          <Tv className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onToggleSound}
          className={`p-1.5 rounded transition-all active:scale-95 ${
            soundEnabled ? "opacity-100 bg-white/10" : "opacity-40 hover:opacity-80"
          }`}
          title={soundEnabled ? "Mechanical Audio: ON" : "Mechanical Audio: OFF"}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        <div className="relative flex items-center">
          <Palette className="w-3.5 h-3.5 mr-1 opacity-60" />
          <select
            value={currentTheme}
            onChange={(e) => onThemeChange(e.target.value as ThemeName)}
            className="text-[11px] font-mono bg-transparent rounded border px-1.5 py-0.5 focus:outline-none cursor-pointer"
            style={{
              borderColor: theme.border,
              color: theme.text,
              backgroundColor: theme.bg,
            }}
          >
            {Object.values(THEMES).map((t) => (
              <option key={t.id} value={t.id} style={{ backgroundColor: t.bg, color: t.text }}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
