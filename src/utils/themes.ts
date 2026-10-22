import type { ThemeName } from "../types/game";

export interface ThemeConfig {
  id: ThemeName;
  name: string;
  bg: string;
  surface: string;
  border: string;
  text: string;
  textDim: string;
  accent: string;
  accentGreen: string;
  accentYellow: string;
  accentRed: string;
  statusBg: string;
  statusText: string;
  cursor: string;
}

export const THEMES: Record<ThemeName, ThemeConfig> = {
  catppuccin: {
    id: "catppuccin",
    name: "Catppuccin Mocha",
    bg: "#1e1e2e",
    surface: "#181825",
    border: "#313244",
    text: "#cdd6f4",
    textDim: "#6c7086",
    accent: "#cba6f7",
    accentGreen: "#a6e3a1",
    accentYellow: "#f9e2af",
    accentRed: "#f38ba8",
    statusBg: "#11111b",
    statusText: "#bac2de",
    cursor: "#f5e0dc",
  },
  tokyonight: {
    id: "tokyonight",
    name: "Tokyo Night",
    bg: "#1a1b26",
    surface: "#16161e",
    border: "#292e42",
    text: "#a9b1d6",
    textDim: "#565f89",
    accent: "#7aa2f7",
    accentGreen: "#9ece6a",
    accentYellow: "#e0af68",
    accentRed: "#f7768e",
    statusBg: "#13141c",
    statusText: "#c0caf5",
    cursor: "#c0caf5",
  },
  gruvbox: {
    id: "gruvbox",
    name: "Gruvbox Dark",
    bg: "#282828",
    surface: "#1d2021",
    border: "#3c3836",
    text: "#ebdbb2",
    textDim: "#928374",
    accent: "#fe8019",
    accentGreen: "#b8bb26",
    accentYellow: "#fabd2f",
    accentRed: "#fb4934",
    statusBg: "#1d2021",
    statusText: "#d5c4a1",
    cursor: "#ebdbb2",
  },
  rosepine: {
    id: "rosepine",
    name: "Rosé Pine",
    bg: "#191724",
    surface: "#1f1d2e",
    border: "#26233a",
    text: "#e0def4",
    textDim: "#6e6a86",
    accent: "#c4a7e7",
    accentGreen: "#9ccfd8",
    accentYellow: "#f6c177",
    accentRed: "#eb6f92",
    statusBg: "#14121e",
    statusText: "#e0def4",
    cursor: "#56526e",
  },
  crt_green: {
    id: "crt_green",
    name: "VT220 Phosphor Green",
    bg: "#051109",
    surface: "#020b05",
    border: "#154421",
    text: "#33ff33",
    textDim: "#1f882b",
    accent: "#33ff33",
    accentGreen: "#33ff33",
    accentYellow: "#77ff77",
    accentRed: "#ff3333",
    statusBg: "#020b05",
    statusText: "#33ff33",
    cursor: "#33ff33",
  },
};
