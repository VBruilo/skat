# Skat-Punkteliste

Mobile-first Web-App, um beim Skat mit Freunden nach jeder Runde Punkte einzutragen — über
mehrere Sitzungen hinweg, dauerhaft gespeichert, mit Google-Login und Echtzeit-Sync auf allen
Geräten.

**Live:** https://vbruilo.github.io/skat/ (nach dem Setup)

## Funktionen

- **Google-Login** — jeder Spieler auf seinem eigenen Handy.
- **Serien** — eine Serie über z. B. 36 Runden; per 6-stelligem Code / Link beitreten (max. 3 Spieler).
- **Runde eintragen** — Alleinspieler + fertigen **Spielwert** + Gewonnen/Verloren.
  Wertung: **einfache Liste** — Alleinspieler gewinnt `+Spielwert`, verliert `−2×Spielwert`
  (deckt sich mit der offiziellen ISkO-Verlustregel). Gegenspieler bekommen 0.
- **Anpassung / Ramsch** — freier Modus, um Punkte pro Spieler direkt zu vergeben
  (Ramsch, Strafpunkte, Korrekturen).
- **Tabelle & Statistik** — laufender Punktestand, Fortschritt zur Zielrundenzahl,
  eigene Quote als Alleinspieler.
- **Bearbeiten/Löschen** einzelner Runden (Vertipper).

## Tech-Stack

React + Vite + TypeScript · Tailwind CSS · React Router (HashRouter) ·
Firebase Auth (Google) + Firestore (Realtime) · Deploy via GitHub Actions → GitHub Pages.

## Entwicklung

```bash
npm install
cp .env.example .env.local   # Firebase-Web-Config eintragen (siehe SETUP.md)
npm run dev                  # http://localhost:5173/skat/
npm test                     # Unit-Tests der Punkte-Logik
npm run build                # Production-Build
```

## Einrichtung

Vollständige Schritt-für-Schritt-Anleitung (Firebase, Rules, Authorized Domains, GitHub Pages):
siehe **[SETUP.md](./SETUP.md)**.

## Skat-Regeln

Die für die App relevante Regel-Referenz (gegen die ISkO 2018 geprüft) steht im Implementierungs-Plan.
Kurz: Dreiertisch, eine Serie = 36 Spiele; nur der Alleinspieler wird gewertet
(`+Spielwert` / `−2×Spielwert`).
