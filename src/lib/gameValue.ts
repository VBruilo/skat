import type { GameSelection, NullVariant, RamschData, Suit } from './types'

/** Grundwerte. */
export const GRAND_BASE = 24
export const SUIT_BASE: Record<Suit, number> = { karo: 9, herz: 10, pik: 11, kreuz: 12 }
export const NULL_VALUES: Record<NullVariant, number> = {
  null: 23,
  nullHand: 35,
  nullOuvert: 46,
  nullHandOuvert: 59,
}

export const SUIT_LABEL: Record<Suit, string> = {
  karo: 'Karo',
  herz: 'Herz',
  pik: 'Pik',
  kreuz: 'Kreuz',
}

const NULL_LABEL: Record<NullVariant, string> = {
  null: 'Null',
  nullHand: 'Null Hand',
  nullOuvert: 'Null Ouvert',
  nullHandOuvert: 'Null Hand Ouvert',
}

/**
 * Cleans up a selection so it is internally consistent and free of `undefined`
 * keys (safe to store in Firestore):
 * - Null games drop all multiplier flags.
 * - Ouvert implies Hand + Schneider + Schwarz (loose: not the "angesagt" bonuses).
 * - Schwarz implies Schneider; an "angesagt" bonus needs its base flag set.
 * - matadors is at least 1.
 */
export function normalizeSelection(sel: GameSelection): GameSelection {
  if (sel.kind === 'null') {
    return { kind: 'null', nullVariant: sel.nullVariant ?? 'null' }
  }
  const n: GameSelection = {
    kind: sel.kind,
    matadors: Math.max(1, Math.floor(sel.matadors ?? 1)),
    withMatadors: sel.withMatadors ?? true,
    hand: Boolean(sel.hand),
    schneider: Boolean(sel.schneider),
    schneiderAngesagt: Boolean(sel.schneiderAngesagt),
    schwarz: Boolean(sel.schwarz),
    schwarzAngesagt: Boolean(sel.schwarzAngesagt),
    ouvert: Boolean(sel.ouvert),
  }
  if (sel.kind === 'suit') n.suit = sel.suit ?? 'kreuz'
  if (n.ouvert) {
    n.hand = true
    n.schneider = true
    n.schwarz = true
  }
  if (n.schwarz) n.schneider = true
  if (!n.schneider) n.schneiderAngesagt = false
  if (!n.schwarz) n.schwarzAngesagt = false
  return n
}

/** The numeric Spielwert for a selection (feeds the won/lost scoring). */
export function computeGameValue(sel: GameSelection): number {
  const s = normalizeSelection(sel)
  if (s.kind === 'null') return NULL_VALUES[s.nullVariant ?? 'null']
  const base = s.kind === 'grand' ? GRAND_BASE : SUIT_BASE[s.suit ?? 'kreuz']
  let mult = (s.matadors ?? 1) + 1 // Spitzen + Spiel
  if (s.hand) mult += 1
  if (s.schneider) mult += 1
  if (s.schneiderAngesagt) mult += 1
  if (s.schwarz) mult += 1
  if (s.schwarzAngesagt) mult += 1
  if (s.ouvert) mult += 1
  return base * mult
}

/** A readable German label, e.g. "Grand Hand Schneider", "Kreuz mit 2", "Null Ouvert". */
export function formatGameLabel(sel: GameSelection): string {
  const s = normalizeSelection(sel)
  if (s.kind === 'null') return NULL_LABEL[s.nullVariant ?? 'null']
  const parts: string[] = [s.kind === 'grand' ? 'Grand' : SUIT_LABEL[s.suit ?? 'kreuz']]
  parts.push(`${s.withMatadors ? 'mit' : 'ohne'} ${s.matadors ?? 1}`)
  if (s.hand) parts.push('Hand')
  if (s.schneider) parts.push('Schneider')
  if (s.schneiderAngesagt) parts.push('angesagt')
  if (s.schwarz) parts.push('Schwarz')
  if (s.schwarzAngesagt) parts.push('angesagt')
  if (s.ouvert) parts.push('Ouvert')
  return parts.join(' ')
}

/** A readable German summary of a Ramsch outcome for the round log. */
export function describeRamsch(ramsch: RamschData, nameFor: (uid: string) => string): string {
  if (ramsch.durchmarschUid) return `Durchmarsch: ${nameFor(ramsch.durchmarschUid)}`
  const entries = Object.entries(ramsch.augen)
  if (entries.length === 0) return 'Ramsch'
  const max = Math.max(...entries.map(([, a]) => a))
  if (max <= 0) return 'Ramsch'
  const losers = entries
    .filter(([, a]) => a === max)
    .map(([uid, a]) => `${nameFor(uid)} ${a}`)
    .join(' · ')
  return `Ramsch: ${losers}${ramsch.jungfrau ? ' (Jungfrau)' : ''}`
}
