import { describe, it, expect } from 'vitest'
import { computeGameValue, formatGameLabel, normalizeSelection, describeRamsch } from './gameValue'
import type { RamschData } from './types'

describe('computeGameValue', () => {
  it('scores Grand by matadors + Spiel', () => {
    expect(computeGameValue({ kind: 'grand', matadors: 1 })).toBe(48) // 24 * (1+1)
    expect(computeGameValue({ kind: 'grand', matadors: 2 })).toBe(72) // 24 * (2+1)
  })

  it('scores Grand Hand', () => {
    expect(computeGameValue({ kind: 'grand', matadors: 1, hand: true })).toBe(72) // 24 * 3
  })

  it('scores Grand Hand Schneider (with the announced Schneider bonus)', () => {
    expect(
      computeGameValue({
        kind: 'grand',
        matadors: 1,
        hand: true,
        schneider: true,
        schneiderAngesagt: true,
      }),
    ).toBe(120) // 24 * (1+1+1+1+1)
  })

  it('scores suit games by their Grundwert', () => {
    expect(computeGameValue({ kind: 'suit', suit: 'karo', matadors: 1 })).toBe(18) // 9 * 2
    expect(computeGameValue({ kind: 'suit', suit: 'kreuz', matadors: 2 })).toBe(36) // 12 * 3
    expect(computeGameValue({ kind: 'suit', suit: 'herz', matadors: 1, hand: true })).toBe(30) // 10 * 3
  })

  it('uses fixed Null values, ignoring matadors/flags', () => {
    expect(computeGameValue({ kind: 'null', nullVariant: 'null', matadors: 4 })).toBe(23)
    expect(computeGameValue({ kind: 'null', nullVariant: 'nullHand' })).toBe(35)
    expect(computeGameValue({ kind: 'null', nullVariant: 'nullOuvert' })).toBe(46)
    expect(computeGameValue({ kind: 'null', nullVariant: 'nullHandOuvert' })).toBe(59)
  })

  it('applies loose Ouvert: Hand + Schneider + Schwarz + Ouvert (no announced bonuses)', () => {
    // 24 * (matadors 1 + Spiel 1 + Hand + Schneider + Schwarz + Ouvert) = 24 * 6
    expect(computeGameValue({ kind: 'grand', matadors: 1, ouvert: true })).toBe(144)
  })
})

describe('normalizeSelection', () => {
  it('forces Hand/Schneider/Schwarz on when Ouvert is set', () => {
    const n = normalizeSelection({ kind: 'grand', matadors: 1, ouvert: true })
    expect(n.hand).toBe(true)
    expect(n.schneider).toBe(true)
    expect(n.schwarz).toBe(true)
  })

  it('drops multiplier flags for Null and never emits undefined keys', () => {
    const n = normalizeSelection({ kind: 'null', nullVariant: 'nullHand', hand: true })
    expect(n).toEqual({ kind: 'null', nullVariant: 'nullHand' })
    expect(Object.values(n).some((v) => v === undefined)).toBe(false)
  })

  it('clears an announced bonus without its base flag', () => {
    const n = normalizeSelection({ kind: 'grand', matadors: 1, schneiderAngesagt: true })
    expect(n.schneiderAngesagt).toBe(false)
  })
})

describe('formatGameLabel', () => {
  it('labels mit/ohne Spitzen', () => {
    expect(formatGameLabel({ kind: 'grand', matadors: 2, withMatadors: true })).toBe('Grand mit 2')
    expect(formatGameLabel({ kind: 'suit', suit: 'kreuz', matadors: 3, withMatadors: false })).toBe(
      'Kreuz ohne 3',
    )
  })

  it('labels modifiers and Null variants', () => {
    expect(formatGameLabel({ kind: 'grand', matadors: 1, hand: true })).toBe('Grand mit 1 Hand')
    expect(formatGameLabel({ kind: 'null', nullVariant: 'nullOuvert' })).toBe('Null Ouvert')
  })
})

describe('describeRamsch', () => {
  const nameFor = (uid: string) => ({ a: 'Anna', b: 'Bert', c: 'Cara' })[uid] ?? uid

  it('names the loser and Augen', () => {
    const r: RamschData = { augen: { a: 40, b: 38, c: 42 }, jungfrau: false, durchmarschUid: null }
    expect(describeRamsch(r, nameFor)).toBe('Ramsch: Cara 42')
  })

  it('marks Jungfrau and Durchmarsch', () => {
    const j: RamschData = { augen: { a: 82, b: 38, c: 0 }, jungfrau: true, durchmarschUid: null }
    expect(describeRamsch(j, nameFor)).toBe('Ramsch: Anna 82 (Jungfrau)')
    const d: RamschData = { augen: { a: 0, b: 0, c: 120 }, jungfrau: false, durchmarschUid: 'c' }
    expect(describeRamsch(d, nameFor)).toBe('Durchmarsch: Cara')
  })
})
