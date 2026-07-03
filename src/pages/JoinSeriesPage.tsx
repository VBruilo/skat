import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { joinSeriesByCode } from '../lib/series'
import { normalizeInviteCode } from '../lib/inviteCode'
import { PageHeader, btnPrimary } from '../components/ui'

export default function JoinSeriesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const params = useParams()
  const [code, setCode] = useState(normalizeInviteCode(params.code ?? ''))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user) return null

  const submit = async () => {
    setError(null)
    try {
      setBusy(true)
      const seriesId = await joinSeriesByCode(user, code)
      navigate(`/series/${seriesId}`, { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Beitreten fehlgeschlagen.')
      setBusy(false)
    }
  }

  return (
    <div className="min-h-dvh bg-slate-100">
      <PageHeader title="Serie beitreten" onBack={() => navigate('/')} />
      <main className="mx-auto max-w-md space-y-4 p-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600">Einladungscode</label>
          <input
            value={code}
            onChange={(e) => setCode(normalizeInviteCode(e.target.value))}
            placeholder="z. B. K7M2QP"
            autoCapitalize="characters"
            autoComplete="off"
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-center text-2xl font-bold tracking-[0.3em] outline-none focus:border-emerald-500"
          />
        </div>

        {error && <p className="text-center text-sm font-medium text-rose-600">{error}</p>}

        <button className={`${btnPrimary} w-full`} onClick={submit} disabled={busy || !code}>
          {busy ? 'Beitreten…' : 'Beitreten'}
        </button>
      </main>
    </div>
  )
}
