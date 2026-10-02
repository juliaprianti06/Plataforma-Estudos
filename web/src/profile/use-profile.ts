import { useEffect, useSyncExternalStore } from 'react'
import { useAuth } from '@/auth/use-auth'
import { sessionStore } from '@/auth/session'
import type { AuthSession } from '@/auth/types'
import { createProfileStore, type ProfileInput, type UserProfile } from './store'
import { createRemoteProfileStore } from './api-provider'

const readyStatus = { loading: false, error: null }
const emptySubscribe = () => () => {}
const emptySnapshot = () => null
const emptyStatus = () => readyStatus

function makeStore(session: AuthSession) {
  if (session.mode === 'api') return createRemoteProfileStore(session)
  const local = createProfileStore(session.user, {
    getItem: (key) => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
    removeItem: (key) => window.localStorage.removeItem(key),
  })
  function syncName(profile: UserProfile) {
    const current = sessionStore.getSnapshot()
    if (current?.mode === session.mode && current.user.id === session.user.id && current.user.name !== profile.name) {
      sessionStore.save({ ...current, user: { ...current.user, name: profile.name } })
    }
    return profile
  }
  return {
    ...local,
    save: (input: ProfileInput) => syncName(local.save(input)),
    reset: () => syncName(local.reset()),
    getStatusSnapshot: emptyStatus,
    load: async () => syncName(local.getSnapshot()),
    export: async () => ({ ...local.getSnapshot(), email: session.user.email }),
  }
}

let cached: { key: string; store: ReturnType<typeof makeStore> } | null = null
sessionStore.subscribe(() => {
  if (!sessionStore.getSnapshot()) cached = null
})

export function getProfileStore(session: AuthSession) {
  const key = `${session.mode}:${session.user.id}:${session.accessToken ?? ''}`
  if (!cached || cached.key !== key) cached = { key, store: makeStore(session) }
  return cached.store
}

export function useProfile() {
  const session = useAuth()
  const store = session ? getProfileStore(session) : null
  useEffect(() => { if (store) void store.load().catch(() => {}) }, [store])
  return useSyncExternalStore(store?.subscribe ?? emptySubscribe, store?.getSnapshot ?? emptySnapshot)
}

export function useProfileStatus() {
  const session = useAuth()
  const store = session ? getProfileStore(session) : null
  return useSyncExternalStore(store?.subscribe ?? emptySubscribe, store?.getStatusSnapshot ?? emptyStatus)
}
