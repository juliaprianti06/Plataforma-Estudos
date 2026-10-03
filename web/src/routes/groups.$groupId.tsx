import { createFileRoute, redirect } from '@tanstack/react-router'
import { auth } from '@/auth/auth'
import { sessionStore } from '@/auth/session'
import { GroupRoute } from '@/components/groups/group-route'

export const Route = createFileRoute('/groups/$groupId')({
  beforeLoad: async () => { await auth.restore(); if (!sessionStore.getSnapshot()) throw redirect({ to: '/' }) },
  component: GroupRoute,
})
