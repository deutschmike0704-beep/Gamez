import { createCanvas, loadHighScore, saveHighScore } from '../core/game-engine.js';

const W = 720;
const H = 480;
const container = document.getElementById('game-container');
const scoreEl = document.getElementById('score');
const hintEl = document.getElementById('hint');
const btnStart = document.getElementById('btn-start');

const canvas = createCanvas(W, H);
container.appendChild(canvas);
const ctx = canvas.getContext('2d');

const PHASE = { IDLE: 0, APPROACH: 1, TAKEOFF: 2, FLIGHT: 3, LANDING: 4, DONE: 5 };

let phase = PHASE.IDLE;
let frame = 0;
let speed = 0;
let takeoffQuality = 0;
let landingQuality = 0;
let distance = 0;
let skier = { x: 0, y: 0, z: 0, vy: 0, vz: 0, angle: 0 };
let meter = 0;
let meterDir = 1;
let bestDist = loadHighScore('ski-jump');

scoreEl.textContent = `Beste Weite: ${bestDist} m`;

function project(x, y, z) {
  const camY = 120;
  const camZ = -200;
  const scale = 320 / (z - camZ);
  return {
    sx: W / 2 + x * scale,
    sy: H * 0.55 + (y - camY) * scale,
    scale,
  };
}

function drawHill() {
  const ramp = [
    project(-280, 80, 400),
    project(280, 80, 400),
    project(120, 40, 80),
    project(-120, 40, 80),
  ];
  const landing = [
    project(-400, 100, 900),
    project(400, 100, 900),
    project(280, 60, 200),
    project(-280, 60, 200),
  ];

  ctx.fillStyle = '#1e3a5f';
  ctx.beginPath();
  ctx.moveTo(landing[0].sx, landing[0].sy);
  for (let i = 1; i < landing.length; i++) ctx.lineTo(landing[i].sx, landing[i].sy);
  ctx.closePath();
  ctx.fill();

  const grad = ctx.createLinearGradient(0, H * 0.3, 0, H);
  grad.addColorStop(0, '#e8f4fc');
  grad.addColorStop(1, '#b8d4e8');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(ramp[0].sx, ramp[0].sy);
  for (let i = 1; i < ramp.length; i++) ctx.lineTo(ramp[i].sx, ramp[i].sy);
  ctx.lineTo(ramp[0].sx, ramp[0].sy + 200);
  ctx.lineTo(ramp[3].sx, ramp[3].sy + 200);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(ramp[2].sx, ramp[2].sy);
  ctx.lineTo(ramp[3].sx, ramp[3].sy);
  ctx.stroke();

  for (let i = 0; i < 8; i++) {
    const p = project(-60 + i * 18, 55, 350 + i * 70);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(p.sx - 20 * p.scale * 0.01, p.sy, 40 * p.scale * 0.01, 3);
  }
}

function drawSkier() {
  const p = project(skier.x, skier.y, skier.z);
  const s = Math.max(0.4, p.scale * 0.015);

  ctx.save();
  ctx.translate(p.sx, p.sy);
  ctx.scale(s, s);
  ctx.rotate(skier.angle);

  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(-8, -30, 16, 22);
  ctx.fillStyle = '#f5d0a0';
  ctx.beginPath();
  ctx.arc(0, -36, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2c3e50';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-22, 0);
  ctx.lineTo(22, 0);
  ctx.stroke();
  ctx.restore();
}

function drawMeter(label, value, y, perfect = 0.75) {
  const x = W / 2 - 150;
  const w = 300;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x - 10, y - 30, w + 20, 50);
  ctx.fillStyle = '#333';
  ctx.fillRect(x, y, w, 16);
  const zone = 0.12;
  ctx.fillStyle = 'rgba(46,204,113,0.4)';
  ctx.fillRect(x + w * (perfect - zone), y, w * zone * 2, 16);
  ctx.fillStyle = '#6c5ce7';
  ctx.fillRect(x, y, w * value, 16);
  ctx.fillStyle = '#fff';
  ctx.font = '14px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(label, W / 2, y - 8);
}

function drawFlightTrail() {
  if (phase !== PHASE.FLIGHT && phase !== PHASE.LANDING) return;
  ctx.strokeStyle = 'rgba(108,92,231,0.3)';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  const start = project(0, 40, 80);
  const end = project(skier.x, skier.y, skier.z);
  ctx.moveTo(start.sx, start.sy);
  ctx.lineTo(end.sx, end.sy);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawHUD() {
  if (phase === PHASE.APPROACH) {
    drawMeter('Geschwindigkeit – Leertaste im grünen Bereich!', meter, H - 80, 0.82);
  } else if (phase === PHASE.TAKEOFF) {
    drawMeter('Absprung – Jetzt drücken!', meter, H - 80, 0.5);
  } else if (phase === PHASE.FLIGHT) {
    drawMeter('Landung – Telemark-Timing!', meter, H - 80, 0.65);
  } else if (phase === PHASE.DONE) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(W / 2 - 160, H / 2 - 50, 320, 100);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`${distance.toFixed(1)} m`, W / 2, H / 2 - 10);
    ctx.font = '16px system-ui';
    ctx.fillStyle = '#a29bfe';
    ctx.fillText(`Stil: ${landingQuality}% · Absprung: ${takeoffQuality}%`, W / 2, H / 2 + 22);
  }
}

function resetJump() {
  phase = PHASE.APPROACH;
  frame = 0;
  speed = 0;
  takeoffQuality = 0;
  landingQuality = 0;
  distance = 0;
  meter = 0;
  meterDir = 1;
  skier = { x: 0, y: 50, z: 350, vy: 0, vz: 0, angle: 0.3 };
  hintEl.textContent = 'Baue Geschwindigkeit auf – Leertaste im grünen Bereich!';
}

function finishJump() {
  phase = PHASE.DONE;
  const base = 60 + speed * 80;
  distance = base * (0.6 + takeoffQuality * 0.25 + landingQuality * 0.15);
  if (saveHighScore('ski-jump', Math.round(distance))) {
    bestDist = Math.round(distance);
    scoreEl.textContent = `Beste Weite: ${bestDist} m – Neuer Rekord!`;
  } else {
    scoreEl.textContent = `Beste Weite: ${bestDist} m · Dieser Sprung: ${distance.toFixed(1)} m`;
  }
  hintEl.textContent = 'Neuer Sprung?';
}

function update() {
  frame++;
  meter += meterDir * 0.018;
  if (meter >= 1) { meter = 1; meterDir = -1; }
  if (meter <= 0) { meter = 0; meterDir = 1; }

  if (phase === PHASE.APPROACH) {
    skier.z -= 2.5 + frame * 0.02;
    skier.y = 50 - (350 - skier.z) * 0.08;
    if (skier.z < 90) phase = PHASE.TAKEOFF;
  } else if (phase === PHASE.FLIGHT) {
    skier.vz += 0.08;
    skier.vy -= 0.35;
    skier.z += skier.vz;
    skier.y += skier.vy;
    skier.x += Math.sin(frame * 0.05) * 0.3;
    skier.angle = -0.4 + Math.sin(frame * 0.08) * 0.1;
    if (skier.y > 55) {
      phase = PHASE.LANDING;
      skier.y = 55;
    }
  } else if (phase === PHASE.LANDING) {
    skier.z += 4;
    skier.y = 55 + Math.sin(frame * 0.2) * 2;
    if (skier.z > 750) finishJump();
  }
}

function render() {
  ctx.fillStyle = '#87ceeb';
  ctx.fillRect(0, 0, W, H * 0.55);
  ctx.fillStyle = '#4a6741';
  ctx.fillRect(0, H * 0.55, W, H * 0.45);

  drawHill();
  drawFlightTrail();
  drawSkier();
  drawHUD();
}

function loop() {
  if (phase >= PHASE.APPROACH && phase < PHASE.DONE) update();
  render();
  requestAnimationFrame(loop);
}

function timingScore(value, perfect = 0.75) {
  const diff = Math.abs(value - perfect);
  return Math.max(0, Math.round((1 - diff * 4) * 100));
}

function onSpace() {
  if (phase === PHASE.IDLE || phase === PHASE.DONE) {
    resetJump();
    return;
  }
  if (phase === PHASE.APPROACH) {
    speed = timingScore(meter, 0.82) / 100;
    phase = PHASE.TAKEOFF;
    hintEl.textContent = 'Absprung! Leertaste am Scheitelpunkt!';
    return;
  }
  if (phase === PHASE.TAKEOFF) {
    takeoffQuality = timingScore(meter, 0.5);
    skier.vz = -6 - speed * 4;
    skier.vy = -8 - speed * 3;
    phase = PHASE.FLIGHT;
    hintEl.textContent = 'Flugphase – Telemark-Landung timen!';
    return;
  }
  if (phase === PHASE.FLIGHT || phase === PHASE.LANDING) {
    landingQuality = timingScore(meter, 0.65);
    phase = PHASE.LANDING;
    hintEl.textContent = 'Landung!';
  }
}

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    onSpace();
  }
});

btnStart.addEventListener('click', () => {
  if (phase === PHASE.IDLE || phase === PHASE.DONE) resetJump();
});

phase = PHASE.IDLE;
hintEl.textContent = 'Leertaste oder „Neuer Sprung" zum Starten';
loop();