import type { Difficulty, GameRound, RenderResult, RoundConfig } from "../types/game";

export class SnakeRound implements GameRound {
  id = "snake" as const;
  name = "snake";
  difficulty: Difficulty;

  private instructions = [
    "Classic game of Snake inside Neovim buffer.",
    "1. Use h, j, k, l to navigate (h: left, j: down, k: up, l: right)",
    "2. Eat food (O) to grow and earn points",
    "3. Do not crash into yourself or the border walls",
    "------------------------------------------------------------------",
  ];

  constructor(difficulty: Difficulty) {
    this.difficulty = difficulty;
  }

  getInstructions(): string[] {
    return this.instructions;
  }

  getConfig(): RoundConfig {
    return {
      roundTime: 120000, // 2 minutes endurance
      instructions: this.instructions,
      noCursor: true,
      canEndRound: true,
    };
  }

  render(): RenderResult {
    const width = 30;
    const height = 12;
    const lines: string[] = [];

    // Draw top border
    lines.push("+" + "-".repeat(width) + "+");

    // Draw grid rows
    for (let r = 0; r < height; r++) {
      if (r === Math.floor(height / 2)) {
        // Initial snake in the middle
        const row = " ".repeat(10) + "###@" + " ".repeat(width - 14);
        lines.push("|" + row + "|");
      } else if (r === 2) {
        // Initial food
        const row = " ".repeat(22) + "O" + " ".repeat(width - 23);
        lines.push("|" + row + "|");
      } else {
        lines.push("|" + " ".repeat(width) + "|");
      }
    }

    // Draw bottom border
    lines.push("+" + "-".repeat(width) + "+");
    lines.push("");
    lines.push("Score: 0 | Speed: 100% | Use h/j/k/l to steer");

    return {
      lines,
      cursorLine: 6,
      cursorCol: 15,
    };
  }

  checkForWin(_lines: string[]): boolean {
    return false; // Snake is survival mode
  }
}
