import { createCanvas, loadHighScore, saveHighScore, GameLoop, bindKeys } from '../core/game-engine.js';

const GRID = 20;
const CELL = 20;
const W = GRID * CELL;
const H = GRID * CELL;

const container = document.getElementById('game-container');
const scoreEl = document.getElementById('score');
const btnStart = document.getElementById('btn-start');
const btnRestart = document.getElementById('btn-restart');

const canvas = createCanvas(W, H);
container.appendChild(canvas);
const ctx = canvas.getContext('2d');

let snake, dir, nextDir, food, score, best, running, gameOver, tickAcc;

function init() {
  const mid = Math.floor(GRID / 2);
  snake = [{ x: mid, y: mid }, { x: mid - 1, y: mid }, { x: mid - 2, y: mid }];
  dir = { x: 1, y: 0 };
  nextDir = { ...dir };
  score = 0;
  running = false;
  gameOver = false;
  tickAcc = 0;
  spawnFood();
  best = loadHighScore('snake');
  updateScore();
}

function spawnFood() {
  let spot;
  do {
    spot = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
  } while (snake.some((s) => s.x === spot.x && s.y === spot.y));
  food = spot;
}

function updateScore() {
  scoreEl.textContent = `Punkte: ${score} · Best: ${best}`;
}

function start() {
  if (gameOver) init();
  running = true;
}

function restart() {
  init();
  running = true;
}

function update(dt) {
  if (!running || gameOver) return;
  tickAcc += dt;
  const interval = Math.max(0.08, 0.16 - score * 0.003);
  if (tickAcc < interval) return;
  tickAcc = 0;

  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
    endGame();
    return;
  }
  if (snake.some((s) => s.x === head.x && s.y === head.y)) {
    endGame();
    return;
  }

  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score++;
    if (saveHighScore('snake', score)) best = score;
    updateScore();
    spawnFood();
  } else {
    snake.pop();
  }
}

function endGame() {
  gameOver = true;
  running = false;
  saveHighScore('snake', score);
  best = loadHighScore('snake');
  scoreEl.textContent = `Game Over! Punkte: ${score} · Best: ${best}`;
}

function render() {
  ctx.fillStyle = '#0f0f14';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = '#1e1e2e';
  for (let i = 0; i <= GRID; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CELL, 0);
    ctx.lineTo(i * CELL, H);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * CELL);
    ctx.lineTo(W, i * CELL);
    ctx.stroke();
  }

  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
  ctx.fill();

  snake.forEach((seg, i) => {
    ctx.fillStyle = i === 0 ? '#6c5ce7' : '#a29bfe';
    ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
  });

  if (!running && !gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = '18px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Start drücken', W / 2, H / 2);
  }
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 22px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', W / 2, H / 2);
  }
}

const loop = new GameLoop(update, render);
loop.start();

bindKeys({
  down: {
    ArrowUp: () => { if (dir.y !== 1) nextDir = { x: 0, y: -1 }; },
    ArrowDown: () => { if (dir.y !== -1) nextDir = { x: 0, y: 1 }; },
    ArrowLeft: () => { if (dir.x !== 1) nextDir = { x: -1, y: 0 }; },
    ArrowRight: () => { if (dir.x !== -1) nextDir = { x: 1, y: 0 }; },
  },
});

btnStart.addEventListener('click', start);
btnRestart.addEventListener('click', restart);
init();