import { createFileRoute, redirect } from '@tanstack/react-router'
import { auth } from '@/auth/auth'
import { sessionStore } from '@/auth/session'
import Calendario from '@/pages/calendario'

export const Route = createFileRoute('/calendario')({
  beforeLoad: async () => {
    await auth.restore()
    if (!sessionStore.getSnapshot()) throw redirect({ to: '/' })
  },
  component: Calendario,
})
