import type { Round, RoundResult } from './types'

/**
 * Simple-list scoring (the variant chosen for this app, matching ISkO's
 * double-loss rule): only the declarer scores — won => +gameValue,
 * lost => -2 * gameValue. Defenders get 0.
 */
export function computeGamePoints(
  playerUids: string[],
  declarerUid: string,
  gameValue: number,
  result: RoundResult,
): Record<string, number> {
  const points: Record<string, number> = {}
  for (const uid of playerUids) points[uid] = 0
  points[declarerUid] = result === 'won' ? gameValue : -2 * gameValue
  return points
}

/** Running total per player, summed from every round's `points` map. */
export function totalsByPlayer(playerUids: string[], rounds: Round[]): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const uid of playerUids) totals[uid] = 0
  for (const round of rounds) {
    for (const [uid, delta] of Object.entries(round.points)) {
      totals[uid] = (totals[uid] ?? 0) + delta
    }
  }
  return totals
}

export interface PlayerStats {
  uid: string
  total: number
  gamesDeclared: number
  gamesWon: number
  gamesLost: number
  /** Win share as declarer, 0..1. */
  winRate: number
}

/** Per-player stats in `playerUids` order. */
export function statsByPlayer(playerUids: string[], rounds: Round[]): PlayerStats[] {
  const totals = totalsByPlayer(playerUids, rounds)
  const byUid = new Map<string, PlayerStats>()
  for (const uid of playerUids) {
    byUid.set(uid, {
      uid,
      total: totals[uid] ?? 0,
      gamesDeclared: 0,
      gamesWon: 0,
      gamesLost: 0,
      winRate: 0,
    })
  }
  for (const round of rounds) {
    if (round.type !== 'game' || !round.declarerUid || !round.result) continue
    const s = byUid.get(round.declarerUid)
    if (!s) continue
    s.gamesDeclared += 1
    if (round.result === 'won') s.gamesWon += 1
    else s.gamesLost += 1
  }
  for (const s of byUid.values()) {
    s.winRate = s.gamesDeclared > 0 ? s.gamesWon / s.gamesDeclared : 0
  }
  return playerUids.map((uid) => byUid.get(uid)!)
}

/** Stats sorted by total descending (for the standings table). */
export function standings(playerUids: string[], rounds: Round[]): PlayerStats[] {
  return statsByPlayer(playerUids, rounds).sort((a, b) => b.total - a.total)
}

/** Number of actual Skat games played (excludes free adjustments). */
export function gamesPlayed(rounds: Round[]): number {
  return rounds.filter((r) => r.type === 'game').length
}
