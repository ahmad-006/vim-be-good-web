import type { Difficulty, GameId } from "../types/game";

export const GAME_OPTIONS: { id: GameId; label: string }[] = [
  { id: "relative", label: "relative" },
  { id: "ci", label: "ci{" },
  { id: "words", label: "words" },
  { id: "hjkl", label: "hjkl" },
  { id: "whackamole", label: "whackamole" },
  { id: "snake", label: "snake" },
  { id: "visual_block", label: "visual_block" },
  { id: "surround", label: "surround" },
  { id: "random", label: "random" },
];

export const DIFFICULTY_OPTIONS: Difficulty[] = [
  "noob",
  "easy",
  "medium",
  "hard",
  "nightmare",
  "tpope",
];

export class MenuEngine {
  private selectedGame: GameId = "relative";
  private selectedDifficulty: Difficulty = "easy";

  constructor(initialGame: GameId = "relative", initialDifficulty: Difficulty = "easy") {
    this.selectedGame = initialGame;
    this.selectedDifficulty = initialDifficulty;
  }

  getSelection() {
    return {
      game: this.selectedGame,
      difficulty: this.selectedDifficulty,
    };
  }

  setDifficulty(d: Difficulty) {
    this.selectedDifficulty = d;
  }

  setGame(g: GameId) {
    this.selectedGame = g;
  }

  renderMenuLines(): string[] {
    const lines: string[] = [
      "VimBeGood is a collection of small games for Neovim which are",
      "intended to help you improve your vim proficiency.",
      'Delete a line to select it (hit "dd"). If you delete a difficulty,',
      "it will select that difficulty. If you delete a game, it starts the game!",
      "",
      "Select a Game (delete from the list to select)",
      "----------------------------------------------",
    ];

    for (const g of GAME_OPTIONS) {
      const check = this.selectedGame === g.id ? "[x]" : "[ ]";
      lines.push(`${check} ${g.label}`);
    }

    lines.push("");
    lines.push("Select a Difficulty (delete from the list to select)");
    lines.push("Noob difficulty is endless so it must be quit with :q");
    lines.push("----------------------------------------------------");

    for (const d of DIFFICULTY_OPTIONS) {
      const check = this.selectedDifficulty === d ? "[x]" : "[ ]";
      lines.push(`${check} ${d}`);
    }

    lines.push("");
    lines.push("");
    lines.push("Created by ThePrimeagen");
    lines.push("Brandoncc & polarmutex");
    lines.push("Web Port by Ahmad Aamir");
    lines.push("https://github.com/ahmad-006/vim-be-good-web");

    return lines;
  }

  handleMenuChange(currentLines: string[]): {
    action: "start" | "difficulty_changed" | "rerender" | "none";
    game?: GameId;
    difficulty?: Difficulty;
  } {
    const expected = this.renderMenuLines();

    if (currentLines.length === expected.length) {
      return { action: "none" };
    }

    const missingLine = expected.find((line) => !currentLines.includes(line));

    if (!missingLine) {
      return { action: "rerender" };
    }

    for (const g of GAME_OPTIONS) {
      if (missingLine.includes(g.label)) {
        this.selectedGame = g.id;
        return {
          action: "start",
          game: g.id,
          difficulty: this.selectedDifficulty,
        };
      }
    }

    for (const d of DIFFICULTY_OPTIONS) {
      if (missingLine.includes(d)) {
        this.selectedDifficulty = d;
        return {
          action: "difficulty_changed",
          difficulty: d,
        };
      }
    }

    return { action: "rerender" };
  }
}
