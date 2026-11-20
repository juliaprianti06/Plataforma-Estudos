import { createFileRoute, redirect } from '@tanstack/react-router'
import { auth } from '@/auth/auth'
import { sessionStore } from '@/auth/session'
import { StudySessionsPage } from '@/study-sessions/StudySessionsPage'

export const Route = createFileRoute('/sessoes-estudo')({
  beforeLoad: async () => {
    await auth.restore()
    if (!sessionStore.getSnapshot()) throw redirect({ to: '/' })
  },
  component: StudySessionsPage,
})
