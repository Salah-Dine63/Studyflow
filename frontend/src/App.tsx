import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useOnboardingStore } from './stores/onboardingStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Onboarding from './pages/Onboarding'
import TimerPage from './pages/TimerPage'
import Dashboard from './pages/Dashboard'
import Sessions from './pages/Sessions'
import Insights from './pages/Insights'
import Profile from './pages/Profile'
import GroupSession from './pages/GroupSession'
import SearchUsers from './pages/SearchUsers'
import About from './pages/About'

function RequireAuth({ children }: { children: JSX.Element }) {
  const { token } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  return children
}

function OnboardingGuard({ children }: { children: JSX.Element }) {
  const { token } = useAuthStore()
  const { done, checking, checkStatus } = useOnboardingStore()

  useEffect(() => {
    if (token) checkStatus()
  }, [token])

  if (!token) return <Navigate to="/login" replace />
  if (checking) return null
  if (!done) return <Navigate to="/onboarding" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/onboarding" element={
        <RequireAuth>
          <Onboarding />
        </RequireAuth>
      } />

      <Route path="/" element={
        <OnboardingGuard>
          <Layout />
        </OnboardingGuard>
      }>
        <Route index element={<TimerPage />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="sessions" element={<Sessions />} />
        <Route path="insights" element={<Insights />} />
        <Route path="profile" element={<Profile />} />
        <Route path="group" element={<GroupSession />} />
        <Route path="search" element={<SearchUsers />} />
        <Route path="about" element={<About />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
