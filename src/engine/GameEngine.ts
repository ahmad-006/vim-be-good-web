import type { Difficulty, GameId, GameRound, GameSummary, RoundRecord } from "../types/game";
import { RelativeRound } from "../games/relative";
import { CiRound } from "../games/ci";
import { WordsRound } from "../games/words";
import { HjklRound } from "../games/hjkl";
import { WhackAMoleRound } from "../games/whackamole";
import { SnakeRound } from "../games/snake";
import { VisualBlockRound } from "../games/visualBlock";
import { SurroundRound } from "../games/surround";
import { sound } from "../utils/audio";

export class GameEngine {
  public gameId: GameId;
  public difficulty: Difficulty;
  public totalRounds: number;
  public currentRound = 1;
  public activeRound: GameRound | null = null;
  public currentInstructions: string[] = [];
  public currentCanvasLines: string[] = [];
  public isDestroyed = false;

  private timerId: ReturnType<typeof setTimeout> | null = null;
  private countdownTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private roundStartTime = 0;
  private records: RoundRecord[] = [];
  private successes = 0;
  private failures = 0;
  private timings: number[] = [];

  private onRenderBuffer: (fullText: string, cursorLine: number, cursorCol?: number) => void;
  private onRoundAdvance: (roundNum: number, total: number, noCursor?: boolean) => void;
  private onGameOver: (summary: GameSummary) => void;

  constructor(
    gameId: GameId,
    difficulty: Difficulty,
    callbacks: {
      onRenderBuffer: (fullText: string, cursorLine: number, cursorCol?: number) => void;
      onRoundAdvance: (roundNum: number, total: number, noCursor?: boolean) => void;
      onGameOver: (summary: GameSummary) => void;
    },
  ) {
    this.gameId = gameId;
    this.difficulty = difficulty;
    this.totalRounds = gameId === "snake" ? 1 : difficulty === "noob" ? 100000 : 10;
    this.onRenderBuffer = callbacks.onRenderBuffer;
    this.onRoundAdvance = callbacks.onRoundAdvance;
    this.onGameOver = callbacks.onGameOver;
  }

  private createRoundInstance(id: GameId): GameRound {
    let resolvedId = id;
    if (resolvedId === "random") {
      const pool: GameId[] = [
        "relative",
        "ci",
        "words",
        "hjkl",
        "whackamole",
        "visual_block",
        "surround",
        "snake",
      ];
      resolvedId = pool[Math.floor(Math.random() * pool.length)];
    }

    switch (resolvedId) {
      case "relative":
        return new RelativeRound(this.difficulty);
      case "ci":
        return new CiRound(this.difficulty);
      case "words":
        return new WordsRound(this.difficulty);
      case "hjkl":
        return new HjklRound(this.difficulty);
      case "whackamole":
        return new WhackAMoleRound(this.difficulty);
      case "snake":
        return new SnakeRound(this.difficulty);
      case "visual_block":
        return new VisualBlockRound(this.difficulty);
      case "surround":
        return new SurroundRound(this.difficulty);
      default:
        return new RelativeRound(this.difficulty);
    }
  }

  startCountdown(onComplete: () => void) {
    if (this.isDestroyed) return;
    this.clearCountdown();
    let count = 3;
    sound.playCountdown(count);

    const step = () => {
      if (this.isDestroyed) return;
      if (count > 0) {
        const text = `\n\n\n             Game Starts in ${count}...\n\n`;
        this.onRenderBuffer(text, 4, 13);
        sound.playCountdown(count);
        count--;
        this.countdownTimeoutId = setTimeout(step, 1000);
      } else {
        sound.playCountdown(0);
        this.countdownTimeoutId = null;
        if (!this.isDestroyed) {
          onComplete();
        }
      }
    };

    step();
  }

  startRound() {
    if (this.isDestroyed) return;
    this.clearTimer();
    this.activeRound = this.createRoundInstance(this.gameId);
    const config = this.activeRound.getConfig();
    const render = this.activeRound.render();

    this.currentInstructions = this.activeRound.getInstructions();
    this.currentCanvasLines = render.lines;

    const headerLines =
      config.isContinuous || this.gameId === "snake"
        ? [`=== [VimBeGood] Snake Arcade ===`, ...this.currentInstructions, ""]
        : [
            `=== [VimBeGood] Round ${this.currentRound} / ${this.totalRounds} ===`,
            ...this.currentInstructions,
            "",
          ];

    const fullLines = [...headerLines, ...this.currentCanvasLines];
    const fullText = fullLines.join("\n");

    const targetCursorLine = headerLines.length + render.cursorLine;
    this.onRenderBuffer(fullText, targetCursorLine, render.cursorCol || 0);

    this.onRoundAdvance(this.currentRound, this.totalRounds, !!config.noCursor);
    this.roundStartTime = performance.now();

    // Start continuous tick loop if supported (e.g. Snake)
    if (this.activeRound.start) {
      this.activeRound.start(
        (canvasLines) => {
          this.currentCanvasLines = canvasLines;
          const updatedFull = [...headerLines, ...canvasLines].join("\n");
          this.onRenderBuffer(updatedFull, targetCursorLine, render.cursorCol || 0);
        },
        (success) => {
          this.handleRoundFinish(success);
        },
      );
    }

    if (config.roundTime > 0) {
      this.timerId = setTimeout(() => {
        this.handleRoundFinish(false);
      }, config.roundTime);
    }
  }

  handleKeypress(key: string) {
    this.activeRound?.handleKey?.(key);
  }

  handleBufferChange(fullText: string) {
    if (!this.activeRound) return;

    const allLines = fullText.split("\n");
    const headerCount = this.currentInstructions.length + 2;
    const canvasLines = allLines.slice(headerCount);

    if (this.activeRound.checkForWin(canvasLines)) {
      this.handleRoundFinish(true);
    }
  }

  private handleRoundFinish(success: boolean) {
    if (this.isDestroyed) return;
    this.clearTimer();
    const duration = Math.max(0.1, (performance.now() - this.roundStartTime) / 1000);

    if (success) {
      sound.playRoundWin();
      this.successes++;
    } else {
      sound.playRoundFail();
      this.failures++;
    }

    this.timings.push(duration);
    const roundScore = (this.activeRound as { getScore?: () => number })?.getScore?.();
    this.records.push({
      roundNum: this.currentRound,
      gameId: this.activeRound?.name || this.gameId,
      difficulty: this.difficulty,
      success,
      timeTaken: duration,
      timestamp: Date.now(),
      score: roundScore !== undefined ? roundScore : undefined,
    });

    if (this.currentRound >= this.totalRounds) {
      this.endGame();
    } else {
      this.currentRound++;
      this.startRound();
    }
  }

  private endGame() {
    if (this.isDestroyed) return;
    this.clearTimer();
    const sum = this.timings.reduce((acc, curr) => acc + curr, 0);
    const average = this.timings.length > 0 ? sum / this.timings.length : 0;
    const totalScore = this.records.reduce((acc, r) => acc + (r.score ? r.score * 10 : 0), 0);

    const summary: GameSummary = {
      difficulty: this.difficulty,
      gameId: this.gameId,
      successes: this.successes,
      failures: this.failures,
      roundCount: this.totalRounds,
      timings: this.timings,
      averageTime: parseFloat(average.toFixed(2)),
      records: this.records,
      totalScore: this.gameId === "snake" ? totalScore : undefined,
    };

    if (!this.isDestroyed) {
      this.onGameOver(summary);
    }
  }

  getEndGameLines(summary: GameSummary): string[] {
    if (summary.gameId === "snake") {
      const foodsEaten = summary.records[0]?.score || 0;
      const scorePoints = foodsEaten * 10;
      return [
        `=== [VimBeGood] Snake Game Over ===`,
        "",
        `Final Score: ${scorePoints} points (${foodsEaten} foods eaten)`,
        `Time Survived: ${summary.averageTime}s (${summary.difficulty} speed)`,
        "",
        'Where do you want to go next? (Delete Line with "dd")',
        "---------------------------------------------------",
        "Menu",
        "Replay",
        "Quit (or just ZZ like a real man)",
      ];
    }

    return [
      `=== [VimBeGood] Game Over ===`,
      "",
      `${summary.successes} / ${summary.roundCount} completed successfully`,
      `Average: ${summary.averageTime}s per round`,
      `Game Mode: ${summary.gameId} (${summary.difficulty})`,
      "",
      "",
      'Where do you want to go next? (Delete Line with "dd")',
      "---------------------------------------------------",
      "Menu",
      "Replay",
      "Quit (or just ZZ like a real man)",
    ];
  }

  clearCountdown() {
    if (this.countdownTimeoutId) {
      clearTimeout(this.countdownTimeoutId);
      this.countdownTimeoutId = null;
    }
  }

  clearTimer() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.clearCountdown();
    this.activeRound?.cleanup?.();
  }

  destroy() {
    this.isDestroyed = true;
    this.clearTimer();
    this.activeRound = null;
  }
}
