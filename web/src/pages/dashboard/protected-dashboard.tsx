import { Navigate } from '@tanstack/react-router'
import { useAuth } from '@/auth/use-auth'
import { Dashboard } from './dashboard'

export function ProtectedDashboard() {
  const session = useAuth()
  return session ? (
    <Dashboard />
  ) : (
    <Navigate to="/" replace />
  )
}
