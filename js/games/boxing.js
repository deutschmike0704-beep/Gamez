import { createCanvas, GameLoop, clamp, bindKeys } from '../core/game-engine.js';

const W = 720;
const H = 400;
const container = document.getElementById('game-container');
const scoreEl = document.getElementById('score');
const hintEl = document.getElementById('hint');
const btnStart = document.getElementById('btn-start');

const canvas = createCanvas(W, H);
container.appendChild(canvas);
const ctx = canvas.getContext('2d');

const STATE = { MENU: 0, FIGHT: 1, KO: 2, WIN: 3 };

let state = STATE.MENU;
let round = 1;
const keys = {};

const player = {
  x: 180, y: 280, hp: 100, maxHp: 100,
  punchTimer: 0, block: false, dodge: 0, color: '#3498db',
};
const cpu = {
  x: 540, y: 280, hp: 100, maxHp: 100,
  punchTimer: 0, block: false, dodge: 0, dodgeDir: 0, color: '#e74c3c',
  aiTimer: 0, aiAction: 'idle',
};

function cpuDifficulty() {
  return 1 + (round - 1) * 0.25;
}

function drawRing() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#2d1f3d';
  ctx.fillRect(40, 200, W - 80, 180);
  ctx.strokeStyle = '#6c5ce7';
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 200, W - 80, 180);
}

function drawFighter(f, facing) {
  const bx = f.x;
  const by = f.y + f.dodge * 15;
  const punchExt = f.punchTimer > 0 ? 30 * (f.punchTimer / 12) : 0;

  ctx.save();
  if (facing < 0) {
    ctx.translate(bx, by);
    ctx.scale(-1, 1);
    ctx.translate(-bx, -by);
  }
  ctx.fillStyle = f.color;
  ctx.fillRect(bx - 22, by - 70, 44, 55);
  if (f.block) {
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(bx + 10, by - 55, 18, 35);
  } else {
    ctx.fillStyle = f.color;
    ctx.fillRect(bx + 15 + punchExt, by - 50, 20, 14);
  }
  ctx.fillStyle = '#f5d0a0';
  ctx.beginPath();
  ctx.arc(bx, by - 78, 16, 0, Math.PI * 2);
  ctx.fill();
  if (f.block) {
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(bx - 5, by - 88, 30, 12);
  }
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(bx - 18, by - 15, 36, 15);
  ctx.restore();
}

function drawHealthBar(f, x, y, label) {
  const w = 200;
  ctx.fillStyle = '#333';
  ctx.fillRect(x, y, w, 14);
  ctx.fillStyle = f.hp > 30 ? '#2ecc71' : '#e74c3c';
  ctx.fillRect(x, y, w * clamp(f.hp / f.maxHp, 0, 1), 14);
  ctx.fillStyle = '#fff';
  ctx.font = '12px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText(`${label} ${Math.ceil(f.hp)}`, x, y - 4);
}

function tryPunch(attacker, defender) {
  if (attacker.punchTimer > 0 || attacker.block) return;
  attacker.punchTimer = 14;
  const reach = 75;
  const dist = Math.abs(attacker.x - defender.x);
  if (dist >= reach) return;

  if (defender.dodge !== 0) return;

  if (defender.block) {
    defender.hp -= 4;
    attacker.punchTimer = 22;
  } else {
    const dmg = attacker === cpu ? 10 + round * 2 : 12;
    defender.hp -= dmg;
  }
  defender.hp = Math.max(0, defender.hp);
}

function updatePlayer(dt) {
  player.block = !!keys.KeyK;
  player.dodge = keys.KeyA ? -1 : keys.KeyD ? 1 : 0;

  const moveSpeed = 220 * dt;
  if (keys.ArrowLeft) player.x -= moveSpeed;
  if (keys.ArrowRight) player.x += moveSpeed;

  if (keys.KeyJ && player.punchTimer === 0 && !player.block) tryPunch(player, cpu);

  if (player.punchTimer > 0) player.punchTimer--;
  player.x = clamp(player.x, 80, W / 2 - 40);
}

function updateCpu(dt) {
  const diff = cpuDifficulty();
  cpu.aiTimer--;
  if (cpu.aiTimer <= 0) {
    const roll = Math.random();
    if (cpu.hp < 30 && roll < 0.35) cpu.aiAction = 'block';
    else if (roll < 0.3 + diff * 0.05) cpu.aiAction = 'punch';
    else if (roll < 0.5) cpu.aiAction = 'dodge';
    else cpu.aiAction = 'advance';
    cpu.aiTimer = Math.max(15, 40 - diff * 8 + Math.random() * 20);
    if (cpu.aiAction === 'dodge') cpu.dodgeDir = Math.random() > 0.5 ? 1 : -1;
  }

  cpu.block = cpu.aiAction === 'block';
  cpu.dodge = cpu.aiAction === 'dodge' ? cpu.dodgeDir : 0;

  if (cpu.aiAction === 'punch' && cpu.punchTimer === 0) tryPunch(cpu, player);
  if (cpu.aiAction === 'advance' && cpu.x > player.x + 90) cpu.x -= (1.5 + diff * 0.5) * dt * 60;

  if (cpu.punchTimer > 0) cpu.punchTimer--;
  cpu.x = clamp(cpu.x, W / 2 + 40, W - 80);
}

function checkEnd() {
  if (player.hp <= 0) {
    state = STATE.KO;
    hintEl.textContent = 'K.o.! Button für Revanche.';
    return;
  }
  if (cpu.hp <= 0) {
    if (round >= 3) {
      state = STATE.WIN;
      hintEl.textContent = 'Champion! Button für neuen Kampf.';
    } else {
      round++;
      cpu.hp = cpu.maxHp;
      cpu.x = 540;
      player.hp = Math.min(player.maxHp, player.hp + 25);
      scoreEl.textContent = `Runde ${round} · Gegner K.o.!`;
      hintEl.textContent = 'Nächste Runde – CPU wird stärker!';
      cpu.aiTimer = 15;
    }
  }
}

function render() {
  drawRing();
  drawFighter(player, 1);
  drawFighter(cpu, -1);
  drawHealthBar(player, 50, 30, 'Du');
  drawHealthBar(cpu, W - 250, 30, 'CPU');
  ctx.fillStyle = '#fff';
  ctx.font = '14px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(`Runde ${round}`, W / 2, 25);

  if (state === STATE.MENU) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = '24px system-ui';
    ctx.fillText('Boxkampf', W / 2, H / 2 - 20);
    ctx.font = '14px system-ui';
    ctx.fillStyle = '#a29bfe';
    ctx.fillText('J Schlag · K Block · A/D Ausweichen', W / 2, H / 2 + 15);
  }
  if (state === STATE.KO || state === STATE.WIN) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = state === STATE.WIN ? '#2ecc71' : '#e74c3c';
    ctx.font = 'bold 32px system-ui';
    ctx.fillText(state === STATE.WIN ? 'SIEG!' : 'K.O.', W / 2, H / 2);
  }
}

function update(dt) {
  if (state !== STATE.FIGHT) return;
  updatePlayer(dt);
  updateCpu(dt);
  checkEnd();
}

function startFight() {
  state = STATE.FIGHT;
  round = 1;
  player.hp = player.maxHp;
  player.x = 180;
  player.punchTimer = 0;
  cpu.hp = cpu.maxHp;
  cpu.x = 540;
  cpu.punchTimer = 0;
  cpu.aiTimer = 40;
  cpu.dodgeDir = 0;
  scoreEl.textContent = 'Runde 1 · Du vs CPU';
  hintEl.textContent = 'J = Schlag · K = Block · A/D = Ausweichen';
}

const loop = new GameLoop(update, render);
loop.start();

bindKeys({
  down: {
    KeyJ: () => { keys.KeyJ = true; },
    KeyK: () => { keys.KeyK = true; },
    KeyA: () => { keys.KeyA = true; },
    KeyD: () => { keys.KeyD = true; },
    ArrowLeft: () => { keys.ArrowLeft = true; },
    ArrowRight: () => { keys.ArrowRight = true; },
  },
  up: {
    KeyJ: () => { keys.KeyJ = false; },
    KeyK: () => { keys.KeyK = false; },
    KeyA: () => { keys.KeyA = false; },
    KeyD: () => { keys.KeyD = false; },
    ArrowLeft: () => { keys.ArrowLeft = false; },
    ArrowRight: () => { keys.ArrowRight = false; },
  },
});

btnStart.addEventListener('click', startFight);