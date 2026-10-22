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

const TARGET_FOODS_MAP: Record<Difficulty, number> = {
  noob: 3,
  easy: 3,
  medium: 4,
  hard: 4,
  nightmare: 5,
  tpope: 5,
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
  private targetFoods: number;
  private speed: number;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isDead = false;

  private onUpdateCallback: ((lines: string[]) => void) | null = null;
  private onEndCallback: ((success: boolean) => void) | null = null;

  private instructions = [
    "Classic Snake inside Neovim buffer. Edges are continuous (wrap-around)!",
    "Steer with h, j, k, l or Arrows • Eat food (O) to reach target score",
    "----------------------------------------------------------------------",
  ];

  constructor(difficulty: Difficulty) {
    this.difficulty = difficulty;
    this.speed = SPEED_MAP[difficulty] || 120;
    this.targetFoods = TARGET_FOODS_MAP[difficulty] || 4;
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

  getInstructions(): string[] {
    return this.instructions;
  }

  getConfig(): RoundConfig {
    return {
      roundTime: 60000,
      instructions: this.instructions,
      noCursor: true,
      canEndRound: true,
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
      `Score: ${this.score * 10} | Target: ${this.targetFoods * 10} | Foods: ${this.score}/${this.targetFoods} | Edges: Wrap | Dir: ${dirStr} | Speed: ${this.speed}ms`,
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

    // Check Self Collision
    if (this.snake.some((s) => s.x === newHead.x && s.y === newHead.y)) {
      this.handleDeath();
      return;
    }

    // Check Food Collision
    const ateFood = newHead.x === this.food.x && newHead.y === this.food.y;
    this.snake.unshift(newHead);

    if (ateFood) {
      this.score += 1;
      if (this.score >= this.targetFoods) {
        this.cleanup();
        this.onUpdateCallback?.(this.drawGrid());
        this.onEndCallback?.(true); // Victory!
        return;
      }
      this.spawnFood();
    } else {
      this.snake.pop(); // Remove tail
    }

    this.onUpdateCallback?.(this.drawGrid());
  }

  private handleDeath() {
    this.isDead = true;
    this.cleanup();
    this.onUpdateCallback?.(this.drawGrid());
    setTimeout(() => {
      this.onEndCallback?.(false); // Fail round
    }, 1200);
  }

  cleanup() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  checkForWin(_lines: string[]): boolean {
    return false; // Handled dynamically via start() loop
  }
}
