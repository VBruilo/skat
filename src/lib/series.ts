import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import type { DocumentData } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from './firebase'
import type { PlayerInfo, Series } from './types'
import { generateInviteCode, normalizeInviteCode } from './inviteCode'

export const MAX_PLAYERS = 3

function playerInfoFrom(user: User): PlayerInfo {
  return { name: user.displayName ?? 'Spieler', photoURL: user.photoURL ?? null }
}

function toSeries(id: string, data: DocumentData): Series {
  return {
    id,
    name: data.name ?? '',
    createdBy: data.createdBy ?? '',
    createdAt: data.createdAt ?? null,
    inviteCode: data.inviteCode ?? '',
    playerUids: data.playerUids ?? [],
    playerInfo: data.playerInfo ?? {},
    targetRounds: data.targetRounds ?? 36,
    status: data.status ?? 'open',
  }
}

/** Creates a series (with the caller as first player) plus its invite entry. */
export async function createSeries(user: User, name: string, targetRounds = 36): Promise<string> {
  const seriesRef = doc(collection(db, 'series'))

  let code = generateInviteCode()
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await getDoc(doc(db, 'invites', code))
    if (!existing.exists()) break
    code = generateInviteCode()
  }

  const batch = writeBatch(db)
  batch.set(seriesRef, {
    name: name.trim() || 'Skat-Runde',
    createdBy: user.uid,
    createdAt: serverTimestamp(),
    inviteCode: code,
    playerUids: [user.uid],
    playerInfo: { [user.uid]: playerInfoFrom(user) },
    targetRounds,
    status: 'open',
  })
  batch.set(doc(db, 'invites', code), { seriesId: seriesRef.id })
  await batch.commit()
  return seriesRef.id
}

/** Resolves an invite code and adds the caller to that series. Returns the series id. */
export async function joinSeriesByCode(user: User, rawCode: string): Promise<string> {
  const code = normalizeInviteCode(rawCode)
  if (!code) throw new Error('Bitte gib einen Einladungscode ein.')

  const inviteSnap = await getDoc(doc(db, 'invites', code))
  if (!inviteSnap.exists()) throw new Error('Code ungültig — keine Serie gefunden.')
  const seriesId = inviteSnap.data().seriesId as string

  try {
    await updateDoc(doc(db, 'series', seriesId), {
      playerUids: arrayUnion(user.uid),
      [`playerInfo.${user.uid}`]: playerInfoFrom(user),
    })
  } catch {
    // The security rules deny the write when the series is already full.
    throw new Error('Beitreten nicht möglich — die Serie ist wahrscheinlich schon voll (max. 3 Spieler).')
  }
  return seriesId
}

export function subscribeMySeries(uid: string, cb: (series: Series[]) => void): () => void {
  const q = query(collection(db, 'series'), where('playerUids', 'array-contains', uid))
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => toSeries(d.id, d.data()))
    list.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0))
    cb(list)
  })
}

export function subscribeSeries(id: string, cb: (series: Series | null) => void): () => void {
  return onSnapshot(
    doc(db, 'series', id),
    (snap) => cb(snap.exists() ? toSeries(snap.id, snap.data()) : null),
    () => cb(null),
  )
}
