export type GameId =
  | "relative"
  | "ci"
  | "words"
  | "hjkl"
  | "whackamole"
  | "snake"
  | "visual_block"
  | "surround"
  | "random";

export type Difficulty = "noob" | "easy" | "medium" | "hard" | "nightmare" | "tpope";

export type EngineState = "menu" | "countdown" | "playing" | "game_over";

export interface RoundConfig {
  roundTime: number;
  instructions: string[];
  noCursor?: boolean;
  canEndRound?: boolean;
}

export interface RenderResult {
  lines: string[];
  cursorLine: number;
  cursorCol?: number;
}

export interface GameRound {
  id: GameId;
  name: string;
  difficulty: Difficulty;
  getInstructions(): string[];
  getConfig(): RoundConfig;
  render(): RenderResult;
  checkForWin(lines: string[]): boolean;
}

export interface RoundRecord {
  roundNum: number;
  gameId: string;
  difficulty: Difficulty;
  success: boolean;
  timeTaken: number;
  timestamp: number;
}

export interface GameSummary {
  difficulty: Difficulty;
  gameId: string;
  successes: number;
  failures: number;
  roundCount: number;
  timings: number[];
  averageTime: number;
  records: RoundRecord[];
}

export type ThemeName = "catppuccin" | "tokyonight" | "gruvbox" | "rosepine" | "crt_green";
