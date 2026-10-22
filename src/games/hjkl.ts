import type { Difficulty, GameRound, RenderResult, RoundConfig } from "../types/game";
import { DIFFICULTY_TIME_MAP, createEmptyLines } from "../utils/gameUtils";

const BOARD_SIZES: Record<Difficulty, number> = {
  noob: 3,
  easy: 5,
  medium: 7,
  hard: 8,
  nightmare: 9,
  tpope: 10,
};

export class HjklRound implements GameRound {
  id = "hjkl" as const;
  name = "hjkl";
  difficulty: Difficulty;

  private instructions = [
    "Remove the x using only h,j,k,l, and x. Remember, this is for you to be better.",
    "Using the arrow keys only makes you dumber. Trust me, I am a scientist.",
    "-------------------------------------------------------------------------------",
  ];

  constructor(difficulty: Difficulty) {
    this.difficulty = difficulty;
  }

  getInstructions(): string[] {
    return this.instructions;
  }

  getConfig(): RoundConfig {
    return {
      roundTime: DIFFICULTY_TIME_MAP[this.difficulty],
      instructions: this.instructions,
    };
  }

  render(): RenderResult {
    const boardSize = BOARD_SIZES[this.difficulty];
    const lines = createEmptyLines(boardSize);

    let xCol = Math.floor(Math.random() * boardSize);
    let xLine = Math.floor(Math.random() * boardSize);
    let cursorCol = Math.floor(Math.random() * boardSize);
    let cursorLine = Math.floor(Math.random() * boardSize);

    while (xLine === cursorLine || xCol === cursorCol) {
      xCol = Math.floor(Math.random() * boardSize);
      xLine = Math.floor(Math.random() * boardSize);
      cursorCol = Math.floor(Math.random() * boardSize);
      cursorLine = Math.floor(Math.random() * boardSize);
    }

    for (let r = 0; r < boardSize; r++) {
      let rowChars = "";
      for (let c = 0; c < boardSize; c++) {
        if (r === xLine && c === xCol) {
          rowChars += "x ";
        } else {
          rowChars += ". ";
        }
      }
      lines[r] = "  " + rowChars;
    }

    return {
      lines,
      cursorLine: cursorLine + 1,
      cursorCol: cursorCol * 2 + 2,
    };
  }

  checkForWin(lines: string[]): boolean {
    const hasX = lines.some((l) => l.includes("x"));
    return !hasX;
  }
}
