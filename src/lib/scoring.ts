import type { RamschData, Round, RoundResult } from './types'

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

/** Points awarded to the player who takes every trick in a Ramsch. */
export const DURCHMARSCH_VALUE = 120

/**
 * Ramsch scoring: the player with the most Augen loses and scores -Augen.
 * Ties on the maximum: every tied player takes the penalty. Jungfrau (someone
 * with no trick) doubles the penalty. Durchmarsch (all tricks) wins instead:
 * that player scores +DURCHMARSCH_VALUE and the penalty is skipped.
 */
export function computeRamschPoints(
  playerUids: string[],
  ramsch: RamschData,
): Record<string, number> {
  const points: Record<string, number> = {}
  for (const uid of playerUids) points[uid] = 0
  if (ramsch.durchmarschUid) {
    points[ramsch.durchmarschUid] = DURCHMARSCH_VALUE
    return points
  }
  let max = 0
  for (const uid of playerUids) max = Math.max(max, ramsch.augen[uid] ?? 0)
  if (max <= 0) return points
  const factor = ramsch.jungfrau ? 2 : 1
  for (const uid of playerUids) {
    if ((ramsch.augen[uid] ?? 0) === max) points[uid] = -max * factor
  }
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

/**
 * Stats sorted for the standings table: total desc, then more games won as
 * declarer, then fewer games lost, then uid for a deterministic final order.
 */
export function standings(playerUids: string[], rounds: Round[]): PlayerStats[] {
  return statsByPlayer(playerUids, rounds).sort(
    (a, b) =>
      b.total - a.total ||
      b.gamesWon - a.gamesWon ||
      a.gamesLost - b.gamesLost ||
      a.uid.localeCompare(b.uid),
  )
}

/** Number of actual hands played (games + Ramsch, but not free adjustments). */
export function gamesPlayed(rounds: Round[]): number {
  return rounds.filter((r) => r.type === 'game' || r.type === 'ramsch').length
}
