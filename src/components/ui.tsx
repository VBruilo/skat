import type { ReactNode } from 'react'

export const btnPrimary =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-50'

export const btnSecondary =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-base font-semibold text-emerald-700 ring-1 ring-emerald-200 transition active:scale-[0.98] disabled:opacity-50'

export const btnGhost =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition active:scale-[0.98] disabled:opacity-50'

export function Spinner() {
  return (
    <div
      className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white"
      role="status"
      aria-label="Lädt"
    />
  )
}

export function FullScreenMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-emerald-800 p-6 text-center text-white">
      {children}
    </div>
  )
}

const AVATAR_COLORS = [
  'bg-rose-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-teal-500',
]

function colorFor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

export function Avatar({
  name,
  photoURL,
  size = 40,
}: {
  name: string
  photoURL?: string | null
  size?: number
}) {
  const initials = name.trim().slice(0, 2).toUpperCase() || '?'
  const style = { width: size, height: size, fontSize: size * 0.4 }
  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={name}
        referrerPolicy="no-referrer"
        className="shrink-0 rounded-full object-cover"
        style={style}
      />
    )
  }
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${colorFor(name)}`}
      style={style}
    >
      {initials}
    </div>
  )
}

export function PageHeader({
  title,
  onBack,
  right,
}: {
  title: string
  onBack?: () => void
  right?: ReactNode
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-emerald-900/10 bg-emerald-700 px-3 py-3 text-white shadow-sm">
      {onBack && (
        <button onClick={onBack} className="rounded-xl p-2 text-white/90 active:bg-white/10" aria-label="Zurück">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      <h1 className="min-w-0 flex-1 truncate text-lg font-bold">{title}</h1>
      {right}
    </header>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-white p-4 shadow-sm ${className}`}>{children}</div>
}

/** Formats a signed score with an explicit +/- and thin-space grouping. */
export function formatSigned(n: number): string {
  return (n > 0 ? '+' : '') + n.toString()
}

const MEDAL: Record<number, string> = {
  1: 'bg-amber-400 text-amber-900',
  2: 'bg-slate-300 text-slate-700',
  3: 'bg-orange-300 text-orange-900',
}

/** Standings rank: a medal pill for the top three, a plain number otherwise. */
export function RankBadge({ rank }: { rank: number }) {
  const medal = MEDAL[rank]
  if (medal) {
    return (
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${medal}`}>
        {rank}
      </span>
    )
  }
  return <span className="w-6 shrink-0 text-center text-sm font-bold text-slate-400">{rank}</span>
}
