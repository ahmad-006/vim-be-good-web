import type { Difficulty, GameRound, RenderResult, RoundConfig } from "../types/game";
import { DIFFICULTY_TIME_MAP, createEmptyLines } from "../utils/gameUtils";

export class VisualBlockRound implements GameRound {
  id = "visual_block" as const;
  name = "visual_block";
  difficulty: Difficulty;

  private instructions = [
    'Use Visual Block (<C-v>) to comment out all 5 lines at once with "// "',
    'Tip: Press <C-v>, press 4j, press I, type "// ", then hit <Esc>',
    "------------------------------------------------------------------------",
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
    const lines = createEmptyLines(8);
    const codeSnippet = [
      "const port = 8080;",
      'const host = "0.0.0.0";',
      "const timeout = 5000;",
      "const verbose = false;",
      "const debug = true;",
    ];

    for (let i = 0; i < codeSnippet.length; i++) {
      lines[i + 1] = codeSnippet[i];
    }

    return {
      lines,
      cursorLine: 2,
      cursorCol: 0,
    };
  }

  checkForWin(lines: string[]): boolean {
    const activeLines = lines.filter((l) => l.trim().length > 0);
    if (activeLines.length !== 5) return false;

    const expectedKeys = ["port", "host", "timeout", "verbose", "debug"];
    const allCommented = activeLines.every((line) => line.trim().startsWith("//"));
    const keysPreserved = expectedKeys.every((key) =>
      activeLines.some((line) => line.includes(key)),
    );

    return allCommented && keysPreserved;
  }
}
