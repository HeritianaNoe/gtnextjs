// Feo namboarina amin'ny Web Audio API (tsy mila rakitra mp3).
let ctx = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

function tone(ac, { freq, start = 0, dur = 0.15, type = "sine", vol = 0.2, slideTo }) {
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function play(notes) {
  const ac = getCtx();
  if (!ac) return;
  const go = () => notes.forEach((n) => tone(ac, n));
  if (ac.state === "suspended") ac.resume().then(go).catch(() => {});
  else go();
}

// Marina: feo roa mihoatra (C5 -> G5)
export const playCorrect = () =>
  play([
    { freq: 523.25, start: 0, dur: 0.14, type: "triangle", vol: 0.25 },
    { freq: 783.99, start: 0.11, dur: 0.28, type: "triangle", vol: 0.25 },
  ]);

// Diso: feo ambany mivarina
export const playWrong = () =>
  play([
    { freq: 220, slideTo: 140, start: 0, dur: 0.28, type: "sawtooth", vol: 0.12 },
    { freq: 165, slideTo: 100, start: 0.12, dur: 0.3, type: "sawtooth", vol: 0.1 },
  ]);

// Ampisokafana: feo telo mihoatra (C5 E5 G5 C6)
export const playOpen = () =>
  play([
    { freq: 523.25, start: 0, dur: 0.18, type: "triangle", vol: 0.22 },
    { freq: 659.25, start: 0.12, dur: 0.18, type: "triangle", vol: 0.22 },
    { freq: 783.99, start: 0.24, dur: 0.18, type: "triangle", vol: 0.22 },
    { freq: 1046.5, start: 0.36, dur: 0.4, type: "triangle", vol: 0.22 },
  ]);

// Miandry ny fikasihana voalohany raha voasakana ny feo ho azy (fitsipiky ny navigateur)
export function playOpenWhenAllowed(onPlayed) {
  const ac = getCtx();
  if (ac && ac.state === "running") {
    playOpen();
    onPlayed?.();
    return () => {};
  }
  const events = ["pointerdown", "keydown", "touchstart"];
  const handler = () => {
    events.forEach((e) => window.removeEventListener(e, handler, true));
    playOpen();
    onPlayed?.();
  };
  events.forEach((e) => window.addEventListener(e, handler, true));
  return () => events.forEach((e) => window.removeEventListener(e, handler, true));
}

// Mba ahafahana manaisotra ny feo mandritra ny lalao
let muted = false;
export const setMuted = (m) => {
  muted = m;
  if (ctx) (m ? ctx.suspend() : ctx.resume()).catch(() => {});
};
export const isMuted = () => muted;
