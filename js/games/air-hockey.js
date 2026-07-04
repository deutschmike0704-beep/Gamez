import { createCanvas, GameLoop, clamp } from '../core/game-engine.js';

const W = 600;
const H = 800;
const container = document.getElementById('game-container');
const scoreEl = document.getElementById('score');
const hintEl = document.getElementById('hint');
const btnStart = document.getElementById('btn-start');

const canvas = createCanvas(W, H);
container.appendChild(canvas);
const ctx = canvas.getContext('2d');

const GOAL_SCORE = 7;
const PADDLE_R = 45;
const PUCK_R = 18;
const MARGIN = 20;
const GOAL_W = 160;
const MAX_SPEED = 14;

let running = false;
let playerScore = 0;
let cpuScore = 0;
let goalCooldown = 0;
let mouseX = W / 2;
let mouseY = H - 120;

const player = { x: W / 2, y: H - 100, r: PADDLE_R };
const cpu = { x: W / 2, y: 100, r: PADDLE_R };
const puck = { x: W / 2, y: H / 2, vx: 0, vy: 0, r: PUCK_R };

function resetPuck(scorer) {
  puck.x = W / 2;
  puck.y = H / 2;
  const dir = scorer === 'player' ? -1 : 1;
  puck.vx = (Math.random() - 0.5) * 3;
  puck.vy = dir * 5;
  goalCooldown = 60;
}

function drawTable() {
  ctx.fillStyle = '#0d2137';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#1565c0';
  ctx.beginPath();
  const rx = 16, x = 20, y = 20, rw = W - 40, rh = H - 40;
  ctx.moveTo(x + rx, y);
  ctx.lineTo(x + rw - rx, y);
  ctx.quadraticCurveTo(x + rw, y, x + rw, y + rx);
  ctx.lineTo(x + rw, y + rh - rx);
  ctx.quadraticCurveTo(x + rw, y + rh, x + rw - rx, y + rh);
  ctx.lineTo(x + rx, y + rh);
  ctx.quadraticCurveTo(x, y + rh, x, y + rh - rx);
  ctx.lineTo(x, y + rx);
  ctx.quadraticCurveTo(x, y, x + rx, y);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 12]);
  ctx.beginPath();
  ctx.moveTo(20, H / 2);
  ctx.lineTo(W - 20, H / 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 50, 0, Math.PI * 2);
  ctx.stroke();
}

function drawPaddle(p, color) {
  const grad = ctx.createRadialGradient(p.x - 10, p.y - 10, 5, p.x, p.y, p.r);
  grad.addColorStop(0, color);
  grad.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  ctx.fill();
}

function drawPuck() {
  ctx.fillStyle = '#ff4757';
  ctx.beginPath();
  ctx.arc(puck.x, puck.y, puck.r, 0, Math.PI * 2);
  ctx.fill();
}

function capSpeed() {
  const v = Math.hypot(puck.vx, puck.vy);
  if (v > MAX_SPEED) {
    puck.vx *= MAX_SPEED / v;
    puck.vy *= MAX_SPEED / v;
  }
  if (v < 0.3) { puck.vx = 0; puck.vy = 0; }
}

function collidePaddle(paddle) {
  const dx = puck.x - paddle.x;
  const dy = puck.y - paddle.y;
  const dist = Math.hypot(dx, dy);
  const minDist = puck.r + paddle.r;
  if (dist < minDist && dist > 0.001) {
    const nx = dx / dist;
    const ny = dy / dist;
    puck.x = paddle.x + nx * minDist;
    puck.y = paddle.y + ny * minDist;
    const speed = Math.max(5, Math.hypot(puck.vx, puck.vy));
    puck.vx = nx * speed;
    puck.vy = ny * speed;
    capSpeed();
  }
}

function wallBounce() {
  const m = MARGIN + puck.r;
  const inGoalX = puck.x > W / 2 - GOAL_W / 2 && puck.x < W / 2 + GOAL_W / 2;

  if (puck.x - puck.r < m) { puck.x = m + puck.r; puck.vx = Math.abs(puck.vx); }
  if (puck.x + puck.r > W - m) { puck.x = W - m - puck.r; puck.vx = -Math.abs(puck.vx); }

  if (goalCooldown > 0) goalCooldown--;

  if (puck.y - puck.r < m) {
    if (inGoalX && running && goalCooldown <= 0) {
      playerScore++;
      scoreEl.textContent = `${playerScore} : ${cpuScore}`;
      if (playerScore >= GOAL_SCORE) endGame('Du gewinnst!');
      else resetPuck('player');
    } else if (!inGoalX) {
      puck.y = m + puck.r;
      puck.vy = Math.abs(puck.vy);
    }
  }
  if (puck.y + puck.r > H - m) {
    if (inGoalX && running && goalCooldown <= 0) {
      cpuScore++;
      scoreEl.textContent = `${playerScore} : ${cpuScore}`;
      if (cpuScore >= GOAL_SCORE) endGame('CPU gewinnt!');
      else resetPuck('cpu');
    } else if (!inGoalX) {
      puck.y = H - m - puck.r;
      puck.vy = -Math.abs(puck.vy);
    }
  }
}

function update() {
  if (!running) return;

  const targetX = puck.x;
  const targetY = Math.min(180, puck.y * 0.35 + 60);
  cpu.x += (targetX - cpu.x) * 0.055;
  cpu.y += (targetY - cpu.y) * 0.04;
  cpu.x = clamp(cpu.x, MARGIN + PADDLE_R, W - MARGIN - PADDLE_R);
  cpu.y = clamp(cpu.y, MARGIN + PADDLE_R, H / 2 - PADDLE_R - 10);

  player.x += (mouseX - player.x) * 0.3;
  player.y += (mouseY - player.y) * 0.3;
  player.x = clamp(player.x, MARGIN + PADDLE_R, W - MARGIN - PADDLE_R);
  player.y = clamp(player.y, H / 2 + PADDLE_R + 10, H - MARGIN - PADDLE_R);

  puck.x += puck.vx;
  puck.y += puck.vy;
  puck.vx *= 0.999;
  puck.vy *= 0.999;

  collidePaddle(player);
  collidePaddle(cpu);
  wallBounce();
  capSpeed();
}

function endGame(msg) {
  running = false;
  hintEl.textContent = `${msg} – Nochmal spielen?`;
}

function render() {
  drawTable();
  drawPaddle(cpu, '#e74c3c');
  drawPaddle(player, '#3498db');
  drawPuck();

  if (!running) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = '20px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Spiel starten', W / 2, H / 2);
  }
}

function startGame() {
  running = true;
  playerScore = 0;
  cpuScore = 0;
  player.x = W / 2;
  player.y = H - 100;
  cpu.x = W / 2;
  cpu.y = 100;
  scoreEl.textContent = '0 : 0';
  hintEl.textContent = 'Maus, Touch oder Pfeiltasten';
  resetPuck('cpu');
}

function pointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  mouseX = (clientX - rect.left) * (W / rect.width);
  mouseY = (clientY - rect.top) * (H / rect.height);
}

canvas.addEventListener('mousemove', pointerPos);
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); pointerPos(e); }, { passive: false });

document.addEventListener('keydown', (e) => {
  if (!running) return;
  const step = 25;
  if (e.code === 'ArrowLeft') mouseX -= step;
  if (e.code === 'ArrowRight') mouseX += step;
  if (e.code === 'ArrowUp') mouseY -= step;
  if (e.code === 'ArrowDown') mouseY += step;
  mouseX = clamp(mouseX, MARGIN + PADDLE_R, W - MARGIN - PADDLE_R);
  mouseY = clamp(mouseY, H / 2 + PADDLE_R + 10, H - MARGIN - PADDLE_R);
});

btnStart.addEventListener('click', startGame);
new GameLoop(update, render).start();