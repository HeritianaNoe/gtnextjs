// Mamorona ny tabilao (grille) amin'ny teny azo avy ao amin'ny JSON.

const FILL = "AAAAIIIINNNNOOORRTTYYKMLSVBDFGHJPZ";

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function tryPlace(grid, word, directions) {
  const size = grid.length;
  for (let t = 0; t < 300; t++) {
    const [dr, dc] = directions[Math.floor(Math.random() * directions.length)];
    const r0 = Math.floor(Math.random() * size);
    const c0 = Math.floor(Math.random() * size);
    const r1 = r0 + dr * (word.length - 1);
    const c1 = c0 + dc * (word.length - 1);
    if (r1 < 0 || r1 >= size || c1 < 0 || c1 >= size) continue;

    const cells = [];
    let ok = true;
    for (let i = 0; i < word.length; i++) {
      const r = r0 + dr * i;
      const c = c0 + dc * i;
      if (grid[r][c] !== "" && grid[r][c] !== word[i]) {
        ok = false;
        break;
      }
      cells.push([r, c]);
    }
    if (!ok) continue;

    cells.forEach(([r, c], i) => (grid[r][c] = word[i]));
    return cells;
  }
  return null;
}

export function generatePuzzle(config) {
  const { gridSize: size, wordCount, directions, words } = config;

  for (let attempt = 0; attempt < 100; attempt++) {
    const grid = Array.from({ length: size }, () => Array(size).fill(""));
    const picked = shuffle(words)
      .slice(0, wordCount)
      .sort((a, b) => b.length - a.length);

    const placements = [];
    let ok = true;
    for (const word of picked) {
      const cells = tryPlace(grid, word, directions);
      if (!cells) {
        ok = false;
        break;
      }
      placements.push({ word, cells });
    }
    if (!ok) continue;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === "") {
          grid[r][c] = FILL[Math.floor(Math.random() * FILL.length)];
        }
      }
    }
    return { size, grid, placements: placements.sort((a, b) => a.word.localeCompare(b.word)) };
  }
  throw new Error("Tsy afaka namorona tabilao.");
}

// Cellules eo anelanelan'ny fanombohana sy ny farany (raha tsipika mahitsy)
export function lineCells(start, end) {
  const dr = end[0] - start[0];
  const dc = end[1] - start[1];
  const valid = dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc);
  if (!valid) return [start];
  const n = Math.max(Math.abs(dr), Math.abs(dc));
  const sr = Math.sign(dr);
  const sc = Math.sign(dc);
  return Array.from({ length: n + 1 }, (_, i) => [start[0] + sr * i, start[1] + sc * i]);
}

export function findMatch(placements, found, cells) {
  const first = cells[0];
  const last = cells[cells.length - 1];
  return placements.find((p) => {
    if (found.includes(p.word)) return false;
    const a = p.cells[0];
    const b = p.cells[p.cells.length - 1];
    const forward = a[0] === first[0] && a[1] === first[1] && b[0] === last[0] && b[1] === last[1];
    const backward = a[0] === last[0] && a[1] === last[1] && b[0] === first[0] && b[1] === first[1];
    return forward || backward;
  });
}
