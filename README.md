# Gamez

Eine Sammlung von Minigames als statische Website.

## Struktur

```
Gamez/
├── index.html          # Startseite mit Spielübersicht
├── css/                # Globale Styles
├── js/                 # App-Logik und Game-Module
├── games/              # Einzelne Spiele (HTML + Assets)
└── assets/             # Geteilte Bilder, Sounds, Fonts
```

## Spiele

- **Snake** – Klassisches Schlangenspiel
- **Memory** – Paare finden
- **Tic-Tac-Toe** – Drei gewinnt
- **Pong** – Retro-Paddle-Spiel
- **Skispringen** – 3D-Timing-Spiel (Anlauf, Absprung, Landung)
- **Boxen** – Kampf gegen CPU mit Schlag, Block und Ausweichen
- **Airhockey** – Paddle-Spiel gegen CPU, erstes Tor bis 7
- **Blackjack** – 21 gegen den Dealer (Karte, Halten, Verdoppeln)

## Lokal starten

Einen einfachen lokalen Server starten (z. B. mit Python):

```bash
python3 -m http.server 8080
```

Dann im Browser öffnen: [http://localhost:8080](http://localhost:8080)

## Neue Spiele hinzufügen

1. Ordner unter `games/<spielname>/` anlegen
2. Game-Modul unter `js/games/<spielname>.js` erstellen
3. Spiel in `js/app.js` registrieren
4. Karte auf der Startseite in `index.html` ergänzen