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
  isContinuous?: boolean;
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
  start?(onUpdate: (canvasLines: string[]) => void, onEnd: (success: boolean) => void): void;
  cleanup?(): void;
  handleKey?(key: string): void;
}

export interface RoundRecord {
  roundNum: number;
  gameId: string;
  difficulty: Difficulty;
  success: boolean;
  timeTaken: number;
  timestamp: number;
  score?: number;
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
  totalScore?: number;
}

export type ThemeName = "catppuccin" | "tokyonight" | "gruvbox" | "rosepine" | "crt_green";
