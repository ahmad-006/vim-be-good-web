import type { Difficulty, GameRound, RenderResult, RoundConfig } from "../types/game";
import { DIFFICULTY_TIME_MAP, getRandomSentence } from "../utils/gameUtils";

export class WhackAMoleRound implements GameRound {
  id = "whackamole" as const;
  name = "whackamole";
  difficulty: Difficulty;
  private winLine = "";

  private instructions = [
    "Use vim movements (f, t, w, e) to locate the character with the arrow under it.",
    'Then invert the character\'s case using "~" to win.',
    "--------------------------------------------------------------------------------",
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
    const sentence = getRandomSentence();
    const lines = ["", ""];
    lines[0] = sentence;

    let chosenIndex = 0;
    let found = false;
    let attempts = 0;
    while (!found && attempts++ < 500) {
      chosenIndex = Math.floor(Math.random() * sentence.length);
      if (/[a-zA-Z]/.test(sentence[chosenIndex])) {
        found = true;
      }
    }

    if (!found) {
      for (let i = 0; i < sentence.length; i++) {
        if (/[a-zA-Z]/.test(sentence[i])) {
          chosenIndex = i;
          found = true;
          break;
        }
      }
    }

    let pointerLine = "";
    let targetSentence = "";

    for (let i = 0; i < sentence.length; i++) {
      const ch = sentence[i];
      if (i === chosenIndex) {
        pointerLine += "^";
        targetSentence += ch === ch.toLowerCase() ? ch.toUpperCase() : ch.toLowerCase();
      } else {
        pointerLine += " ";
        targetSentence += ch;
      }
    }

    lines[1] = pointerLine;
    this.winLine = targetSentence;

    return {
      lines,
      cursorLine: 1,
      cursorCol: 0,
    };
  }

  checkForWin(lines: string[]): boolean {
    if (!lines[0]) return false;
    return lines[0].trim() === this.winLine.trim();
  }
}
