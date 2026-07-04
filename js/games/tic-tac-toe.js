const container = document.getElementById('game-container');
const statusEl = document.getElementById('status');
const btnRestart = document.getElementById('btn-restart');

const WINS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

let board, current, gameOver;

function init() {
  board = Array(9).fill(null);
  current = 'X';
  gameOver = false;
  statusEl.textContent = 'Du (X) bist dran';
  render();
}

function render() {
  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'ttt-grid';

  board.forEach((cell, i) => {
    const btn = document.createElement('button');
    btn.className = 'ttt-cell';
    btn.type = 'button';
    btn.textContent = cell ?? '';
    if (cell === 'X') btn.classList.add('ttt-cell--x');
    if (cell === 'O') btn.classList.add('ttt-cell--o');
    btn.disabled = gameOver || cell !== null;
    btn.addEventListener('click', () => play(i));
    grid.appendChild(btn);
  });

  container.appendChild(grid);
}

function checkWinner(b) {
  for (const [a, c, d] of WINS) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  }
  return b.every((c) => c) ? 'draw' : null;
}

function minimax(b, isMax) {
  const result = checkWinner(b);
  if (result === 'O') return 10;
  if (result === 'X') return -10;
  if (result === 'draw') return 0;

  if (isMax) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!b[i]) {
        b[i] = 'O';
        best = Math.max(best, minimax(b, false));
        b[i] = null;
      }
    }
    return best;
  }
  let best = Infinity;
  for (let i = 0; i < 9; i++) {
    if (!b[i]) {
      b[i] = 'X';
      best = Math.min(best, minimax(b, true));
      b[i] = null;
    }
  }
  return best;
}

function cpuMove() {
  let bestScore = -Infinity;
  let move = -1;
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = 'O';
      const score = minimax(board, false);
      board[i] = null;
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }
  if (move >= 0) board[move] = 'O';
}

function endRound(result) {
  gameOver = true;
  if (result === 'draw') statusEl.textContent = 'Unentschieden!';
  else if (result === 'X') statusEl.textContent = 'Du gewinnst!';
  else statusEl.textContent = 'CPU gewinnt!';
  render();
}

function play(i) {
  if (gameOver || board[i]) return;
  board[i] = 'X';
  let result = checkWinner(board);
  if (result) return endRound(result);

  current = 'O';
  statusEl.textContent = 'CPU denkt…';
  render();

  setTimeout(() => {
    cpuMove();
    result = checkWinner(board);
    current = 'X';
    if (result) endRound(result);
    else {
      statusEl.textContent = 'Du (X) bist dran';
      render();
    }
  }, 350);
}

btnRestart.addEventListener('click', init);
init();