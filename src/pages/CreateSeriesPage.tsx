import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { createSeries } from '../lib/series'
import { firebaseErrorMessage } from '../lib/errors'
import { PageHeader, btnPrimary } from '../components/ui'

export default function CreateSeriesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [target, setTarget] = useState('36')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user) return null

  const submit = async () => {
    setError(null)
    const targetRounds = Number.parseInt(target, 10)
    if (!Number.isFinite(targetRounds) || targetRounds <= 0) {
      setError('Bitte eine gültige Rundenzahl eingeben.')
      return
    }
    try {
      setBusy(true)
      const id = await createSeries(user, name, targetRounds)
      navigate(`/series/${id}`, { replace: true })
    } catch (e) {
      console.error(e)
      setError(firebaseErrorMessage(e))
      setBusy(false)
    }
  }

  return (
    <div className="min-h-dvh bg-slate-100">
      <PageHeader title="Neue Serie" onBack={() => navigate('/')} />
      <main className="mx-auto max-w-md space-y-4 p-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600">Name der Serie</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z. B. Skatabend Freitag"
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600">Ziel-Rundenzahl</label>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-emerald-500"
          />
          <p className="mt-1 text-xs text-slate-500">Standard 36 (eine Serie am Dreiertisch).</p>
        </div>

        {error && <p className="text-center text-sm font-medium text-rose-600">{error}</p>}

        <button className={`${btnPrimary} w-full`} onClick={submit} disabled={busy}>
          {busy ? 'Wird angelegt…' : 'Serie anlegen'}
        </button>
      </main>
    </div>
  )
}
