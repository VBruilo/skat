/** Maps a Firebase/Firestore error to a short, user-facing German message. */
export function firebaseErrorMessage(e: unknown): string {
  const code = (e as { code?: string })?.code
  switch (code) {
    case 'permission-denied':
      return 'Kein Zugriff (permission-denied) — sind die Firestore-Regeln veröffentlicht?'
    case 'unavailable':
      return 'Firestore gerade nicht erreichbar (unavailable) — bitte erneut versuchen.'
    case 'unauthenticated':
      return 'Nicht angemeldet (unauthenticated) — bitte neu einloggen.'
    case 'failed-precondition':
      return 'Firestore-Abfrage nicht möglich (failed-precondition) — evtl. fehlt ein Index.'
    default:
      if (code) return `Fehler: ${code}`
      return e instanceof Error ? e.message : 'Unbekannter Fehler.'
  }
}
