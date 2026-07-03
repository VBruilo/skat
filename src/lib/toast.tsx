import { createContext, useCallback, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'

type ToastVariant = 'success' | 'error'

interface ToastState {
  message: string
  variant: ToastVariant
  id: number
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<ToastState | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idRef = useRef(0)

  const toast = useCallback((message: string, variant: ToastVariant = 'success') => {
    idRef.current += 1
    setCurrent({ message, variant, id: idRef.current })
    // Haptic feedback where supported (no-op on iOS Safari).
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(variant === 'error' ? [40, 30, 40] : 20)
    }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCurrent(null), 2500)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {current && (
          <div
            key={current.id}
            className={`animate-[toastIn_200ms_ease-out] rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg ${
              current.variant === 'error' ? 'bg-rose-600' : 'bg-slate-800'
            }`}
          >
            {current.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
