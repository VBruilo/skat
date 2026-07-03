import { useEffect, useState } from 'react'
import type { SheetPlayer } from '../AddRoundSheet'
import { Avatar } from '../ui'

interface Props {
  players: SheetPlayer[]
  initialPoints?: Record<string, number>
  onChange: (points: Record<string, number>) => void
}

export default function AdjustmentForm({ players, initialPoints, onChange }: Props) {
  const [adjust, setAdjust] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const p of players) {
      const existing = initialPoints?.[p.uid]
      init[p.uid] = existing != null && existing !== 0 ? String(existing) : ''
    }
    return init
  })

  const points: Record<string, number> = {}
  for (const p of players) {
    const n = Number.parseInt(adjust[p.uid] ?? '', 10)
    points[p.uid] = Number.isFinite(n) ? n : 0
  }

  useEffect(() => {
    onChange(points)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adjust, onChange])

  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-500">
        Punkte frei pro Spieler vergeben (Korrektur o. Ä.). Minus mit vorangestelltem „−".
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
  )
}
