"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import config from "../data/puzzles.json";
import { generatePuzzle, lineCells, findMatch } from "../lib/puzzle";
import { playCorrect, playWrong, playOpenWhenAllowed, setMuted } from "../lib/sound";

const STORAGE_KEY = "mitady-teny-best-10x10";
const MUTE_KEY = "mitady-teny-mute";

const fmt = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function Game() {
  const [puzzle, setPuzzle] = useState(null);
  const [found, setFound] = useState([]);
  const [sel, setSel] = useState([]);
  const [seconds, setSeconds] = useState(0);
  const [best, setBest] = useState(null);
  const [mute, setMute] = useState(false);
  const dragStart = useRef(null);

  const complete = puzzle && found.length === puzzle.placements.length;

  const newGame = useCallback(() => {
    setPuzzle(generatePuzzle(config));
    setFound([]);
    setSel([]);
    setSeconds(0);
    dragStart.current = null;
  }, []);

  // Mamorona ny lalao ao amin'ny client fotsiny (misoroka hydration mismatch)
  useEffect(() => {
    newGame();
  }, [newGame]);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v !== null) setBest(Number(v));
    } catch {}
    let m = false;
    try {
      m = localStorage.getItem(MUTE_KEY) === "1";
    } catch {}
    setMute(m);
    if (m) return;
    // Feo ampisokafana
    return playOpenWhenAllowed();
  }, []);

  const toggleMute = () => {
    const next = !mute;
    setMute(next);
    setMuted(next);
    try {
      localStorage.setItem(MUTE_KEY, next ? "1" : "0");
    } catch {}
  };

  useEffect(() => {
    if (!puzzle || complete) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [puzzle, complete]);

  useEffect(() => {
    if (!complete) return;
    if (best === null || seconds < best) {
      setBest(seconds);
      try {
        localStorage.setItem(STORAGE_KEY, String(seconds));
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete]);

  const cellFromEvent = (e) => {
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-r]");
    return el ? [Number(el.dataset.r), Number(el.dataset.c)] : null;
  };

  const onDown = (e) => {
    if (complete) return;
    const cell = cellFromEvent(e);
    if (!cell) return;
    dragStart.current = cell;
    setSel([cell]);
  };

  const onMove = (e) => {
    if (!dragStart.current) return;
    const cell = cellFromEvent(e);
    if (cell) setSel(lineCells(dragStart.current, cell));
  };

  const onUp = () => {
    if (!dragStart.current) return;
    if (sel.length > 1) {
      const match = findMatch(puzzle.placements, found, sel);
      if (match) {
        setFound((f) => [...f, match.word]);
        if (!mute) playCorrect();
      } else if (!mute) {
        playWrong();
      }
    }
    dragStart.current = null;
    setSel([]);
  };

  const foundCells = new Set();
  puzzle?.placements.forEach((p) => {
    if (found.includes(p.word)) p.cells.forEach(([r, c]) => foundCells.add(`${r},${c}`));
  });
  const selCells = new Set(sel.map(([r, c]) => `${r},${c}`));
  const total = puzzle?.placements.length ?? 0;

  return (
    <main className="shell">
      <header className="head">
        <div className="flag" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div>
          <h1>Mitady Teny</h1>
          <p>Tadiavo ao anaty tabilao ny teny rehetra voasoratra eo anilany.</p>
        </div>
      </header>

      {puzzle && (
        <div className="play">
          <section className="panel board-panel" aria-label="Tabilao">
            <div className="panel-head">
              <div className="stats">
                <span className="stat">
                  <small>Fotoana</small>
                  <b>{fmt(seconds)}</b>
                </span>
                <span className="stat">
                  <small>Hita</small>
                  <b>{found.length}/{total}</b>
                </span>
                <span className="stat">
                  <small>Tsara indrindra</small>
                  <b>{best !== null ? fmt(best) : "—"}</b>
                </span>
              </div>
              <button
                className="mute"
                onClick={toggleMute}
                aria-label={mute ? "Alefaso ny feo" : "Aoka ny feo"}
                title={mute ? "Alefaso ny feo" : "Aoka ny feo"}
              >
                {mute ? "🔇" : "🔊"}
              </button>
            </div>
            <div className="panel-body board-body">
              <div
                className="grid"
                style={{ "--n": puzzle.size }}
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
              >
                {puzzle.grid.map((row, r) =>
                  row.map((letter, c) => {
                    const k = `${r},${c}`;
                    const cls = selCells.has(k) ? "cell sel" : foundCells.has(k) ? "cell hit" : "cell";
                    return (
                      <div key={k} data-r={r} data-c={c} className={cls}>
                        {letter}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>

          <aside className="panel words-panel" aria-label="Teny tadiavina">
            <div className="panel-head">
              <h2>Teny tadiavina</h2>
              <span className="badge">{found.length}/{total}</span>
            </div>
            <div className="panel-body">
              <ul>
                {puzzle.placements.map((p) => (
                  <li key={p.word} className={found.includes(p.word) ? "done" : ""}>
                    {p.word}
                  </li>
                ))}
              </ul>
            </div>
            <div className="panel-foot">
              <button className="new" onClick={newGame}>
                Lalao vaovao
              </button>
            </div>
          </aside>
        </div>
      )}

      {complete && (
        <div className="win" role="status">
          Mankasitraka! Vita ny lalao tao anatin'ny {fmt(seconds)}.
          <button onClick={newGame}>Andramo indray</button>
        </div>
      )}

      <footer className="foot">
        <a href="https://fanorona-nine.vercel.app/" target="_blank" rel="noopener noreferrer">
          Fanorona
        </a>
        <span className="copy">© 2026 RASOLOMANANA Heritiana Noe.</span>
        <a href="https://katro-murex.vercel.app/" target="_blank" rel="noopener noreferrer">
          Katro
        </a>
      </footer>
    </main>
  );
}
