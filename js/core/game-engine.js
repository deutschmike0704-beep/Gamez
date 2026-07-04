/**
 * Basis-Utilities für alle Minigames.
 */

export function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.classList.add('game-canvas');
  canvas.style.maxWidth = '100%';
  canvas.style.height = 'auto';
  return canvas;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function loadHighScore(gameId) {
  try {
    const raw = localStorage.getItem(`gamez:${gameId}:highscore`);
    const val = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(val) ? val : 0;
  } catch {
    return 0;
  }
}

export function saveHighScore(gameId, score) {
  const current = loadHighScore(gameId);
  if (score > current) {
    try {
      localStorage.setItem(`gamez:${gameId}:highscore`, String(score));
    } catch { /* quota */ }
    return true;
  }
  return false;
}

export function loadStoredNumber(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    const val = raw ? parseInt(raw, 10) : fallback;
    return Number.isFinite(val) ? val : fallback;
  } catch {
    return fallback;
  }
}

export function saveStoredNumber(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch { /* quota */ }
}

export class GameLoop {
  constructor(update, render) {
    this.update = update;
    this.render = render;
    this.running = false;
    this.rafId = 0;
    this.lastTime = 0;
    this._tick = this._tick.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this._tick);
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  _tick(now) {
    if (!this.running) return;
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.update(dt);
    this.render();
    this.rafId = requestAnimationFrame(this._tick);
  }
}

export function bindKeys(handlers, target = document) {
  const down = (e) => {
    if (handlers.down?.[e.code]) {
      e.preventDefault();
      handlers.down[e.code]();
    }
  };
  const up = (e) => {
    if (handlers.up?.[e.code]) handlers.up[e.code]();
  };
  target.addEventListener('keydown', down);
  target.addEventListener('keyup', up);
  return () => {
    target.removeEventListener('keydown', down);
    target.removeEventListener('keyup', up);
  };
}