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

export type RoundType = 'game' | 'adjustment' | 'ramsch'
export type RoundResult = 'won' | 'lost'

export type GameKind = 'grand' | 'suit' | 'null'
export type Suit = 'karo' | 'herz' | 'pik' | 'kreuz'
export type NullVariant = 'null' | 'nullHand' | 'nullOuvert' | 'nullHandOuvert'

/**
 * The declarer's game as selected in the Spielwert calculator. Stored on `game`
 * rounds so editing can rehydrate the calculator and the log can show a readable
 * label. Absent on legacy or manually-entered rounds.
 */
export interface GameSelection {
  kind: GameKind
  /** Only for `suit` games. */
  suit?: Suit
  /** Spitzen count (>= 1); ignored for Null. */
  matadors?: number
  /** mit (true) / ohne (false) Spitzen — affects the label only, not the value. */
  withMatadors?: boolean
  hand?: boolean
  schneider?: boolean
  schneiderAngesagt?: boolean
  schwarz?: boolean
  schwarzAngesagt?: boolean
  ouvert?: boolean
  /** Only for Null games. */
  nullVariant?: NullVariant
}

/** Inputs for a Ramsch round (stored so editing can rehydrate the form). */
export interface RamschData {
  /** Card points (Augen) per player; the three should sum to 120. */
  augen: Record<string, number>
  /** Someone took no trick → the loser's penalty is doubled. */
  jungfrau: boolean
  /** Player who took every trick (Durchmarsch), or null. */
  durchmarschUid: string | null
}

export interface Round {
  id: string
  /** 1-based sequence number within the series. */
  seq: number
  type: RoundType
  /** Set for `game` rounds; null for `adjustment`/`ramsch`. */
  declarerUid: string | null
  /** Positive Spielwert for `game` rounds; null otherwise. */
  gameValue: number | null
  result: RoundResult | null
  /** Per-player point delta for this round (uid -> delta). */
  points: Record<string, number>
  /** Calculator selection for `game` rounds; absent on legacy/manual rounds. */
  gameMeta?: GameSelection
  /** Inputs for `ramsch` rounds. */
  ramsch?: RamschData
  createdBy: string
  createdAt: Timestamp | null
}
