import type { GameSelection, RoundResult } from '../../lib/types'
import type { SheetPlayer } from '../AddRoundSheet'
import { Avatar } from '../ui'
import GameValueCalculator from './GameValueCalculator'
import type { GameValueResult } from './GameValueCalculator'

interface Props {
  players: SheetPlayer[]
  declarerUid: string | null
  onDeclarer: (uid: string) => void
  result: RoundResult
  onResult: (r: RoundResult) => void
  initialSelection?: GameSelection
  initialManualValue?: number | null
  onValueChange: (r: GameValueResult) => void
  previewValue: number | null
}

export default function GameForm({
  players,
  declarerUid,
  onDeclarer,
  result,
  onResult,
  initialSelection,
  initialManualValue,
  onValueChange,
  previewValue,
}: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-600">Alleinspieler</label>
        <div className="grid grid-cols-3 gap-2">
          {players.map((p) => (
            <button
              key={p.uid}
              type="button"
              onClick={() => onDeclarer(p.uid)}
              className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-2 transition ${
                declarerUid === p.uid ? 'border-emerald-500 bg-emerald-50' : 'border-transparent bg-white'
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
        <label className="mb-1.5 block text-sm font-medium text-slate-600">Spiel</label>
        <GameValueCalculator
          initialSelection={initialSelection}
          initialManualValue={initialManualValue}
          onChange={onValueChange}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-600">Ergebnis</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onResult('won')}
            className={`rounded-2xl py-3 text-base font-bold transition ${
              result === 'won' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-500 ring-1 ring-slate-200'
            }`}
          >
            Gewonnen
          </button>
          <button
            type="button"
            onClick={() => onResult('lost')}
            className={`rounded-2xl py-3 text-base font-bold transition ${
              result === 'lost' ? 'bg-rose-600 text-white shadow-sm' : 'bg-white text-slate-500 ring-1 ring-slate-200'
            }`}
          >
            Verloren
          </button>
        </div>
        {previewValue != null && previewValue > 0 && (
          <p className="mt-2 text-center text-sm text-slate-500">
            {result === 'won'
              ? `Alleinspieler bekommt +${previewValue}`
              : `Alleinspieler bekommt −${2 * previewValue}`}
          </p>
        )}
      </div>
    </div>
  )
}
