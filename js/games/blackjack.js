import { loadStoredNumber, saveStoredNumber } from '../core/game-engine.js';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const BET = 50;
const CHIPS_KEY = 'gamez:blackjack:chips';

let deck = [];
let playerHand = [];
let dealerHand = [];
let chips = loadStoredNumber(CHIPS_KEY, 500);
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

function isBlackjack(hand) {
  return hand.length === 2 && handValue(hand) === 21;
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
  dealerScoreEl.textContent = hideDealer ? '(?)' : `(${handValue(dealerHand)})`;
}

function persistChips() {
  saveStoredNumber(CHIPS_KEY, chips);
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

function resolveRound(revealEarly = false) {
  phase = 'done';
  renderHands(revealEarly);
  while (handValue(dealerHand) < 17) {
    dealerHand.push(deck.pop());
  }
  renderHands(false);

  const pVal = handValue(playerHand);
  const dVal = handValue(dealerHand);
  let payout = 0;

  const pBJ = isBlackjack(playerHand);
  const dBJ = isBlackjack(dealerHand);

  if (pBJ && dBJ) {
    payout = currentBet;
    messageEl.textContent = 'Beide Blackjack – Unentschieden.';
  } else if (pBJ) {
    payout = Math.floor(currentBet * 2.5);
    messageEl.textContent = 'Blackjack! 3:2 Auszahlung!';
  } else if (dBJ) {
    messageEl.textContent = 'Dealer Blackjack – du verlierst.';
  } else if (pVal > 21) {
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

  chips += payout;
  if (chips < BET) {
    chips = 500;
    messageEl.textContent += ' Neue Chips!';
  }
  persistChips();
  updateUI();
}

function deal() {
  if (phase === 'playing' || chips < BET) return;
  currentBet = BET;
  chips -= currentBet;
  deck = createDeck();
  playerHand = [deck.pop(), deck.pop()];
  dealerHand = [deck.pop(), deck.pop()];
  doubled = false;
  phase = 'playing';
  renderHands(true);
  updateUI();
  persistChips();

  if (isBlackjack(dealerHand) || isBlackjack(playerHand)) {
    resolveRound(true);
    return;
  }
  messageEl.textContent = 'Karte ziehen oder halten?';
}

function hit() {
  if (phase !== 'playing') return;
  playerHand.push(deck.pop());
  renderHands(true);
  if (handValue(playerHand) > 21) resolveRound(true);
}

function stand() {
  if (phase !== 'playing') return;
  resolveRound(false);
}

function doubleDown() {
  if (phase !== 'playing' || chips < BET || playerHand.length !== 2 || doubled) return;
  chips -= BET;
  currentBet += BET;
  doubled = true;
  persistChips();
  playerHand.push(deck.pop());
  renderHands(true);
  resolveRound(handValue(playerHand) <= 21);
}

btnDeal.addEventListener('click', deal);
btnHit.addEventListener('click', hit);
btnStand.addEventListener('click', stand);
btnDouble.addEventListener('click', doubleDown);

updateUI();