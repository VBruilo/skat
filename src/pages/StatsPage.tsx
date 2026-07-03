import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { subscribeSeries } from '../lib/series'
import { subscribeRounds } from '../lib/rounds'
import { gamesPlayed, standings } from '../lib/scoring'
import type { Round, Series } from '../lib/types'
import { Avatar, FullScreenMessage, PageHeader, formatSigned } from '../components/ui'

export default function StatsPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [series, setSeries] = useState<Series | null | undefined>(undefined)
  const [rounds, setRounds] = useState<Round[]>([])

  useEffect(() => {
    if (!id) return
    return subscribeSeries(id, setSeries)
  }, [id])

  useEffect(() => {
    if (!id) return
    return subscribeRounds(id, setRounds)
  }, [id])

  const rows = useMemo(
    () => (series ? standings(series.playerUids, rounds) : []),
    [series, rounds],
  )

  if (series === undefined) {
    return (
      <FullScreenMessage>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
      </FullScreenMessage>
    )
  }

  if (series === null) {
    return (
      <div className="min-h-dvh bg-slate-100">
        <PageHeader title="Statistik" onBack={() => navigate('/')} />
        <div className="p-6 text-center text-slate-500">Serie nicht gefunden oder kein Zugriff.</div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-slate-100">
      <PageHeader title="Statistik" onBack={() => navigate(`/series/${series.id}`)} />
      <main className="mx-auto max-w-md space-y-3 p-4">
        <p className="px-1 text-sm text-slate-500">{gamesPlayed(rounds)} Spiele gespielt</p>
        {rows.map((s) => (
          <div key={s.uid} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Avatar
                name={series.playerInfo[s.uid]?.name ?? '?'}
                photoURL={series.playerInfo[s.uid]?.photoURL}
                size={44}
              />
              <span className="min-w-0 flex-1 truncate font-semibold text-slate-800">
                {series.playerInfo[s.uid]?.name ?? 'Spieler'}
                {s.uid === user?.uid && <span className="ml-1 text-xs text-emerald-600">(Du)</span>}
              </span>
              <span
                className={`text-2xl font-black tabular-nums ${
                  s.total > 0 ? 'text-emerald-600' : s.total < 0 ? 'text-rose-600' : 'text-slate-400'
                }`}
              >
                {formatSigned(s.total)}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <Stat label="Gespielt" value={s.gamesDeclared} />
              <Stat label="Gewonnen" value={s.gamesWon} accent="text-emerald-600" />
              <Stat label="Verloren" value={s.gamesLost} accent="text-rose-600" />
            </div>
            <p className="mt-2 text-center text-xs text-slate-500">
              Gewinnquote als Alleinspieler:{' '}
              <span className="font-semibold text-slate-700">
                {s.gamesDeclared > 0 ? `${Math.round(s.winRate * 100)}%` : '–'}
              </span>
            </p>
          </div>
        ))}
      </main>
    </div>
  )
}

function Stat({ label, value, accent = 'text-slate-800' }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 py-2">
      <p className={`text-xl font-bold tabular-nums ${accent}`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}
