# Setup — Skat-Punkteliste

Diese App ist ein statisches Frontend (GitHub Pages) mit **Firebase** als Login- und
Datenschicht. Die Schritte einmalig durchführen, danach deployt jeder Push auf `main`
automatisch.

Reihenfolge bewusst gewählt: **zuerst der Google-Login auf dem iPhone** (Risiko #1),
erst danach der Rest.

---

## 1. Firebase-Projekt anlegen

1. <https://console.firebase.google.com> → **Projekt hinzufügen** (z. B. `skat-punkteliste`).
   Google Analytics kannst du deaktivieren.
2. **Build → Authentication → Get started → Sign-in method → Google → aktivieren.**
   Support-E-Mail wählen, speichern.
3. **Build → Firestore Database → Datenbank erstellen** → Region z. B. `eur3 (europe-west)` →
   im **Produktionsmodus** starten (Regeln kommen aus diesem Repo, siehe Schritt 4).
4. **Projektübersicht → Web-App hinzufügen (`</>`)**, App registrieren (kein Hosting nötig).
   Firebase zeigt dir das `firebaseConfig`-Objekt — diese 6 Werte brauchst du gleich.

## 2. Lokale Env-Datei

`.env.example` nach `.env.local` kopieren und die 6 Werte aus dem `firebaseConfig` eintragen:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=dein-projekt.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=dein-projekt
VITE_FIREBASE_STORAGE_BUCKET=dein-projekt.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=1:...:web:...
```

> Der Web-API-Key ist **kein Geheimnis** — er landet ohnehin im Client-Bundle.
> Der Schutz kommt über die Firestore-Rules (Schritt 4) und die Authorized Domains (Schritt 5).

Dann lokal starten und den Login testen:

```
npm install
npm run dev
```

## 3. Firestore Security Rules veröffentlichen

Die Rules liegen in `firestore.rules`. Zwei Wege:

- **Schnell (Console):** Firestore → **Rules** → Inhalt von `firestore.rules` einfügen → **Veröffentlichen**.
- **CLI:** `npm i -g firebase-tools` → `firebase login` → `firebase use --add` (Projekt wählen) →
  `firebase deploy --only firestore:rules`.

## 4. Authorized Domains (wichtig fürs iPhone!)

Firebase → **Authentication → Settings → Authorized domains → Domain hinzufügen**:

- `vbruilo.github.io` (die spätere Pages-Domain)
- `localhost` ist bereits erlaubt (fürs lokale Testen)

Ohne diesen Eintrag schlägt der Google-Login auf der veröffentlichten Seite fehl.

## 5. Auth-Spike auf dem iPhone (Milestone 0)

Bevor du weitermachst: sicherstellen, dass der Login auf **iPhone/Safari** klappt.

- Lokal reicht Safari am Mac nicht als Beweis — teste auf dem echten iPhone, sobald die
  Seite deployt ist (Schritt 6/7), oder per `npm run dev -- --host` im selben WLAN
  (dann die Netzwerk-URL am iPhone öffnen; `localhost` ist als Authorized Domain erlaubt,
  eine LAN-IP ggf. zusätzlich eintragen).
- Die App nutzt `signInWithPopup`. Falls Safari das Popup blockt: Login-Button erneut tippen
  (der Klick zählt dann als User-Geste). Bleibt es hartnäckig, ist der Fallback **Firebase
  Hosting** (macht den Login same-origin) — dann diese Seite über Firebase Hosting statt
  GitHub Pages ausliefern.

## 6. GitHub: Repo-Secrets für den Build

Damit GitHub Actions dieselbe Config beim Build kennt, die 6 Werte als
**Repository Secrets** hinterlegen: GitHub → Repo `VBruilo/skat` → **Settings → Secrets and
variables → Actions → New repository secret**. Genau diese Namen:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

## 7. GitHub Pages aktivieren

1. Repo **öffentlich** machen (Settings → General → Danger Zone → Change visibility), falls
   noch privat — GitHub Pages ist auf kostenlosen Konten nur für öffentliche Repos gratis.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. Den Branch nach `main` mergen (bzw. dorthin pushen). Der Workflow
   `.github/workflows/deploy.yml` baut und deployt automatisch.
4. Nach ~1–2 Minuten ist die App unter **<https://vbruilo.github.io/skat/>** erreichbar.

## Danach

- Einer legt eine Serie an → teilt den 6-stelligen Code / Link.
- Die anderen loggen sich ein und treten mit dem Code bei (max. 3 Spieler).
- Nach jeder Runde: **+ Runde eintragen** → Alleinspieler, Spielwert, Gewonnen/Verloren.
- Alle Geräte aktualisieren sich in Echtzeit.
