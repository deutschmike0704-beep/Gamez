const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const BET = 50;

let deck = [];
let playerHand = [];
let dealerHand = [];
let chips = 500;
let phase = 'betting';
let doubled = false;
let currentBet = BET;

const chipsEl = document.getElementById('chips');
const betEl = document.getElementById('bet-display');
const dealerCardsEl = document.getElementById('dealer-cards');
const playerCardsEl = document.getElementById('player-cards');
const dealerScoreEl = document.getElementById('dealer-score');
const playerScoreEl = document.getElementById('player-score');
const messageEl = document.getElementById('message');
const btnDeal = document.getElementById('btn-deal');
const btnHit = document.getElementById('btn-hit');
const btnStand = document.getElementById('btn-stand');
const btnDouble = document.getElementById('btn-double');

function createDeck() {
  const d = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      d.push({ suit, rank, red: suit === '♥' || suit === '♦' });
    }
  }
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function cardValue(card) {
  if (card.rank === 'A') return 11;
  if (['K', 'Q', 'J'].includes(card.rank)) return 10;
  return parseInt(card.rank, 10);
}

function handValue(hand) {
  let total = 0;
  let aces = 0;
  for (const c of hand) {
    total += cardValue(c);
    if (c.rank === 'A') aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function renderCard(card, hidden = false) {
  const el = document.createElement('div');
  el.className = 'playing-card';
  if (hidden) {
    el.classList.add('playing-card--hidden');
  } else {
    el.classList.add(card.red ? 'playing-card--red' : 'playing-card--black');
    el.innerHTML = `<span>${card.rank}</span><span>${card.suit}</span>`;
  }
  return el;
}

function renderHands(hideDealer = false) {
  dealerCardsEl.innerHTML = '';
  playerCardsEl.innerHTML = '';
  dealerHand.forEach((c, i) => {
    dealerCardsEl.appendChild(renderCard(c, hideDealer && i === 1));
  });
  playerHand.forEach((c) => {
    playerCardsEl.appendChild(renderCard(c));
  });
  playerScoreEl.textContent = `(${handValue(playerHand)})`;
  if (hideDealer) {
    dealerScoreEl.textContent = `(?)`;
  } else {
    dealerScoreEl.textContent = `(${handValue(dealerHand)})`;
  }
}

function updateUI() {
  chipsEl.textContent = `Chips: ${chips}`;
  betEl.textContent = `Einsatz: ${currentBet}`;
  const playing = phase === 'playing';
  btnDeal.disabled = playing || chips < BET;
  btnHit.disabled = !playing;
  btnStand.disabled = !playing;
  btnDouble.disabled = !playing || playerHand.length !== 2 || chips < BET || doubled;
}

function deal() {
  if (chips < BET) {
    messageEl.textContent = 'Nicht genug Chips!';
    return;
  }
  currentBet = BET;
  chips -= currentBet;
  deck = createDeck();
  playerHand = [deck.pop(), deck.pop()];
  dealerHand = [deck.pop(), deck.pop()];
  doubled = false;
  phase = 'playing';
  renderHands(true);
  updateUI();

  if (handValue(playerHand) === 21) {
    stand();
    return;
  }
  messageEl.textContent = 'Karte ziehen oder halten?';
}

function hit() {
  playerHand.push(deck.pop());
  renderHands(true);
  if (handValue(playerHand) > 21) {
    phase = 'done';
    renderHands(false);
    messageEl.textContent = 'Bust! Dealer gewinnt.';
    updateUI();
  }
}

function stand() {
  phase = 'done';
  renderHands(false);
  while (handValue(dealerHand) < 17) {
    dealerHand.push(deck.pop());
  }
  renderHands(false);

  const pVal = handValue(playerHand);
  const dVal = handValue(dealerHand);
  let payout = 0;

  if (pVal > 21) {
    messageEl.textContent = 'Bust! Du verlierst.';
  } else if (dVal > 21) {
    payout = currentBet * 2;
    messageEl.textContent = 'Dealer bust! Du gewinnst!';
  } else if (pVal > dVal) {
    payout = currentBet * 2;
    messageEl.textContent = 'Du gewinnst!';
  } else if (pVal < dVal) {
    messageEl.textContent = 'Dealer gewinnt.';
  } else {
    payout = currentBet;
    messageEl.textContent = 'Unentschieden – Einsatz zurück.';
  }

  if (pVal === 21 && playerHand.length === 2 && dVal !== 21 && !doubled) {
    payout = Math.floor(currentBet * 2.5);
    messageEl.textContent = 'Blackjack! 3:2 Auszahlung!';
  }

  chips += payout;
  if (chips <= 0) {
    chips = 500;
    messageEl.textContent += ' Neue Chips!';
  }
  updateUI();
}

function doubleDown() {
  if (chips < BET || playerHand.length !== 2) return;
  chips -= BET;
  currentBet += BET;
  doubled = true;
  playerHand.push(deck.pop());
  renderHands(true);
  stand();
}

btnDeal.addEventListener('click', deal);
btnHit.addEventListener('click', hit);
btnStand.addEventListener('click', stand);
btnDouble.addEventListener('click', doubleDown);

updateUI();