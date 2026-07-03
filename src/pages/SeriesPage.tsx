import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { subscribeSeries } from '../lib/series'
import {
  addAdjustmentRound,
  addGameRound,
  deleteRound,
  nextSeq,
  subscribeRounds,
  updateAdjustmentRound,
  updateGameRound,
} from '../lib/rounds'
import { gamesPlayed, standings } from '../lib/scoring'
import type { Round, RoundResult, Series } from '../lib/types'
import AddRoundSheet from '../components/AddRoundSheet'
import type { SheetPlayer } from '../components/AddRoundSheet'
import { Avatar, FullScreenMessage, PageHeader, btnPrimary, formatSigned } from '../components/ui'

export default function SeriesPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [series, setSeries] = useState<Series | null | undefined>(undefined)
  const [rounds, setRounds] = useState<Round[]>([])
  const [sheet, setSheet] = useState<{ open: boolean; editing: Round | null }>({
    open: false,
    editing: null,
  })

  useEffect(() => {
    if (!id) return
    return subscribeSeries(id, setSeries)
  }, [id])

  useEffect(() => {
    if (!id) return
    return subscribeRounds(id, setRounds)
  }, [id])

  const players: SheetPlayer[] = useMemo(
    () =>
      series
        ? series.playerUids.map((uid) => ({
            uid,
            info: series.playerInfo[uid] ?? { name: 'Spieler', photoURL: null },
          }))
        : [],
    [series],
  )

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
        <PageHeader title="Serie" onBack={() => navigate('/')} />
        <div className="p-6 text-center text-slate-500">
          Serie nicht gefunden oder kein Zugriff.
        </div>
      </div>
    )
  }

  const played = gamesPlayed(rounds)
  const progress = Math.min(100, Math.round((played / Math.max(1, series.targetRounds)) * 100))
  const nameFor = (uid: string | null) =>
    (uid && series.playerInfo[uid]?.name) || 'Spieler'

  const onSubmitGame = async (declarerUid: string, gameValue: number, result: RoundResult) => {
    if (!id || !user) return
    if (sheet.editing) {
      await updateGameRound(id, sheet.editing.id, series.playerUids, declarerUid, gameValue, result)
    } else {
      await addGameRound(id, user, series.playerUids, declarerUid, gameValue, result, nextSeq(rounds))
    }
  }

  const onSubmitAdjustment = async (points: Record<string, number>) => {
    if (!id || !user) return
    if (sheet.editing) {
      await updateAdjustmentRound(id, sheet.editing.id, points)
    } else {
      await addAdjustmentRound(id, user, points, nextSeq(rounds))
    }
  }

  const onDelete = async () => {
    if (!id || !sheet.editing) return
    await deleteRound(id, sheet.editing.id)
  }

  const shareUrl = `${window.location.origin}${window.location.pathname}#/join/${series.inviteCode}`
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: series.name,
          text: `Tritt meiner Skat-Runde bei (Code ${series.inviteCode}):`,
          url: shareUrl,
        })
      } catch {
        /* user cancelled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl)
        alert('Einladungslink kopiert!')
      } catch {
        alert(`Einladungslink: ${shareUrl}`)
      }
    }
  }

  return (
    <div className="min-h-dvh bg-slate-100 pb-28">
      <PageHeader
        title={series.name}
        onBack={() => navigate('/')}
        right={
          <button
            onClick={() => navigate(`/series/${series.id}/stats`)}
            className="rounded-xl p-2 text-white/90 active:bg-white/10"
            aria-label="Statistik"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 20V10M10 20V4M16 20v-6M20 20H2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        }
      />

      <main className="mx-auto max-w-md space-y-4 p-4">
        {/* Standings */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {rows.map((r, i) => (
            <div
              key={r.uid}
              className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-slate-100' : ''}`}
            >
              <span className="w-5 text-center text-sm font-bold text-slate-400">{i + 1}</span>
              <Avatar
                name={series.playerInfo[r.uid]?.name ?? '?'}
                photoURL={series.playerInfo[r.uid]?.photoURL}
                size={40}
              />
              <span className="min-w-0 flex-1 truncate font-semibold text-slate-800">
                {series.playerInfo[r.uid]?.name ?? 'Spieler'}
                {r.uid === user?.uid && <span className="ml-1 text-xs text-emerald-600">(Du)</span>}
              </span>
              <span
                className={`text-2xl font-black tabular-nums ${
                  r.total > 0 ? 'text-emerald-600' : r.total < 0 ? 'text-rose-600' : 'text-slate-400'
                }`}
              >
                {formatSigned(r.total)}
              </span>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-1.5 flex justify-between text-sm font-medium text-slate-600">
            <span>Fortschritt</span>
            <span>
              {played} / {series.targetRounds} Runden
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Invite banner */}
        {series.playerUids.length < 3 && (
          <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
            <p className="text-sm font-medium text-emerald-800">
              Noch {3 - series.playerUids.length} Spieler fehlen. Teile den Code:
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="flex-1 rounded-xl bg-white px-3 py-2 text-center text-xl font-black tracking-[0.2em] text-slate-800">
                {series.inviteCode}
              </span>
              <button className={btnPrimary} onClick={share}>
                Teilen
              </button>
            </div>
          </div>
        )}

        {/* Rounds log */}
        <div>
          <h2 className="mb-2 px-1 text-sm font-semibold text-slate-500">Runden</h2>
          {rounds.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
              Noch keine Runde eingetragen.
            </div>
          ) : (
            <div className="space-y-1.5">
              {[...rounds].reverse().map((round) => (
                <button
                  key={round.id}
                  onClick={() => setSheet({ open: true, editing: round })}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-2.5 text-left shadow-sm transition active:scale-[0.99]"
                >
                  <span className="w-6 text-center text-xs font-bold text-slate-300">{round.seq}</span>
                  <div className="min-w-0 flex-1">
                    {round.type === 'game' ? (
                      <>
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {nameFor(round.declarerUid)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Spielwert {round.gameValue} ·{' '}
                          <span className={round.result === 'won' ? 'text-emerald-600' : 'text-rose-600'}>
                            {round.result === 'won' ? 'gewonnen' : 'verloren'}
                          </span>
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-slate-800">Anpassung</p>
                        <p className="truncate text-xs text-slate-500">
                          {players
                            .map((p) => round.points[p.uid])
                            .some((v) => v)
                            ? players
                                .filter((p) => round.points[p.uid])
                                .map((p) => `${p.info.name.split(' ')[0]} ${formatSigned(round.points[p.uid])}`)
                                .join(' · ')
                            : 'keine Punkte'}
                        </p>
                      </>
                    )}
                  </div>
                  {round.type === 'game' && round.declarerUid && (
                    <span
                      className={`text-lg font-bold tabular-nums ${
                        (round.points[round.declarerUid] ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {formatSigned(round.points[round.declarerUid] ?? 0)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Bottom action */}
      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/90 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto max-w-md">
          <button className={`${btnPrimary} w-full`} onClick={() => setSheet({ open: true, editing: null })}>
            + Runde eintragen
          </button>
        </div>
      </div>

      {sheet.open && (
        <AddRoundSheet
          players={players}
          editing={sheet.editing}
          onClose={() => setSheet({ open: false, editing: null })}
          onSubmitGame={onSubmitGame}
          onSubmitAdjustment={onSubmitAdjustment}
          onDelete={sheet.editing ? onDelete : undefined}
        />
      )}
    </div>
  )
}
