import { useState, useRef, useEffect, useCallback } from "react";
import { MenuEngine } from "./engine/MenuEngine";
import { GameEngine } from "./engine/GameEngine";
import type { EngineState, GameId, Difficulty, GameSummary, ThemeName } from "./types/game";
import { THEMES } from "./utils/themes";
import { sound } from "./utils/audio";
import { TerminalHeader } from "./components/TerminalHeader";
import { NeovimWindow } from "./components/NeovimWindow";
import { KeystrokeHUD } from "./components/KeystrokeHUD";
import { StatsModal } from "./components/StatsModal";

const STORAGE_KEYS = {
  THEME: "vbg_theme",
  SOUND: "vbg_sound",
  SCANLINES: "vbg_scanlines",
} as const;

function getInitialTheme(): ThemeName {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME) as ThemeName | null;
    if (saved && saved in THEMES) return saved;
  } catch {}
  return "catppuccin";
}

function getInitialSound(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SOUND);
    if (saved !== null) return saved === "true";
  } catch {}
  return true;
}

function getInitialScanlines(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SCANLINES);
    if (saved !== null) return saved === "true";
  } catch {}
  return false;
}

export function App() {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(getInitialTheme);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(getInitialSound);
  const [scanlinesEnabled, setScanlinesEnabled] = useState<boolean>(getInitialScanlines);

  const [engineState, setEngineState] = useState<EngineState>("menu");
  const [menuEngine] = useState(() => new MenuEngine("relative", "easy"));
  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);

  const [bufferContent, setBufferContent] = useState<string>(() =>
    menuEngine.renderMenuLines().join("\n"),
  );
  const [targetCursor, setTargetCursor] = useState<{ line: number; col?: number }>({
    line: 8,
    col: 4,
  });

  const [roundInfo, setRoundInfo] = useState<{
    gameId: string;
    difficulty: string;
    currentRound?: number;
    totalRounds?: number;
    noCursor?: boolean;
  }>({ gameId: "words", difficulty: "easy", noCursor: false });

  const [summary, setSummary] = useState<GameSummary | null>(null);

  const [keystrokes, setKeystrokes] = useState<string[]>([]);
  const [totalKeys, setTotalKeys] = useState(0);
  const [kps, setKps] = useState(0);
  const keyTimestamps = useRef<number[]>([]);

  const theme = THEMES[currentTheme];

  useEffect(() => {
    sound.enabled = soundEnabled;
    try {
      localStorage.setItem(STORAGE_KEYS.SOUND, String(soundEnabled));
    } catch {}
  }, [soundEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, currentTheme);
    } catch {}
  }, [currentTheme]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SCANLINES, String(scanlinesEnabled));
    } catch {}
  }, [scanlinesEnabled]);

  const handleKeypress = useCallback(
    (key: string) => {
      const now = performance.now();
      keyTimestamps.current.push(now);

      keyTimestamps.current = keyTimestamps.current.filter((t) => now - t <= 1500);
      const calculatedKps = keyTimestamps.current.length / 1.5;
      setKps(calculatedKps);

      setTotalKeys((prev) => prev + 1);
      setKeystrokes((prev) => [...prev.slice(-7), key]);

      if (engineState === "playing" && gameEngine) {
        gameEngine.handleKeypress(key);
      }
    },
    [engineState, gameEngine],
  );

  useEffect(() => {
    return () => {
      gameEngineRef.current?.destroy();
      gameEngineRef.current = null;
    };
  }, []);

  const handleReturnToMenu = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.destroy();
      gameEngineRef.current = null;
    }
    setGameEngine(null);
    setSummary(null);
    setEngineState("menu");
    const menuLines = menuEngine.renderMenuLines().join("\n");
    setBufferContent(menuLines);
    setTargetCursor({ line: 8, col: 4 });
    setRoundInfo({
      gameId: menuEngine.getSelection().game,
      difficulty: menuEngine.getSelection().difficulty,
      noCursor: false,
    });
  }, [menuEngine]);

  const startGame = useCallback((gameId: GameId, difficulty: Difficulty) => {
    if (gameEngineRef.current) {
      gameEngineRef.current.destroy();
      gameEngineRef.current = null;
    }

    setEngineState("countdown");
    setSummary(null);

    const engine = new GameEngine(gameId, difficulty, {
      onRenderBuffer: (text, line, col) => {
        if (engine.isDestroyed || gameEngineRef.current !== engine) return;
        setBufferContent(text);
        setTargetCursor({ line, col });
      },
      onRoundAdvance: (roundNum, total, noCursor) => {
        if (engine.isDestroyed || gameEngineRef.current !== engine) return;
        setRoundInfo({
          gameId,
          difficulty,
          currentRound: roundNum,
          totalRounds: total,
          noCursor: !!noCursor,
        });
      },
      onGameOver: (gameSummary) => {
        if (engine.isDestroyed || gameEngineRef.current !== engine) return;
        setEngineState("game_over");
        setSummary(gameSummary);
        const endLines = engine.getEndGameLines(gameSummary).join("\n");
        setBufferContent(endLines);
        setTargetCursor({ line: 10, col: 0 });
      },
    });

    gameEngineRef.current = engine;
    setGameEngine(engine);

    engine.startCountdown(() => {
      if (engine.isDestroyed || gameEngineRef.current !== engine) return;
      setEngineState("playing");
      engine.startRound();
    });
  }, []);

  const handleDocChange = useCallback(
    (newText: string) => {
      const lines = newText.split("\n");

      if (engineState === "menu") {
        const result = menuEngine.handleMenuChange(lines);

        if (result.action === "difficulty_changed") {
          const updated = menuEngine.renderMenuLines().join("\n");
          setBufferContent(updated);
        } else if (result.action === "start" && result.game && result.difficulty) {
          startGame(result.game, result.difficulty);
        } else if (result.action === "rerender") {
          const restored = menuEngine.renderMenuLines().join("\n");
          setBufferContent(restored);
        }
      } else if (engineState === "playing" && gameEngine) {
        gameEngine.handleBufferChange(newText);
      } else if (engineState === "game_over" && gameEngine && summary) {
        const expected = gameEngine.getEndGameLines(summary);
        if (lines.length < expected.length) {
          const missingLine = expected.find((l) => !lines.includes(l));
          if (missingLine?.includes("Menu")) {
            handleReturnToMenu();
          } else if (missingLine?.includes("Replay")) {
            startGame(summary.gameId as GameId, summary.difficulty);
          } else if (missingLine?.includes("Quit")) {
            handleReturnToMenu();
          }
        }
      }
    },
    [engineState, menuEngine, gameEngine, summary, startGame, handleReturnToMenu],
  );

  return (
    <div
      className="relative flex flex-col w-screen h-screen overflow-hidden select-none font-mono"
      style={{ backgroundColor: theme.surface, color: theme.text }}
    >
      {scanlinesEnabled && <div className="absolute inset-0 z-40 scanlines pointer-events-none" />}

      <TerminalHeader
        theme={theme}
        currentTheme={currentTheme}
        onThemeChange={setCurrentTheme}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        scanlinesEnabled={scanlinesEnabled}
        onToggleScanlines={() => setScanlinesEnabled((prev) => !prev)}
        onRestartMenu={handleReturnToMenu}
        isPlaying={engineState !== "menu"}
      />

      <main className="flex-1 flex flex-col p-3 sm:p-5 overflow-hidden">
        <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col overflow-hidden">
          <NeovimWindow
            initialContent={bufferContent}
            theme={theme}
            targetCursor={targetCursor}
            gameInfo={roundInfo}
            noCursor={roundInfo.noCursor}
            onCancelGame={engineState !== "menu" ? handleReturnToMenu : undefined}
            onDocChange={handleDocChange}
            onKeypress={handleKeypress}
          />
        </div>

        <div className="w-full max-w-5xl mx-auto pt-2.5">
          <KeystrokeHUD keystrokes={keystrokes} kps={kps} totalKeys={totalKeys} theme={theme} />
        </div>
      </main>

      {summary && engineState === "game_over" && (
        <StatsModal
          summary={summary}
          theme={theme}
          onReplay={() => startGame(summary.gameId as GameId, summary.difficulty)}
          onMenu={handleReturnToMenu}
        />
      )}
    </div>
  );
}

export default App;
