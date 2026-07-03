import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import type { DocumentData } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from './firebase'
import type { Round, RoundResult } from './types'
import { computeGamePoints } from './scoring'

function roundsCol(seriesId: string) {
  return collection(db, 'series', seriesId, 'rounds')
}

function toRound(id: string, data: DocumentData): Round {
  return {
    id,
    seq: data.seq ?? 0,
    type: data.type ?? 'game',
    declarerUid: data.declarerUid ?? null,
    gameValue: data.gameValue ?? null,
    result: data.result ?? null,
    points: data.points ?? {},
    createdBy: data.createdBy ?? '',
    createdAt: data.createdAt ?? null,
  }
}

export function subscribeRounds(seriesId: string, cb: (rounds: Round[]) => void): () => void {
  const q = query(roundsCol(seriesId), orderBy('seq', 'asc'))
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => toRound(d.id, d.data()))),
    () => cb([]),
  )
}

export function nextSeq(rounds: Round[]): number {
  return rounds.length === 0 ? 1 : Math.max(...rounds.map((r) => r.seq)) + 1
}

export async function addGameRound(
  seriesId: string,
  user: User,
  playerUids: string[],
  declarerUid: string,
  gameValue: number,
  result: RoundResult,
  seq: number,
): Promise<void> {
  await addDoc(roundsCol(seriesId), {
    seq,
    type: 'game',
    declarerUid,
    gameValue,
    result,
    points: computeGamePoints(playerUids, declarerUid, gameValue, result),
    createdBy: user.uid,
    createdAt: serverTimestamp(),
  })
}

export async function addAdjustmentRound(
  seriesId: string,
  user: User,
  points: Record<string, number>,
  seq: number,
): Promise<void> {
  await addDoc(roundsCol(seriesId), {
    seq,
    type: 'adjustment',
    declarerUid: null,
    gameValue: null,
    result: null,
    points,
    createdBy: user.uid,
    createdAt: serverTimestamp(),
  })
}

export async function updateGameRound(
  seriesId: string,
  roundId: string,
  playerUids: string[],
  declarerUid: string,
  gameValue: number,
  result: RoundResult,
): Promise<void> {
  await updateDoc(doc(roundsCol(seriesId), roundId), {
    type: 'game',
    declarerUid,
    gameValue,
    result,
    points: computeGamePoints(playerUids, declarerUid, gameValue, result),
  })
}

export async function updateAdjustmentRound(
  seriesId: string,
  roundId: string,
  points: Record<string, number>,
): Promise<void> {
  await updateDoc(doc(roundsCol(seriesId), roundId), {
    type: 'adjustment',
    declarerUid: null,
    gameValue: null,
    result: null,
    points,
  })
}

export async function deleteRound(seriesId: string, roundId: string): Promise<void> {
  await deleteDoc(doc(roundsCol(seriesId), roundId))
}
