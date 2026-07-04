const EMOJIS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];
const PAIRS = 8;

const container = document.getElementById('game-container');
const scoreEl = document.getElementById('score');
const btnRestart = document.getElementById('btn-restart');

let cards = [];
let flipped = [];
let moves = 0;
let locked = false;
let matched = 0;

function buildBoard() {
  const pairs = EMOJIS.slice(0, PAIRS);
  cards = [...pairs, ...pairs]
    .sort(() => Math.random() - 0.5)
    .map((emoji, i) => ({ id: i, emoji, open: false, done: false }));

  flipped = [];
  moves = 0;
  locked = false;
  matched = 0;
  scoreEl.textContent = 'Züge: 0';
  render();
}

function render() {
  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'memory-grid';

  cards.forEach((card) => {
    const btn = document.createElement('button');
    btn.className = 'memory-card';
    btn.type = 'button';
    btn.setAttribute('aria-label', card.done || card.open ? card.emoji : 'Verdeckte Karte');
    if (card.done) btn.classList.add('memory-card--matched');
    else if (card.open) btn.classList.add('memory-card--open');

    btn.textContent = card.open || card.done ? card.emoji : '?';
    btn.disabled = locked || card.done || card.open;
    btn.addEventListener('click', () => flip(card.id));
    grid.appendChild(btn);
  });

  container.appendChild(grid);
}

function flip(id) {
  const card = cards.find((c) => c.id === id);
  if (!card || card.open || card.done || locked) return;

  card.open = true;
  flipped.push(card);
  render();

  if (flipped.length < 2) return;

  locked = true;
  moves++;
  scoreEl.textContent = `Züge: ${moves}`;

  const [a, b] = flipped;
  if (a.emoji === b.emoji) {
    a.done = true;
    b.done = true;
    matched += 2;
    flipped = [];
    locked = false;
    render();
    if (matched === PAIRS * 2) {
      scoreEl.textContent = `Geschafft in ${moves} Zügen!`;
    }
  } else {
    setTimeout(() => {
      a.open = false;
      b.open = false;
      flipped = [];
      locked = false;
      render();
    }, 700);
  }
}

btnRestart.addEventListener('click', buildBoard);
buildBoard();