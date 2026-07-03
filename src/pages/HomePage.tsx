import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { subscribeMySeries } from '../lib/series'
import { firebaseErrorMessage } from '../lib/errors'
import type { Series } from '../lib/types'
import { Avatar, Card, PageHeader, btnGhost, btnPrimary, btnSecondary } from '../components/ui'

export default function HomePage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [series, setSeries] = useState<Series[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setLoadError(null)
    return subscribeMySeries(user.uid, setSeries, (e) => {
      console.error(e)
      setLoadError(firebaseErrorMessage(e))
    })
  }, [user])

  if (!user) return null

  return (
    <div className="min-h-dvh bg-slate-100">
      <PageHeader
        title="Meine Runden"
        right={
          <button onClick={() => void signOut()} className={`${btnGhost} text-white/90`}>
            Abmelden
          </button>
        }
      />

      <main className="mx-auto max-w-md space-y-4 p-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
          <Avatar name={user.displayName ?? 'Du'} photoURL={user.photoURL} size={44} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-800">{user.displayName ?? 'Spieler'}</p>
            <p className="truncate text-sm text-slate-500">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button className={btnPrimary} onClick={() => navigate('/create')}>
            Neue Serie
          </button>
          <button className={btnSecondary} onClick={() => navigate('/join')}>
            Beitreten
          </button>
        </div>

        {loadError ? (
          <Card className="text-center">
            <p className="font-medium text-rose-600">Runden konnten nicht geladen werden.</p>
            <p className="mt-1 text-sm text-slate-500">{loadError}</p>
          </Card>
        ) : series === null ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
          </div>
        ) : series.length === 0 ? (
          <Card className="text-center text-slate-500">
            <p>Noch keine Serie.</p>
            <p className="mt-1 text-sm">Leg eine neue an oder tritt mit einem Code bei.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {series.map((s) => (
              <button
                key={s.id}
                onClick={() => navigate(`/series/${s.id}`)}
                className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm transition active:scale-[0.99]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-800">{s.name}</p>
                  <p className="text-sm text-slate-500">
                    {s.playerUids.length}/3 Spieler · Ziel {s.targetRounds} Runden
                  </p>
                </div>
                <div className="flex -space-x-2">
                  {s.playerUids.slice(0, 3).map((uid) => (
                    <div key={uid} className="rounded-full ring-2 ring-white">
                      <Avatar
                        name={s.playerInfo[uid]?.name ?? '?'}
                        photoURL={s.playerInfo[uid]?.photoURL}
                        size={32}
                      />
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
