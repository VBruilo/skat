import { useState } from 'react'
import { useAuth } from '../lib/auth'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignIn = async () => {
    setBusy(true)
    setError(null)
    try {
      await signIn()
    } catch {
      setError('Anmeldung fehlgeschlagen. Popup blockiert? Bitte erneut versuchen.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-emerald-800 p-6 text-white">
      <div className="text-center">
        <div className="mb-4 text-6xl">♣ ♠</div>
        <h1 className="text-3xl font-black tracking-tight">Skat-Punkteliste</h1>
        <p className="mt-2 text-white/70">Punkte eintragen, Liste teilen, Sieger küren.</p>
      </div>

      <button
        onClick={handleSignIn}
        disabled={busy}
        className="flex min-h-12 items-center gap-3 rounded-2xl bg-white px-6 py-3 text-base font-semibold text-slate-800 shadow-lg transition active:scale-[0.98] disabled:opacity-60"
      >
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 14-5.4l-6.5-5.5C29.6 34.7 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.5 5.5C41.4 36.9 44 31 44 24c0-1.3-.1-2.3-.4-3.5z" />
        </svg>
        {busy ? 'Anmelden…' : 'Mit Google anmelden'}
      </button>

      {error && <p className="max-w-xs text-center text-sm text-rose-200">{error}</p>}
    </div>
  )
}
