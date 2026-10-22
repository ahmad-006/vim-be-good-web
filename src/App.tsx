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

export function App() {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>("catppuccin");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scanlinesEnabled, setScanlinesEnabled] = useState(false);

  const [engineState, setEngineState] = useState<EngineState>("menu");
  const [menuEngine] = useState(() => new MenuEngine("relative", "easy"));
  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null);

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
  }>({ gameId: "words", difficulty: "easy" });

  const [summary, setSummary] = useState<GameSummary | null>(null);

  const [keystrokes, setKeystrokes] = useState<string[]>([]);
  const [totalKeys, setTotalKeys] = useState(0);
  const [kps, setKps] = useState(0);
  const keyTimestamps = useRef<number[]>([]);

  const theme = THEMES[currentTheme];

  useEffect(() => {
    sound.enabled = soundEnabled;
  }, [soundEnabled]);

  const handleKeypress = useCallback((key: string) => {
    const now = performance.now();
    keyTimestamps.current.push(now);

    keyTimestamps.current = keyTimestamps.current.filter((t) => now - t <= 1500);
    const calculatedKps = keyTimestamps.current.length / 1.5;
    setKps(calculatedKps);

    setTotalKeys((prev) => prev + 1);
    setKeystrokes((prev) => [...prev.slice(-7), key]);
  }, []);

  const handleReturnToMenu = useCallback(() => {
    gameEngine?.clearTimer();
    setGameEngine(null);
    setSummary(null);
    setEngineState("menu");
    const menuLines = menuEngine.renderMenuLines().join("\n");
    setBufferContent(menuLines);
    setTargetCursor({ line: 8, col: 4 });
    setRoundInfo({
      gameId: menuEngine.getSelection().game,
      difficulty: menuEngine.getSelection().difficulty,
    });
  }, [gameEngine, menuEngine]);

  const startGame = useCallback((gameId: GameId, difficulty: Difficulty) => {
    setEngineState("countdown");
    setSummary(null);

    const engine = new GameEngine(gameId, difficulty, {
      onRenderBuffer: (text, line, col) => {
        setBufferContent(text);
        setTargetCursor({ line, col });
      },
      onRoundAdvance: (roundNum, total) => {
        setRoundInfo({
          gameId,
          difficulty,
          currentRound: roundNum,
          totalRounds: total,
        });
      },
      onGameOver: (gameSummary) => {
        setEngineState("game_over");
        setSummary(gameSummary);
        const endLines = engine.getEndGameLines(gameSummary).join("\n");
        setBufferContent(endLines);
        setTargetCursor({ line: 10, col: 0 });
      },
    });

    setGameEngine(engine);

    engine.startCountdown(() => {
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
      />

      <main className="flex-1 flex flex-col p-3 sm:p-5 overflow-hidden">
        <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col overflow-hidden">
          <NeovimWindow
            initialContent={bufferContent}
            theme={theme}
            targetCursor={targetCursor}
            gameInfo={roundInfo}
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
