import { useState } from 'react'
import type { GameSelection, PlayerInfo, RamschData, Round, RoundResult } from '../lib/types'
import { btnPrimary, btnSecondary } from './ui'
import GameForm from './round/GameForm'
import type { GameValueResult } from './round/GameValueCalculator'
import RamschForm from './round/RamschForm'
import type { RamschResult } from './round/RamschForm'
import AdjustmentForm from './round/AdjustmentForm'

export interface SheetPlayer {
  uid: string
  info: PlayerInfo
}

type Mode = 'game' | 'ramsch' | 'adjustment'

interface Props {
  players: SheetPlayer[]
  editing?: Round | null
  onClose: () => void
  onSubmitGame: (
    declarerUid: string,
    gameValue: number,
    result: RoundResult,
    gameMeta?: GameSelection,
  ) => Promise<void>
  onSubmitRamsch: (ramsch: RamschData) => Promise<void>
  onSubmitAdjustment: (points: Record<string, number>) => Promise<void>
  onDelete?: () => Promise<void>
}

const MODE_LABEL: Record<Mode, string> = { game: 'Spiel', ramsch: 'Ramsch', adjustment: 'Anpassung' }

export default function AddRoundSheet({
  players,
  editing,
  onClose,
  onSubmitGame,
  onSubmitRamsch,
  onSubmitAdjustment,
  onDelete,
}: Props) {
  const isEditing = Boolean(editing)
  const [mode, setMode] = useState<Mode>((editing?.type as Mode) ?? 'game')

  // Game state
  const [declarerUid, setDeclarerUid] = useState<string | null>(editing?.declarerUid ?? null)
  const [result, setResult] = useState<RoundResult>(editing?.result ?? 'won')
  const [gameValue, setGameValue] = useState<GameValueResult>({ value: null })

  // Ramsch / adjustment results (seeded by each form's mount effect)
  const [ramschResult, setRamschResult] = useState<RamschResult>({
    ramsch: { augen: {}, jungfrau: false, durchmarschUid: null },
    valid: false,
  })
  const [adjustPoints, setAdjustPoints] = useState<Record<string, number>>({})

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initialSelection = editing?.type === 'game' ? editing.gameMeta : undefined
  const initialManualValue =
    editing?.type === 'game' && !editing.gameMeta ? editing.gameValue : null

  const submit = async () => {
    setError(null)
    try {
      setBusy(true)
      if (mode === 'game') {
        if (!declarerUid) {
          setError('Bitte den Alleinspieler wählen.')
          return
        }
        if (gameValue.value == null || gameValue.value <= 0) {
          setError('Bitte einen gültigen Spielwert (> 0) eingeben.')
          return
        }
        await onSubmitGame(declarerUid, gameValue.value, result, gameValue.meta)
      } else if (mode === 'ramsch') {
        if (!ramschResult.valid) {
          setError('Augen müssen zusammen 120 ergeben (oder einen Durchmarsch wählen).')
          return
        }
        await onSubmitRamsch(ramschResult.ramsch)
      } else {
        await onSubmitAdjustment(adjustPoints)
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
    <div
      className="fixed inset-0 z-30 flex flex-col justify-end bg-black/40 animate-[fadeIn_150ms_ease-out]"
      onClick={onClose}
    >
      <div
        className="max-h-[90dvh] overflow-y-auto rounded-t-3xl bg-slate-50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl animate-[slideUp_200ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300" />
        <h2 className="mb-3 text-center text-lg font-bold text-slate-800">
          {isEditing ? 'Runde bearbeiten' : 'Runde eintragen'}
        </h2>

        <div className="mb-4 grid grid-cols-3 gap-2 rounded-2xl bg-slate-200 p-1">
          {(['game', 'ramsch', 'adjustment'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-xl py-2 text-sm font-semibold transition ${
                mode === m ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'
              }`}
            >
              {MODE_LABEL[m]}
            </button>
          ))}
        </div>

        {mode === 'game' && (
          <GameForm
            players={players}
            declarerUid={declarerUid}
            onDeclarer={setDeclarerUid}
            result={result}
            onResult={setResult}
            initialSelection={initialSelection}
            initialManualValue={initialManualValue}
            onValueChange={setGameValue}
            previewValue={gameValue.value}
          />
        )}
        {mode === 'ramsch' && (
          <RamschForm
            players={players}
            initial={editing?.type === 'ramsch' ? editing.ramsch : undefined}
            onChange={setRamschResult}
          />
        )}
        {mode === 'adjustment' && (
          <AdjustmentForm
            players={players}
            initialPoints={editing?.type === 'adjustment' ? editing.points : undefined}
            onChange={setAdjustPoints}
          />
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
