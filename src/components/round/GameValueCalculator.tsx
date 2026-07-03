import { useEffect, useState } from 'react'
import type { GameKind, GameSelection, NullVariant, Suit } from '../../lib/types'
import { computeGameValue, normalizeSelection, SUIT_LABEL } from '../../lib/gameValue'

export interface GameValueResult {
  /** Positive Spielwert, or null when the current input is invalid/empty. */
  value: number | null
  /** Calculator selection; absent in manual mode. */
  meta?: GameSelection
}

interface Props {
  /** Rehydrate the calculator with a stored selection. */
  initialSelection?: GameSelection
  /** Rehydrate manual mode with a stored raw value (legacy rounds). */
  initialManualValue?: number | null
  onChange: (result: GameValueResult) => void
}

// Frequently played Spielwerte for quick manual entry.
const QUICK_VALUES = [18, 20, 22, 23, 24, 27, 30, 33, 35, 36, 40, 46, 48, 60]

const DEFAULT_SEL: GameSelection = { kind: 'grand', matadors: 1, withMatadors: true }

const SUITS: Suit[] = ['karo', 'herz', 'pik', 'kreuz']
const SUIT_SYMBOL: Record<Suit, string> = { karo: '♦', herz: '♥', pik: '♠', kreuz: '♣' }

const NULL_OPTIONS: { variant: NullVariant; label: string; value: number }[] = [
  { variant: 'null', label: 'Null', value: 23 },
  { variant: 'nullHand', label: 'Hand', value: 35 },
  { variant: 'nullOuvert', label: 'Ouvert', value: 46 },
  { variant: 'nullHandOuvert', label: 'Hand Ouvert', value: 59 },
]

function Toggle({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
        active ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-slate-200'
      } ${disabled ? 'opacity-50' : 'active:scale-95'}`}
    >
      {children}
    </button>
  )
}

export default function GameValueCalculator({ initialSelection, initialManualValue, onChange }: Props) {
  const [manual, setManual] = useState<boolean>(!initialSelection && initialManualValue != null)
  const [sel, setSel] = useState<GameSelection>(initialSelection ?? DEFAULT_SEL)
  const [manualStr, setManualStr] = useState<string>(
    initialManualValue != null ? String(initialManualValue) : '',
  )

  const norm = normalizeSelection(sel)
  const computed = computeGameValue(sel)

  // Report the current result upward. `onChange` is a stable useState setter,
  // so this only re-runs when the inputs actually change (no render loop).
  useEffect(() => {
    if (manual) {
      const v = Number.parseInt(manualStr, 10)
      onChange({ value: Number.isFinite(v) && v > 0 ? v : null })
    } else {
      onChange({ value: computed, meta: norm })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manual, manualStr, sel, onChange])

  const setKind = (kind: GameKind) =>
    setSel((s) => {
      if (kind === 'suit') return { ...s, kind, suit: s.suit ?? 'kreuz' }
      if (kind === 'null') return { ...s, kind, nullVariant: s.nullVariant ?? 'null' }
      return { ...s, kind }
    })

  const patch = (p: Partial<GameSelection>) => setSel((s) => ({ ...s, ...p }))

  if (manual) {
    return (
      <div className="space-y-2">
        <input
          type="number"
          inputMode="numeric"
          min={1}
          value={manualStr}
          onChange={(e) => setManualStr(e.target.value)}
          placeholder="z. B. 18"
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-2xl font-bold text-slate-800 outline-none focus:border-emerald-500"
        />
        <div className="flex flex-wrap gap-1.5">
          {QUICK_VALUES.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setManualStr(String(v))}
              className="rounded-lg bg-white px-2.5 py-1 text-sm font-medium text-slate-600 ring-1 ring-slate-200 active:scale-95"
            >
              {v}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setManual(false)}
          className="text-sm font-medium text-emerald-700 underline underline-offset-2"
        >
          ← Rechner benutzen
        </button>
      </div>
    )
  }

  const forcedHand = Boolean(sel.ouvert)
  const forcedSchneider = Boolean(sel.ouvert || sel.schwarz)
  const forcedSchwarz = Boolean(sel.ouvert)

  return (
    <div className="space-y-3">
      {/* Game kind */}
      <div className="grid grid-cols-3 gap-2">
        {(['grand', 'suit', 'null'] as const).map((k) => (
          <Toggle key={k} active={sel.kind === k} onClick={() => setKind(k)}>
            {k === 'grand' ? 'Grand' : k === 'suit' ? 'Farbe' : 'Null'}
          </Toggle>
        ))}
      </div>

      {sel.kind === 'suit' && (
        <div className="grid grid-cols-4 gap-2">
          {SUITS.map((s) => (
            <Toggle key={s} active={norm.suit === s} onClick={() => patch({ suit: s })}>
              <span className={s === 'karo' || s === 'herz' ? 'text-rose-500' : ''}>{SUIT_SYMBOL[s]}</span>{' '}
              {SUIT_LABEL[s]}
            </Toggle>
          ))}
        </div>
      )}

      {sel.kind === 'null' ? (
        <div className="grid grid-cols-2 gap-2">
          {NULL_OPTIONS.map((o) => (
            <Toggle
              key={o.variant}
              active={(sel.nullVariant ?? 'null') === o.variant}
              onClick={() => patch({ nullVariant: o.variant })}
            >
              {o.label} · {o.value}
            </Toggle>
          ))}
        </div>
      ) : (
        <>
          {/* Spitzen */}
          <div className="flex items-center gap-2">
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-200 p-1">
              <button
                type="button"
                onClick={() => patch({ withMatadors: true })}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  sel.withMatadors !== false ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                mit
              </button>
              <button
                type="button"
                onClick={() => patch({ withMatadors: false })}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  sel.withMatadors === false ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                ohne
              </button>
            </div>
            <div className="flex flex-1 items-center justify-between rounded-xl bg-white px-2 py-1.5 ring-1 ring-slate-200">
              <button
                type="button"
                aria-label="weniger Spitzen"
                onClick={() => patch({ matadors: Math.max(1, (sel.matadors ?? 1) - 1) })}
                className="h-8 w-8 rounded-lg text-xl font-bold text-slate-500 active:bg-slate-100"
              >
                −
              </button>
              <span className="text-base font-bold text-slate-800">{sel.matadors ?? 1} Spitzen</span>
              <button
                type="button"
                aria-label="mehr Spitzen"
                onClick={() => patch({ matadors: (sel.matadors ?? 1) + 1 })}
                className="h-8 w-8 rounded-lg text-xl font-bold text-slate-500 active:bg-slate-100"
              >
                +
              </button>
            </div>
          </div>

          {/* Modifiers */}
          <div className="flex flex-wrap gap-1.5">
            <Toggle active={norm.hand ?? false} disabled={forcedHand} onClick={() => patch({ hand: !sel.hand })}>
              Hand
            </Toggle>
            <Toggle
              active={norm.schneider ?? false}
              disabled={forcedSchneider}
              onClick={() => patch({ schneider: !sel.schneider })}
            >
              Schneider
            </Toggle>
            <Toggle
              active={Boolean(sel.schneiderAngesagt)}
              disabled={!norm.schneider}
              onClick={() => patch({ schneiderAngesagt: !sel.schneiderAngesagt })}
            >
              angesagt
            </Toggle>
            <Toggle
              active={norm.schwarz ?? false}
              disabled={forcedSchwarz}
              onClick={() => patch({ schwarz: !sel.schwarz })}
            >
              Schwarz
            </Toggle>
            <Toggle
              active={Boolean(sel.schwarzAngesagt)}
              disabled={!norm.schwarz}
              onClick={() => patch({ schwarzAngesagt: !sel.schwarzAngesagt })}
            >
              angesagt
            </Toggle>
            <Toggle active={Boolean(sel.ouvert)} onClick={() => patch({ ouvert: !sel.ouvert })}>
              Ouvert
            </Toggle>
          </div>
        </>
      )}

      <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-2.5 ring-1 ring-emerald-200">
        <span className="text-sm font-medium text-emerald-800">Spielwert</span>
        <span className="text-2xl font-black tabular-nums text-emerald-700">{computed}</span>
      </div>

      <button
        type="button"
        onClick={() => {
          setManualStr(String(computed))
          setManual(true)
        }}
        className="text-sm font-medium text-slate-500 underline underline-offset-2"
      >
        Wert manuell eingeben
      </button>
    </div>
  )
}
