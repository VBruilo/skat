import { useEffect, useState } from 'react'
import type { RamschData } from '../../lib/types'
import type { SheetPlayer } from '../AddRoundSheet'
import { Avatar } from '../ui'

export interface RamschResult {
  ramsch: RamschData
  valid: boolean
}

interface Props {
  players: SheetPlayer[]
  initial?: RamschData
  onChange: (result: RamschResult) => void
}

export default function RamschForm({ players, initial, onChange }: Props) {
  const [augenStr, setAugenStr] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const p of players) {
      const a = initial?.augen[p.uid]
      init[p.uid] = a != null && a !== 0 ? String(a) : ''
    }
    return init
  })
  const [jungfrau, setJungfrau] = useState<boolean>(initial?.jungfrau ?? false)
  const [durchmarschUid, setDurchmarschUid] = useState<string | null>(initial?.durchmarschUid ?? null)

  const augen: Record<string, number> = {}
  for (const p of players) {
    const n = Number.parseInt(augenStr[p.uid] ?? '', 10)
    augen[p.uid] = Number.isFinite(n) ? n : 0
  }
  const sum = players.reduce((acc, p) => acc + augen[p.uid], 0)
  const valid = durchmarschUid ? true : sum === 120

  useEffect(() => {
    onChange({ ramsch: { augen, jungfrau, durchmarschUid }, valid })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [augenStr, jungfrau, durchmarschUid, onChange])

  return (
    <div className="space-y-3">
      {!durchmarschUid && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-medium text-slate-600">Augen pro Spieler</p>
            <span
              className={`text-sm font-bold tabular-nums ${
                sum === 120 ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {sum} / 120
            </span>
          </div>
          {players.map((p) => (
            <div key={p.uid} className="flex items-center gap-3 rounded-2xl bg-white p-2">
              <Avatar name={p.info.name} photoURL={p.info.photoURL} size={40} />
              <span className="min-w-0 flex-1 truncate font-medium text-slate-700">{p.info.name}</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={120}
                value={augenStr[p.uid] ?? ''}
                onChange={(e) => setAugenStr((a) => ({ ...a, [p.uid]: e.target.value }))}
                placeholder="0"
                className="w-24 rounded-xl border border-slate-300 px-3 py-2 text-center text-lg font-bold text-slate-800 outline-none focus:border-emerald-500"
              />
            </div>
          ))}
          <p className="px-1 text-xs text-slate-400">
            Augen müssen zusammen 120 ergeben (Skat zum letzten Stich zählen). Verlierer = meiste Augen.
          </p>
        </div>
      )}

      {/* Jungfrau */}
      {!durchmarschUid && (
        <button
          type="button"
          onClick={() => setJungfrau((j) => !j)}
          className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition ${
            jungfrau ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-slate-200'
          }`}
        >
          <span className="text-sm font-semibold">Jungfrau (jemand ohne Stich)</span>
          <span className="text-xs opacity-80">{jungfrau ? 'Verlust ×2' : 'aus'}</span>
        </button>
      )}

      {/* Durchmarsch */}
      <div>
        <label className="mb-1.5 block px-1 text-sm font-medium text-slate-600">Durchmarsch</label>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setDurchmarschUid(null)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
              !durchmarschUid ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-slate-200'
            }`}
          >
            keiner
          </button>
          {players.map((p) => (
            <button
              key={p.uid}
              type="button"
              onClick={() => setDurchmarschUid(p.uid)}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                durchmarschUid === p.uid
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200'
              }`}
            >
              {p.info.name}
            </button>
          ))}
        </div>
        {durchmarschUid && (
          <p className="mt-2 px-1 text-xs text-slate-500">
            {players.find((p) => p.uid === durchmarschUid)?.info.name} bekommt +120.
          </p>
        )}
      </div>
    </div>
  )
}
