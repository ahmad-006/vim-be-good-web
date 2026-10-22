import type { Difficulty, GameRound, RenderResult, RoundConfig } from "../types/game";
import { DIFFICULTY_TIME_MAP, getRandomWord, createEmptyLines } from "../utils/gameUtils";

export class WordsRound implements GameRound {
  id = "words" as const;
  name = "words";
  difficulty: Difficulty;
  private expectedLine = "";

  private instructions = [
    "Use w, e, b and dw/daw to delete the different word in the line",
    "--------------------------------------------------------------",
  ];

  constructor(difficulty: Difficulty) {
    this.difficulty = difficulty;
  }

  getInstructions(): string[] {
    return this.instructions;
  }

  getConfig(): RoundConfig {
    const commonWord = getRandomWord();
    let intruderWord = getRandomWord();
    while (intruderWord === commonWord) {
      intruderWord = getRandomWord();
    }

    const words: string[] = [];
    const expected: string[] = [];
    const intruderIdx = Math.floor(Math.random() * 6);

    for (let i = 0; i < 6; i++) {
      if (i === intruderIdx) {
        words.push(intruderWord);
      } else {
        words.push(commonWord);
        expected.push(commonWord);
      }
    }

    this.expectedLine = expected.join(" ").toLowerCase();

    return {
      roundTime: DIFFICULTY_TIME_MAP[this.difficulty],
      instructions: this.instructions,
    };
  }

  render(): RenderResult {
    const lines = createEmptyLines(6);
    const commonWord = getRandomWord();
    let intruderWord = getRandomWord();
    while (intruderWord === commonWord) {
      intruderWord = getRandomWord();
    }

    const words: string[] = [];
    const expected: string[] = [];
    const intruderIdx = Math.floor(Math.random() * 6);

    for (let i = 0; i < 6; i++) {
      if (i === intruderIdx) {
        words.push(intruderWord);
      } else {
        words.push(commonWord);
        expected.push(commonWord);
      }
    }

    this.expectedLine = expected.join("").toLowerCase();
    lines[4] = words.join("   ");

    return {
      lines,
      cursorLine: 5,
      cursorCol: 0,
    };
  }

  checkForWin(lines: string[]): boolean {
    const activeText = lines
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .join("")
      .replace(/\s+/g, "")
      .toLowerCase();

    return activeText === this.expectedLine.replace(/\s+/g, "");
  }
}
