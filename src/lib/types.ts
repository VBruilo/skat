import type { Timestamp } from 'firebase/firestore'

export interface AppUser {
  uid: string
  displayName: string
  photoURL: string | null
  email: string | null
}

export interface PlayerInfo {
  name: string
  photoURL: string | null
}

export type SeriesStatus = 'open' | 'finished'

export interface Series {
  id: string
  name: string
  createdBy: string
  createdAt: Timestamp | null
  inviteCode: string
  playerUids: string[]
  playerInfo: Record<string, PlayerInfo>
  targetRounds: number
  status: SeriesStatus
}

export type RoundType = 'game' | 'adjustment'
export type RoundResult = 'won' | 'lost'

export interface Round {
  id: string
  /** 1-based sequence number within the series. */
  seq: number
  type: RoundType
  /** Set for `game` rounds; null for `adjustment`. */
  declarerUid: string | null
  /** Positive Spielwert for `game` rounds; null for `adjustment`. */
  gameValue: number | null
  result: RoundResult | null
  /** Per-player point delta for this round (uid -> delta). */
  points: Record<string, number>
  createdBy: string
  createdAt: Timestamp | null
}
