import type { Difficulty, GameRound, RenderResult, RoundConfig } from "../types/game";
import { DIFFICULTY_TIME_MAP, getRandomWord, createEmptyLines } from "../utils/gameUtils";

export class SurroundRound implements GameRound {
  id = "surround" as const;
  name = "surround";
  difficulty: Difficulty;
  private targetWord = "";

  private instructions = [
    'Delete the surrounding quotes from the target word using ds" or di"',
    "--------------------------------------------------------------------",
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
    const lines = createEmptyLines(6);
    this.targetWord = getRandomWord();

    lines[3] = `const result = "${this.targetWord}";`;

    return {
      lines,
      cursorLine: 4,
      cursorCol: 17,
    };
  }

  checkForWin(lines: string[]): boolean {
    const codeLine = lines.find((l) => l.includes("const result ="));
    if (!codeLine) return false;

    return (
      codeLine.includes(`const result = ${this.targetWord};`) ||
      codeLine.includes(`const result = ${this.targetWord}`) ||
      (codeLine.includes(this.targetWord) && !codeLine.includes(`"${this.targetWord}"`))
    );
  }
}
