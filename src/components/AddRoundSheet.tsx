import { useState } from 'react'
import type { PlayerInfo, Round, RoundResult } from '../lib/types'
import { Avatar, btnPrimary, btnSecondary } from './ui'

export interface SheetPlayer {
  uid: string
  info: PlayerInfo
}

interface Props {
  players: SheetPlayer[]
  editing?: Round | null
  onClose: () => void
  onSubmitGame: (declarerUid: string, gameValue: number, result: RoundResult) => Promise<void>
  onSubmitAdjustment: (points: Record<string, number>) => Promise<void>
  onDelete?: () => Promise<void>
}

// Frequently played Spielwerte for quick entry.
const QUICK_VALUES = [18, 20, 22, 23, 24, 27, 30, 33, 35, 36, 40, 46, 48, 60]

export default function AddRoundSheet({
  players,
  editing,
  onClose,
  onSubmitGame,
  onSubmitAdjustment,
  onDelete,
}: Props) {
  const isEditing = Boolean(editing)
  const [mode, setMode] = useState<'game' | 'adjustment'>(editing?.type ?? 'game')

  const [declarerUid, setDeclarerUid] = useState<string | null>(editing?.declarerUid ?? null)
  const [valueStr, setValueStr] = useState<string>(editing?.gameValue ? String(editing.gameValue) : '')
  const [result, setResult] = useState<RoundResult>(editing?.result ?? 'won')

  const [adjust, setAdjust] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const p of players) {
      const existing = editing?.type === 'adjustment' ? editing.points[p.uid] : undefined
      init[p.uid] = existing != null && existing !== 0 ? String(existing) : ''
    }
    return init
  })

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    try {
      setBusy(true)
      if (mode === 'game') {
        if (!declarerUid) {
          setError('Bitte den Alleinspieler wählen.')
          return
        }
        const value = Number.parseInt(valueStr, 10)
        if (!Number.isFinite(value) || value <= 0) {
          setError('Bitte einen gültigen Spielwert (> 0) eingeben.')
          return
        }
        await onSubmitGame(declarerUid, value, result)
      } else {
        const points: Record<string, number> = {}
        for (const p of players) {
          const n = Number.parseInt(adjust[p.uid] ?? '', 10)
          points[p.uid] = Number.isFinite(n) ? n : 0
        }
        await onSubmitAdjustment(points)
      }
      onClose()
    } catch {
      setError('Speichern fehlgeschlagen. Bitte erneut versuchen.')
    } finally {
      setBusy(false)
    }
  }

  const del = async () => {
    if (!onDelete) return
    if (!confirm('Diese Runde wirklich löschen?')) return
    try {
      setBusy(true)
      await onDelete()
      onClose()
    } catch {
      setError('Löschen fehlgeschlagen.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-end bg-black/40" onClick={onClose}>
      <div
        className="max-h-[90dvh] overflow-y-auto rounded-t-3xl bg-slate-50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300" />
        <h2 className="mb-3 text-center text-lg font-bold text-slate-800">
          {isEditing ? 'Runde bearbeiten' : 'Runde eintragen'}
        </h2>

        {!isEditing && (
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-200 p-1">
            {(['game', 'adjustment'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-xl py-2 text-sm font-semibold transition ${
                  mode === m ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                {m === 'game' ? 'Spiel' : 'Anpassung / Ramsch'}
              </button>
            ))}
          </div>
        )}

        {mode === 'game' ? (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">Alleinspieler</label>
              <div className="grid grid-cols-3 gap-2">
                {players.map((p) => (
                  <button
                    key={p.uid}
                    onClick={() => setDeclarerUid(p.uid)}
                    className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-2 transition ${
                      declarerUid === p.uid
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-transparent bg-white'
                    }`}
                  >
                    <Avatar name={p.info.name} photoURL={p.info.photoURL} size={44} />
                    <span className="w-full truncate text-center text-xs font-medium text-slate-700">
                      {p.info.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">Spielwert</label>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={valueStr}
                onChange={(e) => setValueStr(e.target.value)}
                placeholder="z. B. 18"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-2xl font-bold text-slate-800 outline-none focus:border-emerald-500"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {QUICK_VALUES.map((v) => (
                  <button
                    key={v}
                    onClick={() => setValueStr(String(v))}
                    className="rounded-lg bg-white px-2.5 py-1 text-sm font-medium text-slate-600 ring-1 ring-slate-200 active:scale-95"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">Ergebnis</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setResult('won')}
                  className={`rounded-2xl py-3 text-base font-bold transition ${
                    result === 'won'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white text-slate-500 ring-1 ring-slate-200'
                  }`}
                >
                  Gewonnen
                </button>
                <button
                  onClick={() => setResult('lost')}
                  className={`rounded-2xl py-3 text-base font-bold transition ${
                    result === 'lost'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-white text-slate-500 ring-1 ring-slate-200'
                  }`}
                >
                  Verloren
                </button>
              </div>
              {valueStr && Number.parseInt(valueStr, 10) > 0 && (
                <p className="mt-2 text-center text-sm text-slate-500">
                  {result === 'won'
                    ? `Alleinspieler bekommt +${Number.parseInt(valueStr, 10)}`
                    : `Alleinspieler bekommt −${2 * Number.parseInt(valueStr, 10)}`}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-slate-500">
              Punkte frei pro Spieler vergeben (z. B. Ramsch oder Korrektur). Minus mit vorangestelltem „−".
            </p>
            {players.map((p) => (
              <div key={p.uid} className="flex items-center gap-3 rounded-2xl bg-white p-2">
                <Avatar name={p.info.name} photoURL={p.info.photoURL} size={40} />
                <span className="min-w-0 flex-1 truncate font-medium text-slate-700">{p.info.name}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={adjust[p.uid] ?? ''}
                  onChange={(e) => setAdjust((a) => ({ ...a, [p.uid]: e.target.value }))}
                  placeholder="0"
                  className="w-24 rounded-xl border border-slate-300 px-3 py-2 text-center text-lg font-bold text-slate-800 outline-none focus:border-emerald-500"
                />
              </div>
            ))}
          </div>
        )}

        {error && <p className="mt-3 text-center text-sm font-medium text-rose-600">{error}</p>}

        <div className="mt-5 flex flex-col gap-2">
          <button className={btnPrimary} onClick={submit} disabled={busy}>
            {isEditing ? 'Speichern' : 'Eintragen'}
          </button>
          <div className="flex gap-2">
            <button className={`${btnSecondary} flex-1`} onClick={onClose} disabled={busy}>
              Abbrechen
            </button>
            {isEditing && onDelete && (
              <button
                className="min-h-12 flex-1 rounded-2xl bg-rose-50 px-5 py-3 font-semibold text-rose-600 ring-1 ring-rose-200 active:scale-[0.98] disabled:opacity-50"
                onClick={del}
                disabled={busy}
              >
                Löschen
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
