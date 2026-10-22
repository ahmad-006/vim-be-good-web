import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  EditorView,
  lineNumbers,
  highlightActiveLineGutter,
  drawSelection,
  rectangularSelection,
} from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { vim, getCM, Vim } from "@replit/codemirror-vim";
import { RotateCcw } from "lucide-react";
import type { ThemeConfig } from "../utils/themes";
import { sound } from "../utils/audio";

interface NeovimWindowProps {
  initialContent: string;
  theme: ThemeConfig;
  targetCursor?: { line: number; col?: number };
  gameInfo?: {
    gameId: string;
    difficulty: string;
    currentRound?: number;
    totalRounds?: number;
  };
  noCursor?: boolean;
  onCancelGame?: () => void;
  onDocChange: (text: string) => void;
  onKeypress: (key: string) => void;
}

export const NeovimWindow: React.FC<NeovimWindowProps> = ({
  initialContent,
  theme,
  targetCursor,
  gameInfo,
  noCursor = false,
  onCancelGame,
  onDocChange,
  onKeypress,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const initialContentRef = useRef(initialContent);

  const onDocChangeRef = useRef(onDocChange);
  const onKeypressRef = useRef(onKeypress);
  const onCancelGameRef = useRef(onCancelGame);

  useEffect(() => {
    onDocChangeRef.current = onDocChange;
    onKeypressRef.current = onKeypress;
    onCancelGameRef.current = onCancelGame;
  });

  const [vimMode, setVimMode] = useState<string>("NORMAL");
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 0 });
  const [scrollProgress, setScrollProgress] = useState("All");

  const setContentAndCursor = useCallback(
    (text: string, cursorLine?: number, cursorCol = 0) => {
      const view = editorViewRef.current;
      if (!view) return;

      const currentDoc = view.state.doc.toString();
      if (currentDoc === text) return;

      // Preserve scroll position across document updates to prevent scroll snapping
      const scrollDOM = view.scrollDOM;
      const prevTop = scrollDOM ? scrollDOM.scrollTop : 0;
      const prevLeft = scrollDOM ? scrollDOM.scrollLeft : 0;

      const transaction = view.state.update({
        changes: { from: 0, to: currentDoc.length, insert: text },
      });
      view.dispatch(transaction);

      if (scrollDOM) {
        scrollDOM.scrollTop = prevTop;
        scrollDOM.scrollLeft = prevLeft;
      }

      if (cursorLine !== undefined && !noCursor) {
        try {
          const doc = view.state.doc;
          const targetLineNum = Math.min(Math.max(1, cursorLine), doc.lines);
          const lineObj = doc.line(targetLineNum);
          const pos = Math.min(lineObj.from + cursorCol, lineObj.to);

          view.dispatch({
            selection: { anchor: pos, head: pos },
            scrollIntoView: false,
          });
        } catch {}
      }
    },
    [noCursor],
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const themeExtension = EditorView.theme(
      {
        "&": {
          color: theme.text,
          backgroundColor: theme.bg,
          fontFamily: "var(--font-mono)",
          fontSize: "14px",
          height: "100%",
          outline: "none",
        },
        ".cm-content": {
          caretColor: theme.cursor,
          padding: "12px 0",
        },
        "&.cm-focused .cm-cursor": {
          borderLeftColor: theme.cursor,
        },
        ".cm-gutters": {
          backgroundColor: theme.surface,
          color: theme.textDim,
          borderRight: `1px solid ${theme.border}`,
          paddingRight: "6px",
        },
        ".cm-activeLine": {
          backgroundColor: "rgba(255, 255, 255, 0.03)",
        },
        ".cm-activeLineGutter": {
          backgroundColor: "transparent",
          color: theme.accent,
          fontWeight: "bold",
        },
        ".cm-line": {
          padding: "0 12px",
        },
        "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, ::selection, .cm-content ::selection":
          {
            backgroundColor: "rgba(137, 180, 250, 0.45) !important",
          },
        "&.cm-focused .cm-selectionBackground": {
          backgroundColor: "rgba(137, 180, 250, 0.45) !important",
        },
        ".cm-selectionMatch": {
          backgroundColor: "rgba(245, 224, 220, 0.3) !important",
        },
      },
      { dark: true },
    );

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const text = update.state.doc.toString();
        onDocChangeRef.current(text);
      }

      if (update.selectionSet || update.docChanged) {
        const pos = update.state.selection.main.head;
        const line = update.state.doc.lineAt(pos);
        setCursorPos({
          line: line.number,
          col: pos - line.from,
        });

        const total = update.state.doc.lines;
        if (total <= 1) {
          setScrollProgress("All");
        } else if (line.number === 1) {
          setScrollProgress("Top");
        } else if (line.number === total) {
          setScrollProgress("Bot");
        } else {
          const pct = Math.round((line.number / total) * 100);
          setScrollProgress(`${pct}%`);
        }
      }
    });

    const startState = EditorState.create({
      doc: initialContentRef.current,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        drawSelection(),
        rectangularSelection(),
        themeExtension,
        vim(),
        updateListener,
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    });

    editorViewRef.current = view;

    const cm = getCM(view);
    if (cm) {
      cm.on("vim-mode-change", (data: { mode: string; subMode?: string }) => {
        let label = (data.mode || "NORMAL").toUpperCase();
        if (data.subMode === "linewise") label = "VISUAL LINE";
        if (data.subMode === "blockwise") label = "VISUAL BLOCK";
        setVimMode(label);
      });

      cm.on("vim-keypress", (key: string) => {
        sound.playKeyClick();
        onKeypressRef.current(key);
      });
    }

    try {
      Vim.defineEx("quit", "q", () => {
        onCancelGameRef.current?.();
      });
      Vim.defineEx("q!", "q!", () => {
        onCancelGameRef.current?.();
      });
    } catch {}

    view.focus();

    return () => {
      view.destroy();
      editorViewRef.current = null;
    };
  }, [theme]);

  useEffect(() => {
    if (targetCursor && !noCursor) {
      setContentAndCursor(initialContent, targetCursor.line, targetCursor.col);
    } else {
      setContentAndCursor(initialContent);
    }
  }, [initialContent, targetCursor, noCursor, setContentAndCursor]);

  return (
    <div
      className="flex flex-col h-full rounded-xl border shadow-2xl overflow-hidden font-mono transition-colors"
      style={{
        backgroundColor: theme.bg,
        borderColor: theme.border,
      }}
      onClick={() => editorViewRef.current?.focus()}
    >
      <div
        className="flex items-center justify-between px-4 py-2 border-b text-xs select-none"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border,
          color: theme.textDim,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-wider" style={{ color: theme.accent }}>
            [VimBeGood]
          </span>
          <span className="opacity-40">•</span>
          <span className="text-[11px] opacity-70">
            {gameInfo?.gameId ? `${gameInfo.gameId} (${gameInfo.difficulty})` : "ThePrimeagen"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {gameInfo?.currentRound && gameInfo.totalRounds && gameInfo.totalRounds > 1 && (
            <div className="flex items-center gap-1 text-[11px]">
              <span className="opacity-50">Round:</span>
              <span className="font-bold tabular-nums" style={{ color: theme.accentGreen }}>
                {gameInfo.currentRound} / {gameInfo.totalRounds}
              </span>
            </div>
          )}

          {gameInfo?.totalRounds === 1 && gameInfo.gameId === "snake" && (
            <div className="flex items-center gap-1 text-[11px]">
              <span
                className="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded border"
                style={{
                  color: theme.accentYellow,
                  borderColor: `${theme.accentYellow}40`,
                  backgroundColor: `${theme.accentYellow}10`,
                }}
              >
                Continuous Arcade
              </span>
            </div>
          )}

          {onCancelGame && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancelGame();
              }}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold transition-all hover:brightness-125 active:scale-95 cursor-pointer shadow-sm"
              style={{
                backgroundColor: "rgba(243, 139, 168, 0.15)",
                color: theme.accentRed,
                border: "1px solid rgba(243, 139, 168, 0.35)",
              }}
              title="Return to Menu (or type :q in Vim)"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Cancel Game</span>
              <span className="opacity-60 text-[9px] font-mono hidden sm:inline">(:q)</span>
            </button>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className={`flex-1 w-full overflow-hidden text-sm ${noCursor ? "no-cursor" : ""}`}
      />

      <div
        className="flex items-center justify-between px-3 py-1 text-xs select-none border-t"
        style={{
          backgroundColor: theme.statusBg,
          borderColor: theme.border,
          color: theme.statusText,
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wide"
            style={{
              backgroundColor:
                vimMode === "INSERT"
                  ? theme.accentGreen
                  : vimMode.startsWith("VISUAL")
                    ? theme.accentYellow
                    : theme.accent,
              color: theme.bg,
            }}
          >
            -- {vimMode} --
          </span>
          <span className="text-[11px] opacity-70 hidden sm:inline">[VimBeGood]</span>
          <span className="text-[11px] opacity-40 hidden sm:inline">[+] [utf-8]</span>
        </div>

        <div className="flex items-center gap-4 text-[11px] opacity-80 tabular-nums">
          {gameInfo?.gameId === "snake" && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onKeypressRef.current("h");
                }}
                className="px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all active:scale-90 cursor-pointer select-none"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderColor: theme.border,
                  color: theme.accent,
                }}
                title="Steer Left (h)"
              >
                ◀ H
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onKeypressRef.current("j");
                }}
                className="px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all active:scale-90 cursor-pointer select-none"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderColor: theme.border,
                  color: theme.accent,
                }}
                title="Steer Down (j)"
              >
                ▼ J
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onKeypressRef.current("k");
                }}
                className="px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all active:scale-90 cursor-pointer select-none"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderColor: theme.border,
                  color: theme.accent,
                }}
                title="Steer Up (k)"
              >
                ▲ K
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onKeypressRef.current("l");
                }}
                className="px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all active:scale-90 cursor-pointer select-none"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderColor: theme.border,
                  color: theme.accent,
                }}
                title="Steer Right (l)"
              >
                ▶ L
              </button>
            </div>
          )}
          <span>{noCursor ? "ARCADE" : `Ln ${cursorPos.line}, Col ${cursorPos.col + 1}`}</span>
          <span className="opacity-50">•</span>
          <span>{scrollProgress}</span>
        </div>
      </div>
    </div>
  );
};
