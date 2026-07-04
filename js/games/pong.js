import { createCanvas, loadHighScore, saveHighScore, GameLoop, clamp, bindKeys } from '../core/game-engine.js';

const W = 600;
const H = 400;
const PADDLE_H = 80;
const PADDLE_W = 12;
const BALL_R = 8;
const WIN_SCORE = 5;

const container = document.getElementById('game-container');
const scoreEl = document.getElementById('score');
const btnStart = document.getElementById('btn-start');
const btnRestart = document.getElementById('btn-restart');

const canvas = createCanvas(W, H);
container.appendChild(canvas);
const ctx = canvas.getContext('2d');

let running, gameOver, playerY, cpuY, ball, pScore, cScore, best;

function resetBall(dir = 1) {
  ball = {
    x: W / 2, y: H / 2,
    vx: dir * (4 + Math.random()),
    vy: (Math.random() - 0.5) * 4,
    r: BALL_R,
  };
}

function init() {
  playerY = H / 2 - PADDLE_H / 2;
  cpuY = H / 2 - PADDLE_H / 2;
  pScore = 0;
  cScore = 0;
  running = false;
  gameOver = false;
  best = loadHighScore('pong');
  resetBall(Math.random() > 0.5 ? 1 : -1);
  updateScore();
}

function updateScore() {
  scoreEl.textContent = `Du ${pScore} : ${cScore} CPU · Best: ${best}`;
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

  const speed = 280;
  if (keys.ArrowUp) playerY -= speed * dt;
  if (keys.ArrowDown) playerY += speed * dt;
  playerY = clamp(playerY, 10, H - PADDLE_H - 10);

  const cpuCenter = cpuY + PADDLE_H / 2;
  const target = ball.y - PADDLE_H / 2;
  const diff = target - cpuY;
  const cpuSpeed = 200 + cScore * 20;
  cpuY += clamp(diff, -cpuSpeed * dt, cpuSpeed * dt);
  cpuY = clamp(cpuY, 10, H - PADDLE_H - 10);

  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.y - ball.r < 10) { ball.y = 10 + ball.r; ball.vy *= -1; }
  if (ball.y + ball.r > H - 10) { ball.y = H - 10 - ball.r; ball.vy *= -1; }

  const px = 20;
  if (ball.x - ball.r < px + PADDLE_W && ball.vx < 0 &&
      ball.y > playerY && ball.y < playerY + PADDLE_H) {
    ball.x = px + PADDLE_W + ball.r;
    ball.vx = Math.abs(ball.vx) * 1.05;
    ball.vy += (ball.y - (playerY + PADDLE_H / 2)) * 0.08;
  }

  const cx = W - 20 - PADDLE_W;
  if (ball.x + ball.r > cx && ball.vx > 0 &&
      ball.y > cpuY && ball.y < cpuY + PADDLE_H) {
    ball.x = cx - ball.r;
    ball.vx = -Math.abs(ball.vx) * 1.05;
    ball.vy += (ball.y - (cpuY + PADDLE_H / 2)) * 0.08;
  }

  const maxV = 12;
  const v = Math.hypot(ball.vx, ball.vy);
  if (v > maxV) { ball.vx *= maxV / v; ball.vy *= maxV / v; }

  if (ball.x < 0) {
    cScore++;
    updateScore();
    if (cScore >= WIN_SCORE) endGame(false);
    else resetBall(1);
  }
  if (ball.x > W) {
    pScore++;
    updateScore();
    if (pScore >= WIN_SCORE) endGame(true);
    else resetBall(-1);
  }
}

function endGame(won) {
  gameOver = true;
  running = false;
  if (won && saveHighScore('pong', pScore)) best = pScore;
  scoreEl.textContent = won ? `Du gewinnst ${pScore}:${cScore}!` : `CPU gewinnt ${cScore}:${pScore}!`;
}

function render() {
  ctx.fillStyle = '#0f0f14';
  ctx.fillRect(0, 0, W, H);
  ctx.setLineDash([6, 8]);
  ctx.strokeStyle = '#2e2e48';
  ctx.beginPath();
  ctx.moveTo(W / 2, 10);
  ctx.lineTo(W / 2, H - 10);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#3498db';
  ctx.fillRect(20, playerY, PADDLE_W, PADDLE_H);
  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(W - 20 - PADDLE_W, cpuY, PADDLE_W, PADDLE_H);

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();

  if (!running && !gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = '18px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Start · Pfeiltasten', W / 2, H / 2);
  }
}

const keys = { ArrowUp: false, ArrowDown: false };
const loop = new GameLoop(update, render);
loop.start();

bindKeys({
  down: {
    ArrowUp: () => { keys.ArrowUp = true; },
    ArrowDown: () => { keys.ArrowDown = true; },
  },
  up: {
    ArrowUp: () => { keys.ArrowUp = false; },
    ArrowDown: () => { keys.ArrowDown = false; },
  },
});

btnStart.addEventListener('click', start);
btnRestart.addEventListener('click', restart);
init();