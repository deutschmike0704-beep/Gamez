/**
 * Basis-Utilities für alle Minigames.
 */

export function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.classList.add('game-canvas');
  return canvas;
}

export function loadHighScore(gameId) {
  const raw = localStorage.getItem(`gamez:${gameId}:highscore`);
  return raw ? parseInt(raw, 10) : 0;
}

export function saveHighScore(gameId, score) {
  const current = loadHighScore(gameId);
  if (score > current) {
    localStorage.setItem(`gamez:${gameId}:highscore`, String(score));
    return true;
  }
  return false;
}