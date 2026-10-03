import { createFileRoute, redirect } from '@tanstack/react-router'
import { auth } from '@/auth/auth'
import { sessionStore } from '@/auth/session'
import { GroupsLayout } from '@/components/groups/groups-layout'

export const Route = createFileRoute('/groups')({
  beforeLoad: async () => {
    await auth.restore()
    if (!sessionStore.getSnapshot()) throw redirect({ to: '/' })
  },
  component: GroupsLayout,
})
