import type { Difficulty, GameRound, RenderResult, RoundConfig } from "../types/game";
import { DIFFICULTY_TIME_MAP, getRandomWord, createEmptyLines } from "../utils/gameUtils";

export class CiRound implements GameRound {
  id = "ci" as const;
  name = "ci{";
  difficulty: Difficulty;
  private isIfStatement = false;
  private targetWord = "";

  private instructions = [
    'Replace the content of the outer container, or the executable content of the if statement, with "bar"',
    "",
    "e.g.:",
    "if (foo) {             if (foo) {",
    "  qux          ->        bar",
    "}                      }",
    "",
    "[                          [",
    "   item1,                    bar",
    "   item1,             ->   ]",
    "]",
    "----------------------------------------------------------------------",
  ];

  constructor(difficulty: Difficulty) {
    this.difficulty = difficulty;
  }

  getInstructions(): string[] {
    return this.instructions;
  }

  getConfig(): RoundConfig {
    this.isIfStatement = Math.random() > 0.5;
    this.targetWord = getRandomWord();

    return {
      roundTime: DIFFICULTY_TIME_MAP[this.difficulty],
      instructions: this.instructions,
    };
  }

  render(): RenderResult {
    const gameLineCount = 18;
    const lines = createEmptyLines(gameLineCount);
    const insertionIndex = Math.floor(Math.random() * (gameLineCount - 7)) + 1;
    const goHigh = insertionIndex < gameLineCount / 2 && Math.random() > 0.5;

    let cursorIdx: number;
    if (goHigh) {
      cursorIdx = Math.floor(Math.random() * Math.floor(gameLineCount / 3)) + 1;
    } else {
      cursorIdx =
        Math.floor(Math.random() * (gameLineCount - insertionIndex - 5)) + insertionIndex + 5;
    }

    if (this.isIfStatement) {
      lines[insertionIndex] = `if (${this.targetWord}) {`;
      lines[insertionIndex + 1] = `    if (${getRandomWord()}) {`;
      lines[insertionIndex + 2] = `        ${getRandomWord()}`;
      lines[insertionIndex + 3] = `    }`;
      lines[insertionIndex + 4] = `}`;
    } else {
      lines[insertionIndex] = `[`;
      lines[insertionIndex + 1] = `    ${getRandomWord()},`;
      lines[insertionIndex + 2] = `    ${getRandomWord()},`;
      lines[insertionIndex + 3] = `    ${getRandomWord()},`;
      lines[insertionIndex + 4] = `]`;
    }

    return {
      lines,
      cursorLine: cursorIdx + 1,
      cursorCol: 0,
    };
  }

  checkForWin(lines: string[]): boolean {
    const cleanLines = lines.map((l) => l.trim()).filter((l) => l.length > 0);
    const concatenated = cleanLines.join("").toLowerCase();

    if (this.isIfStatement) {
      return (
        concatenated === `if(${this.targetWord}){bar}` ||
        concatenated === `if (${this.targetWord}) {bar}`
      );
    } else {
      return concatenated === `[bar]`;
    }
  }
}
