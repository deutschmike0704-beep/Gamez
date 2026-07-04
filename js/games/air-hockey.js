import { createCanvas } from '../core/game-engine.js';

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

let running = false;
let playerScore = 0;
let cpuScore = 0;
let mouseX = W / 2;
let mouseY = H - 120;

const player = { x: W / 2, y: H - 100, r: PADDLE_R };
const cpu = { x: W / 2, y: 100, r: PADDLE_R };
const puck = { x: W / 2, y: H / 2, vx: 0, vy: 0, r: PUCK_R };

function resetPuck(scorer) {
  puck.x = W / 2;
  puck.y = H / 2;
  const dir = scorer === 'player' ? -1 : 1;
  puck.vx = (Math.random() - 0.5) * 4;
  puck.vy = dir * 6;
}

function drawTable() {
  ctx.fillStyle = '#0d2137';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#1565c0';
  ctx.beginPath();
  const rx = 16;
  const x = 20, y = 20, rw = W - 40, rh = H - 40;
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

  const goalW = 160;
  ctx.fillStyle = '#0d2137';
  ctx.fillRect(W / 2 - goalW / 2, 10, goalW, 20);
  ctx.fillRect(W / 2 - goalW / 2, H - 30, goalW, 20);
}

function drawPaddle(p, color) {
  const grad = ctx.createRadialGradient(p.x - 10, p.y - 10, 5, p.x, p.y, p.r);
  grad.addColorStop(0, color);
  grad.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawPuck() {
  ctx.fillStyle = '#ff4757';
  ctx.beginPath();
  ctx.arc(puck.x, puck.y, puck.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(puck.x - 5, puck.y - 5, 6, 0, Math.PI * 2);
  ctx.fill();
}

function collidePaddle(paddle) {
  const dx = puck.x - paddle.x;
  const dy = puck.y - paddle.y;
  const dist = Math.hypot(dx, dy);
  const minDist = puck.r + paddle.r;
  if (dist < minDist && dist > 0) {
    const nx = dx / dist;
    const ny = dy / dist;
    const overlap = minDist - dist;
    puck.x += nx * overlap;
    puck.y += ny * overlap;
    const speed = Math.hypot(puck.vx, puck.vy);
    const hitPower = 10 + speed * 0.5;
    puck.vx = nx * hitPower;
    puck.vy = ny * hitPower;
  }
}

function wallBounce() {
  const m = 20 + puck.r;
  if (puck.x - puck.r < m) { puck.x = m + puck.r; puck.vx *= -1; }
  if (puck.x + puck.r > W - m) { puck.x = W - m - puck.r; puck.vx *= -1; }

  const goalW = 160;
  const inGoalX = puck.x > W / 2 - goalW / 2 && puck.x < W / 2 + goalW / 2;

  if (puck.y - puck.r < m) {
    if (inGoalX && running) {
      playerScore++;
      scoreEl.textContent = `${playerScore} : ${cpuScore}`;
      if (playerScore >= GOAL_SCORE) endGame('Du gewinnst!');
      else resetPuck('player');
    } else {
      puck.y = m + puck.r;
      puck.vy *= -1;
    }
  }
  if (puck.y + puck.r > H - m) {
    if (inGoalX && running) {
      cpuScore++;
      scoreEl.textContent = `${playerScore} : ${cpuScore}`;
      if (cpuScore >= GOAL_SCORE) endGame('CPU gewinnt!');
      else resetPuck('cpu');
    } else {
      puck.y = H - m - puck.r;
      puck.vy *= -1;
    }
  }
}

function update() {
  if (!running) return;

  const targetX = puck.x;
  const targetY = Math.min(180, puck.y * 0.35 + 60);
  cpu.x += (targetX - cpu.x) * 0.06;
  cpu.y += (targetY - cpu.y) * 0.04;
  cpu.x = Math.max(20 + PADDLE_R, Math.min(W - 20 - PADDLE_R, cpu.x));
  cpu.y = Math.max(20 + PADDLE_R, Math.min(H / 2 - PADDLE_R - 10, cpu.y));

  player.x += (mouseX - player.x) * 0.25;
  player.y += (mouseY - player.y) * 0.25;
  player.x = Math.max(20 + PADDLE_R, Math.min(W - 20 - PADDLE_R, player.x));
  player.y = Math.max(H / 2 + PADDLE_R + 10, Math.min(H - 20 - PADDLE_R, player.y));

  puck.vx *= 0.998;
  puck.vy *= 0.998;
  puck.x += puck.vx;
  puck.y += puck.vy;

  collidePaddle(player);
  collidePaddle(cpu);
  wallBounce();
}

function endGame(msg) {
  running = false;
  hintEl.textContent = msg + ' – Nochmal spielen?';
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

function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

function startGame() {
  running = true;
  playerScore = 0;
  cpuScore = 0;
  scoreEl.textContent = '0 : 0';
  hintEl.textContent = 'Maus bewegen oder Pfeiltasten';
  resetPuck('cpu');
}

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = (e.clientX - rect.left) * (W / rect.width);
  mouseY = (e.clientY - rect.top) * (H / rect.height);
});

document.addEventListener('keydown', (e) => {
  if (!running) return;
  const step = 20;
  if (e.code === 'ArrowLeft') mouseX -= step;
  if (e.code === 'ArrowRight') mouseX += step;
  if (e.code === 'ArrowUp') mouseY -= step;
  if (e.code === 'ArrowDown') mouseY += step;
});

btnStart.addEventListener('click', startGame);
loop();