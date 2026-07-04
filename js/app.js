/**
 * Gamez – Hauptanwendung
 * Registriert Spiele und initialisiert die Startseite.
 */

const GAMES = [
  { id: 'snake', name: 'Snake', path: 'games/snake/' },
  { id: 'memory', name: 'Memory', path: 'games/memory/' },
  { id: 'tic-tac-toe', name: 'Tic-Tac-Toe', path: 'games/tic-tac-toe/' },
  { id: 'pong', name: 'Pong', path: 'games/pong/' },
];

document.addEventListener('DOMContentLoaded', () => {
  console.log(`Gamez geladen – ${GAMES.length} Spiele verfügbar`);
});

export { GAMES };