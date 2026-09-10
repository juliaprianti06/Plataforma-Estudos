import { useSyncExternalStore } from 'react'
import { useAuth } from '@/auth/use-auth'
import type { AuthSession } from '@/auth/types'
import { createProfileStore } from './store'

const stores = new Map<string, ReturnType<typeof createProfileStore>>()
const emptySubscribe = () => () => {}
const emptySnapshot = () => null

export function getProfileStore(session: AuthSession) {
  const key = `${session.mode}:${session.user.id}`
  let store = stores.get(key)
  if (!store) {
    store = createProfileStore(session.user, {
      getItem: (key) => window.localStorage.getItem(key),
      setItem: (key, value) => window.localStorage.setItem(key, value),
      removeItem: (key) => window.localStorage.removeItem(key),
    }, session.mode)
    stores.set(key, store)
  }
  return store
}

export function useProfile() {
  const session = useAuth()
  const store = session ? getProfileStore(session) : null
  return useSyncExternalStore(store?.subscribe ?? emptySubscribe, store?.getSnapshot ?? emptySnapshot)
}
