import type { Difficulty, GameRound, RenderResult, RoundConfig } from "../types/game";
import { DIFFICULTY_TIME_MAP, createEmptyLines } from "../utils/gameUtils";

export class RelativeRound implements GameRound {
  id = "relative" as const;
  name = "relative";
  difficulty: Difficulty;

  private instructions = [
    "Test your ability to hop by relative line numbers",
    'To win the game, delete the line that says "DELETE_ME"',
    "-------------------------------------------------------",
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
    const totalLines = 20;
    const lines = createEmptyLines(totalLines);
    const deleteMeIdx = Math.floor(Math.random() * totalLines);
    const goHigh = deleteMeIdx < 16 && Math.random() > 0.5;

    let cursorIdx: number;
    if (goHigh) {
      cursorIdx = Math.floor(Math.random() * (totalLines - deleteMeIdx - 1)) + deleteMeIdx + 1;
    } else {
      cursorIdx = Math.max(0, Math.floor(Math.random() * Math.max(1, deleteMeIdx)));
    }

    lines[deleteMeIdx] = " DELETE_ME";

    return {
      lines,
      cursorLine: cursorIdx + 1,
      cursorCol: 0,
    };
  }

  checkForWin(lines: string[]): boolean {
    const found = lines.some((line) => line.includes("DELETE_ME"));
    return !found;
  }
}
