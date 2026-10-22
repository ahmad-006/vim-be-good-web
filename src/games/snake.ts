import type { Difficulty, GameRound, RenderResult, RoundConfig } from "../types/game";

interface Coord {
  x: number;
  y: number;
}

const SPEED_MAP: Record<Difficulty, number> = {
  noob: 160,
  easy: 135,
  medium: 110,
  hard: 90,
  nightmare: 70,
  tpope: 45,
};

export class SnakeRound implements GameRound {
  id = "snake" as const;
  name = "snake";
  difficulty: Difficulty;

  // Square arena: 42 columns x 16 rows (approx 1:1 visual aspect ratio in monospace, fits 720p+ perfectly)
  private width = 42;
  private height = 16;

  private snake: Coord[] = [];
  private dir: Coord = { x: 1, y: 0 };
  private nextDir: Coord = { x: 1, y: 0 };
  private food: Coord = { x: 30, y: 8 };

  private score = 0;
  private speed: number;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private deathTimerId: ReturnType<typeof setTimeout> | null = null;
  private isDead = false;

  private onUpdateCallback: ((lines: string[]) => void) | null = null;
  private onEndCallback: ((success: boolean) => void) | null = null;

  private instructions = [
    "Classic Continuous Snake inside Neovim buffer (Wrap-around edges).",
    "Steer with h, j, k, l or Arrows • Eat food (O) to grow • Don't bite yourself!",
    "----------------------------------------------------------------------",
  ];

  constructor(difficulty: Difficulty) {
    this.difficulty = difficulty;
    this.speed = SPEED_MAP[difficulty] || 120;
    this.initSnake();
  }

  private initSnake() {
    const startY = Math.floor(this.height / 2);
    const startX = Math.floor(this.width / 4);
    this.snake = [
      { x: startX + 3, y: startY }, // head
      { x: startX + 2, y: startY },
      { x: startX + 1, y: startY },
      { x: startX, y: startY }, // tail
    ];
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.score = 0;
    this.isDead = false;
    this.spawnFood();
  }

  private spawnFood() {
    let valid = false;
    let attempts = 0;
    while (!valid && attempts < 200) {
      attempts++;
      const fx = Math.floor(Math.random() * this.width);
      const fy = Math.floor(Math.random() * this.height);

      const collidesWithSnake = this.snake.some((s) => s.x === fx && s.y === fy);
      if (!collidesWithSnake) {
        this.food = { x: fx, y: fy };
        valid = true;
      }
    }
  }

  getScore(): number {
    return this.score;
  }

  getInstructions(): string[] {
    return this.instructions;
  }

  getConfig(): RoundConfig {
    return {
      roundTime: 0, // 0 = continuous/infinite arcade session
      instructions: this.instructions,
      noCursor: true,
      canEndRound: true,
      isContinuous: true,
    };
  }

  handleKey(key: string) {
    const k = key.toLowerCase();
    if ((k === "h" || k === "arrowleft" || k === "<left>") && this.dir.x === 0) {
      this.nextDir = { x: -1, y: 0 };
    } else if ((k === "l" || k === "arrowright" || k === "<right>") && this.dir.x === 0) {
      this.nextDir = { x: 1, y: 0 };
    } else if ((k === "k" || k === "arrowup" || k === "<up>") && this.dir.y === 0) {
      this.nextDir = { x: 0, y: -1 };
    } else if ((k === "j" || k === "arrowdown" || k === "<down>") && this.dir.y === 0) {
      this.nextDir = { x: 0, y: 1 };
    }
  }

  private drawGrid(): string[] {
    const lines: string[] = [];

    // Top border
    lines.push("+" + "-".repeat(this.width) + "+");

    for (let y = 0; y < this.height; y++) {
      let row = "";
      for (let x = 0; x < this.width; x++) {
        if (this.snake.length > 0 && this.snake[0].x === x && this.snake[0].y === y) {
          row += this.isDead ? "X" : "@"; // Head
        } else if (this.snake.slice(1).some((s) => s.x === x && s.y === y)) {
          row += "#"; // Body
        } else if (this.food.x === x && this.food.y === y) {
          row += "O"; // Food
        } else {
          row += " ";
        }
      }
      lines.push("|" + row + "|");
    }

    // Bottom border
    lines.push("+" + "-".repeat(this.width) + "+");

    // Status / HUD
    const dirStr =
      this.dir.x === 1 ? "RIGHT" : this.dir.x === -1 ? "LEFT" : this.dir.y === 1 ? "DOWN" : "UP";
    lines.push(
      `Score: ${this.score * 10} | Foods: ${this.score} | Length: ${this.snake.length} | Edges: Wrap | Dir: ${dirStr} | Speed: ${this.speed}ms`,
    );

    return lines;
  }

  render(): RenderResult {
    return {
      lines: this.drawGrid(),
      cursorLine: 0,
      cursorCol: 0,
    };
  }

  start(onUpdate: (canvasLines: string[]) => void, onEnd: (success: boolean) => void) {
    this.cleanup();
    this.onUpdateCallback = onUpdate;
    this.onEndCallback = onEnd;

    this.intervalId = setInterval(() => {
      this.tick();
    }, this.speed);
  }

  private tick() {
    if (this.isDead) return;

    this.dir = this.nextDir;
    const head = this.snake[0];

    // Continuous toroidal wrap-around on edges
    const newHead: Coord = {
      x: (((head.x + this.dir.x) % this.width) + this.width) % this.width,
      y: (((head.y + this.dir.y) % this.height) + this.height) % this.height,
    };

    // Check Self Collision (Lethal!)
    if (this.snake.some((s) => s.x === newHead.x && s.y === newHead.y)) {
      this.handleDeath();
      return;
    }

    // Check Food Collision
    const ateFood = newHead.x === this.food.x && newHead.y === this.food.y;
    this.snake.unshift(newHead);

    if (ateFood) {
      // Grows by 1: do not pop tail!
      this.score += 1;
      this.spawnFood();
    } else {
      // Normal motion: pop tail to keep same length
      this.snake.pop();
    }

    this.onUpdateCallback?.(this.drawGrid());
  }

  private handleDeath() {
    this.isDead = true;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.onUpdateCallback?.(this.drawGrid());

    if (this.deathTimerId) {
      clearTimeout(this.deathTimerId);
    }
    this.deathTimerId = setTimeout(() => {
      this.deathTimerId = null;
      this.onEndCallback?.(false); // Fail / game over session
    }, 1200);
  }

  cleanup() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.deathTimerId) {
      clearTimeout(this.deathTimerId);
      this.deathTimerId = null;
    }
    this.onUpdateCallback = null;
    this.onEndCallback = null;
  }

  checkForWin(_lines: string[]): boolean {
    return false; // Handled dynamically via start() loop
  }
}
