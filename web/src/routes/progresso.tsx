import { createFileRoute, redirect } from '@tanstack/react-router'
import { auth } from '@/auth/auth'
import { sessionStore } from '@/auth/session'
import Progresso from '@/pages/progresso'

export const Route = createFileRoute('/progresso')({
  beforeLoad: async () => {
    await auth.restore()
    if (!sessionStore.getSnapshot()) throw redirect({ to: '/' })
  },
  component: Progresso,
})
