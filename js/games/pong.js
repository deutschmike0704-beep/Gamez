import { createCanvas } from '../core/game-engine.js';

const container = document.getElementById('game-container');
const scoreEl = document.getElementById('score');

const canvas = createCanvas(600, 400);
container.appendChild(canvas);

// TODO: Pong-Logik implementieren
scoreEl.textContent = 'Punkte: 0 – Bald verfügbar!';