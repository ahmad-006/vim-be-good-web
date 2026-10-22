# Project Specification: VimBeGood Web (`vim-be-good-web`)

## 1. Executive Summary & Vision

`vim-be-good-web` is a high-fidelity web recreation and expansion of [ThePrimeagen's `vim-be-good`](https://github.com/ThePrimeagen/vim-be-good) Neovim plugin. Built on top of **Vite+** (`vp`), **React 19**, **TypeScript**, and **CodeMirror 6 with `@replit/codemirror-vim`**, it delivers an authentic Neovim experience directly inside the browser with 0ms installation friction.

The UI is modeled directly after a Neovim floating window and statusline, replicating ThePrimeagen's signature **deletion-driven menu** (`dd` to select difficulty or game), round scheduling, timing penalties, and game modes, while introducing new web-first capabilities (keystroke visualizer HUD, zero-asset mechanical audio synthesizer, CRT scanline aesthetics, theme switches, and new advanced motion modes).

---

## 2. Technical Stack & Toolchain

- **Build Toolchain:** [Vite+ (`vite-plus` / `vp`)](https://viteplus.dev/) v1.3.0
- **Runtime & Package Manager:** Bun 1.4+
- **Frontend Framework:** React 19 (TypeScript 6+)
- **Styling & CSS:** Tailwind CSS v4 (`@tailwindcss/vite`)
- **Vim Modal Engine:** CodeMirror 6 (`@codemirror/view`, `@codemirror/state`) + `@replit/codemirror-vim`
- **Audio Synthesizer:** Zero-asset procedural Web Audio API (mechanical switch bottom-out thocks, switch leaf clicks, countdown beeps, victory fanfare)
- **Confetti & Effects:** `canvas-confetti` + CRT phosphor scanline shaders
- **Icons:** `lucide-react`
- **Repository:** `https://github.com/ahmad-006/vim-be-good-web.git`

---

## 3. Architecture & Functional Requirements (FRD)

### FR-01: Authentic Neovim Floating Window UI

- The application viewport renders as a full-screen terminal (customizable themes: Catppuccin Mocha, Tokyo Night, Gruvbox Dark, Rose Pine, Retro CRT Green).
- Centered Neovim floating window with authentic unicode borders (`╭─╮│╰─╯` or `┌─┐│└─┘`), customizable padding, and title label `[VimBeGood]`.
- Neovim statusline at the bottom of the editor displaying:
  - Left: Buffer name (`[VimBeGood]`), modification flag `[+]`, encoding `[utf-8]`.
  - Center: Active game title & difficulty badge.
  - Right: Cursor coordinates (`Ln X, Col Y`), buffer progress (`All`, `Top`, `Bot`, `XX%`).
  - Command / Mode line: `-- NORMAL --`, `-- INSERT --`, `-- VISUAL --`, `-- VISUAL LINE --`, or active command `:`.

### FR-02: Deletion-Driven Menu Navigation (`menu.lua` Parity)

- The menu does NOT rely on mouse clicks or arrow button menus.
- In true Primeagen fashion, the menu text renders directly in the buffer.
- **Selection Mechanism:** The user navigates with standard Vim motions (`j`, `k`, `14j`, etc.) and presses `dd` to delete a line:
  - Deleting a **Difficulty** option updates the selection and immediately re-renders the menu with `[x]` checked.
  - Deleting a **Game** option immediately locks the selection, initiates the 3-second countdown, and starts the game.
  - Deleting an instruction or header line triggers a clean re-render.

### FR-03: Reactive Buffer Change Engine (`buffer.lua` Parity)

- Listens to CodeMirror document changes (`docChanged` event, equivalent to Neovim's `nvim_buf_attach` with `on_lines`).
- Isolates header instructions from active canvas game lines.
- Evaluates `checkForWin(lines)` on every buffer mutation:
  - On victory: Stops the timer, plays victory chime, logs telemetry, triggers `stopinsert`, and advances to next round.
  - On timeout: Plays failure thud, counts round as failure, and advances.

### FR-04: Game Modes (100% Primeagen Parity + Expansions)

1. **`relative`** (Relative Line Hopping):
   - Targets: `14j`, `8k`, `dd`.
   - Spawns 20 lines with `DELETE_ME` placed randomly and cursor positioned high/low to mandate relative jumping.
2. **`ci{`** (Change Inside Text Objects):
   - Targets: `ci{`, `ci(`, `ci[`.
   - Spawns nested `if` statements or array blocks; user must replace inner contents with `"bar"`.
3. **`words`** (Word Motions & Deletion):
   - Targets: `w`, `e`, `b`, `dw`, `daw`.
   - Spawns 6 words where 5 are identical and 1 is an intruder (e.g. `car car car bar car car`). User must remove the odd word.
4. **`hjkl`** (Pure Directional Precision):
   - Targets: `h`, `j`, `k`, `l`, `x`.
   - Generates an $N \times N$ matrix of dots with a single `x`. Cursor is guaranteed not to share a row or column.
5. **`whackamole`** (Character Seeking & Case Toggling):
   - Targets: `f<char>`, `t<char>`, `~`.
   - Renders Primeagen meme sentences with a `^` pointer underneath a character. User must seek and invert case (`~`).
6. **`snake`** (Arcade Buffer Snake):
   - Real-time game tick loop inside the Neovim buffer.
   - Steer snake (`@###`) using `h`, `j`, `k`, `l` or arrow keys.
   - **Continuous Wrap-around Edges:** Toroidal wrap mechanics (traversing past any edge seamlessly wraps to the opposite side). Self-collision remains lethal.
   - **Optimized Square Arena:** 42-column by 16-row grid ($~1:1$ visual pixel aspect ratio in monospace), fits perfectly in 720p+ viewports without scrolling.
   - **Cursor Suppression:** CodeMirror text cursor and active line highlights are suppressed in arcade mode (`noCursor: true`), with statusline displaying `ARCADE`.
7. **`visual-block`** _(New Web Exclusive)_:
   - Targets: `<C-v>`, `I`, `// `, `<Esc>`.
   - Multi-line code block where user must comment out 5 lines simultaneously using visual block insertion.
8. **`surround`** _(New Web Exclusive)_:
   - Targets: `ysiw"`, `cs"'`, `ds"`.
   - Practice vim-surround idioms on words and variables.
9. **`random`**:
   - Cycles dynamically through all available game modes across the round set.

### FR-05: Difficulty & Timing Scaling (`game-utils.lua` Parity)

| Difficulty    | Round Timeout     | Board Size / Behavior             |
| :------------ | :---------------- | :-------------------------------- |
| **noob**      | 100,000 ms (100s) | Endless rounds (100,000 rounds)   |
| **easy**      | 10,000 ms (10s)   | Standard spacing                  |
| **medium**    | 8,000 ms (8s)     | Moderate spacing                  |
| **hard**      | 6,000 ms (6s)     | Tight spacing, lethal snake walls |
| **nightmare** | 4,000 ms (4s)     | High speed                        |
| **tpope**     | 2,000 ms (2s)     | Instant reflexes required         |

### FR-06: Interactive End-of-Game Screen (`game-runner.lua` Parity)

- Displays statistics: Total completed (`X / Y completed successfully`), average time in seconds (`Average 2.45s`), and game type.
- Prompts:
  ```
  Where do you want to go next? (Delete Line)
  Menu
  Replay
  Quit (or just ZZ like a real man)
  ```
- Deleting `Menu` navigates to the main menu.
- Deleting `Replay` restarts the game with the same settings.
- Deleting `Quit` exits to a terminal splash screen.

### FR-07: Web Enhancements & Telemetry

- **Keystroke HUD:** Subdued floating badge strip displaying live keys pressed (e.g. `1 4 j d d`), current KPS, and optimal vs actual keystrokes.
- **Mechanical Audio Synthesizer:** Real-time switch sound feedback with zero external assets.
- **Customization Drawer:** CRT scanline toggle, sound toggle, theme selector.
- **Social Sharing Card:** Copy formatted markdown result for Twitter / LinkedIn / Discord.

---

## 4. Project Directory Structure

```
vim-be-good-web/
├── .vite-hooks/           # Vite+ pre-commit hooks
├── public/                # Static assets & favicons
├── src/
│   ├── assets/            # Theme assets & logos
│   ├── components/        # UI & Terminal components
│   │   ├── NeovimWindow.tsx   # Floating window & statusline wrapper
│   │   ├── KeystrokeHUD.tsx   # Live keypress visualization badge
│   │   ├── TerminalHeader.tsx # Traffic light buttons & controls
│   │   └── StatsSummary.tsx   # Round results & performance summary
│   ├── engine/            # State machine & game coordinator
│   │   ├── GameEngine.ts      # Main game loop, timers, win dispatching
│   │   └── MenuEngine.ts      # Deletion-driven menu state logic
│   ├── games/             # Game round implementations
│   │   ├── relative.ts        # Relative line jumping
│   │   ├── ci.ts              # Change inside text objects
│   │   ├── words.ts           # Word hopping & odd word deletion
│   │   ├── hjkl.ts            # Directional grid navigation
│   │   ├── whackamole.ts      # Target seek & case toggle
│   │   ├── snake.ts           # Neovim buffer snake arcade
│   │   ├── visualBlock.ts     # Visual block multi-line comment
│   │   └── surround.ts        # Quote and bracket surround
│   ├── types/
│   │   └── game.ts            # Core TypeScript interfaces & types
│   ├── utils/
│   │   ├── audio.ts           # Web Audio API mechanical switch synthesizer
│   │   ├── gameUtils.ts       # Sentence banks, word generators, timings
│   │   └── themes.ts          # Terminal color palettes (Catppuccin, Tokyo Night, etc.)
│   ├── App.tsx            # Main application root
│   ├── index.css          # Tailwind CSS v4 & custom typography
│   └── main.tsx           # React DOM mount point
├── AGENTS.md              # Coding agent context instructions
├── GEMINI.md              # Project FRD & architecture blueprint (this document)
├── package.json           # Vite+ scripts & dependencies
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite+ configuration with lazyPlugins
```

---

## 5. Development & Build Commands

- `vp dev`: Start local development server with instant HMR
- `vp build`: Compile optimized production bundle using Rolldown/Vite+
- `vp check`: Run unified Oxlint, type-checking, and formatting validation
- `vp check --fix`: Auto-format and resolve all fixable issues
- `vp test`: Run Vitest test suites
