import { describe, it, expect } from 'vitest'
import {
  computeGamePoints,
  computeRamschPoints,
  DURCHMARSCH_VALUE,
  totalsByPlayer,
  statsByPlayer,
  standings,
  gamesPlayed,
} from './scoring'
import type { RamschData, Round } from './types'

const P = ['a', 'b', 'c']

function ramschRound(seq: number, ramsch: RamschData): Round {
  return {
    id: `r${seq}`,
    seq,
    type: 'ramsch',
    declarerUid: null,
    gameValue: null,
    result: null,
    points: computeRamschPoints(P, ramsch),
    ramsch,
    createdBy: 'a',
    createdAt: null,
  }
}

function gameRound(seq: number, declarer: string, value: number, result: 'won' | 'lost'): Round {
  return {
    id: `r${seq}`,
    seq,
    type: 'game',
    declarerUid: declarer,
    gameValue: value,
    result,
    points: computeGamePoints(P, declarer, value, result),
    createdBy: declarer,
    createdAt: null,
  }
}

function adjustment(seq: number, points: Record<string, number>): Round {
  return {
    id: `r${seq}`,
    seq,
    type: 'adjustment',
    declarerUid: null,
    gameValue: null,
    result: null,
    points,
    createdBy: 'a',
    createdAt: null,
  }
}

describe('computeGamePoints', () => {
  it('gives the declarer +gameValue on a win, others 0', () => {
    expect(computeGamePoints(P, 'a', 18, 'won')).toEqual({ a: 18, b: 0, c: 0 })
  })

  it('gives the declarer -2*gameValue on a loss', () => {
    expect(computeGamePoints(P, 'a', 18, 'lost')).toEqual({ a: -36, b: 0, c: 0 })
  })
})

describe('totalsByPlayer', () => {
  it('sums deltas across rounds and initialises every player to 0', () => {
    const rounds = [gameRound(1, 'a', 18, 'won'), gameRound(2, 'b', 20, 'lost')]
    expect(totalsByPlayer(P, rounds)).toEqual({ a: 18, b: -40, c: 0 })
  })

  it('includes free adjustment points', () => {
    const rounds = [gameRound(1, 'a', 18, 'won'), adjustment(2, { a: -10, b: 5, c: 5 })]
    expect(totalsByPlayer(P, rounds)).toEqual({ a: 8, b: 5, c: 5 })
  })
})

describe('statsByPlayer', () => {
  it('counts declared/won/lost games and computes win rate (ignoring adjustments)', () => {
    const rounds = [
      gameRound(1, 'a', 18, 'won'),
      gameRound(2, 'a', 24, 'lost'),
      gameRound(3, 'b', 20, 'won'),
      adjustment(4, { a: 3, b: 3, c: 3 }),
    ]
    const stats = statsByPlayer(P, rounds)
    const a = stats.find((s) => s.uid === 'a')!
    expect(a.gamesDeclared).toBe(2)
    expect(a.gamesWon).toBe(1)
    expect(a.gamesLost).toBe(1)
    expect(a.winRate).toBeCloseTo(0.5)
    const c = stats.find((s) => s.uid === 'c')!
    expect(c.gamesDeclared).toBe(0)
    expect(c.winRate).toBe(0)
  })
})

describe('computeRamschPoints', () => {
  it('penalises the player with the most Augen with -Augen', () => {
    const r: RamschData = { augen: { a: 40, b: 38, c: 42 }, jungfrau: false, durchmarschUid: null }
    expect(computeRamschPoints(P, r)).toEqual({ a: 0, b: 0, c: -42 })
  })

  it('penalises every player tied on the maximum', () => {
    const r: RamschData = { augen: { a: 60, b: 60, c: 0 }, jungfrau: false, durchmarschUid: null }
    expect(computeRamschPoints(P, r)).toEqual({ a: -60, b: -60, c: 0 })
  })

  it('doubles the penalty on a Jungfrau', () => {
    const r: RamschData = { augen: { a: 82, b: 38, c: 0 }, jungfrau: true, durchmarschUid: null }
    expect(computeRamschPoints(P, r)).toEqual({ a: -164, b: 0, c: 0 })
  })

  it('awards DURCHMARSCH_VALUE to the Durchmarsch player, skipping penalties', () => {
    const r: RamschData = { augen: { a: 0, b: 0, c: 120 }, jungfrau: false, durchmarschUid: 'c' }
    expect(computeRamschPoints(P, r)).toEqual({ a: 0, b: 0, c: DURCHMARSCH_VALUE })
  })

  it('feeds totals like any other round', () => {
    const rounds = [
      gameRound(1, 'a', 18, 'won'),
      ramschRound(2, { augen: { a: 50, b: 30, c: 40 }, jungfrau: false, durchmarschUid: null }),
    ]
    expect(totalsByPlayer(P, rounds)).toEqual({ a: -32, b: 0, c: 0 })
  })
})

describe('standings', () => {
  it('sorts players by total descending', () => {
    const rounds = [gameRound(1, 'a', 18, 'won'), gameRound(2, 'c', 30, 'won')]
    const order = standings(P, rounds).map((s) => s.uid)
    expect(order).toEqual(['c', 'a', 'b'])
  })

  it('breaks ties by more games won, then fewer lost, then uid', () => {
    // a and b both end at +18: a won its 18; b won an 18 but also lost a 9 adjustment-free
    // Build so totals tie but a has more wins.
    const rounds = [
      gameRound(1, 'a', 18, 'won'),
      gameRound(2, 'b', 9, 'won'),
      gameRound(3, 'b', 9, 'won'),
      adjustment(4, { a: 0, b: 0, c: 0 }),
    ]
    // a: +18 (1 win); b: +18 (2 wins) -> b ranks above a on more wins
    const order = standings(P, rounds).map((s) => s.uid)
    expect(order).toEqual(['b', 'a', 'c'])
  })
})

describe('gamesPlayed', () => {
  it('counts game and ramsch rounds, not adjustments', () => {
    const rounds = [
      gameRound(1, 'a', 18, 'won'),
      ramschRound(2, { augen: { a: 50, b: 40, c: 30 }, jungfrau: false, durchmarschUid: null }),
      adjustment(3, { a: 1, b: 1, c: 1 }),
    ]
    expect(gamesPlayed(rounds)).toBe(2)
  })
})
