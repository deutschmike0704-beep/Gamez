/**
 * Gamez – Hauptanwendung
 * Registriert Spiele und initialisiert die Startseite.
 */

const GAMES = [
  { id: 'snake', name: 'Snake', path: 'games/snake/' },
  { id: 'memory', name: 'Memory', path: 'games/memory/' },
  { id: 'tic-tac-toe', name: 'Tic-Tac-Toe', path: 'games/tic-tac-toe/' },
  { id: 'pong', name: 'Pong', path: 'games/pong/' },
  { id: 'ski-jump', name: 'Skispringen', path: 'games/ski-jump/' },
  { id: 'boxing', name: 'Boxen', path: 'games/boxing/' },
  { id: 'air-hockey', name: 'Airhockey', path: 'games/air-hockey/' },
  { id: 'blackjack', name: 'Blackjack', path: 'games/blackjack/' },
];

document.addEventListener('DOMContentLoaded', () => {
  console.log(`Gamez geladen – ${GAMES.length} Spiele verfügbar`);
});

export { GAMES };