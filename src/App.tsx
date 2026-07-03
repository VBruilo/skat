import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { ToastProvider } from './lib/toast'
import { isFirebaseConfigured } from './lib/firebase'
import { FullScreenMessage, Spinner } from './components/ui'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import CreateSeriesPage from './pages/CreateSeriesPage'
import JoinSeriesPage from './pages/JoinSeriesPage'
import SeriesPage from './pages/SeriesPage'
import StatsPage from './pages/StatsPage'

function Gate() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <FullScreenMessage>
        <Spinner />
      </FullScreenMessage>
    )
  }
  if (!user) return <LoginPage />
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/create" element={<CreateSeriesPage />} />
      <Route path="/join" element={<JoinSeriesPage />} />
      <Route path="/join/:code" element={<JoinSeriesPage />} />
      <Route path="/series/:id" element={<SeriesPage />} />
      <Route path="/series/:id/stats" element={<StatsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  if (!isFirebaseConfigured) {
    return (
      <FullScreenMessage>
        <h1 className="text-xl font-bold">Firebase nicht konfiguriert</h1>
        <p className="max-w-sm text-sm text-white/80">
          Lege eine <code className="rounded bg-black/20 px-1">.env.local</code> mit den
          <code className="rounded bg-black/20 px-1"> VITE_FIREBASE_*</code>-Werten an (siehe
          <code className="rounded bg-black/20 px-1"> .env.example</code> und
          <code className="rounded bg-black/20 px-1"> SETUP.md</code>).
        </p>
      </FullScreenMessage>
    )
  }
  return (
    <AuthProvider>
      <ToastProvider>
        <HashRouter>
          <Gate />
        </HashRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
