import { createFileRoute, redirect } from '@tanstack/react-router'
import { auth } from '@/auth/auth'
import { sessionStore } from '@/auth/session'
import { ProtectedDashboard } from '@/components/dashboard/protected-dashboard'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    await auth.restore()
    if (!sessionStore.getSnapshot()) throw redirect({ to: '/' })
  },
  component: ProtectedDashboard,
})
