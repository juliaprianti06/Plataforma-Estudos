import type { AuthSession } from './types.ts'

export const SESSION_KEY = 'mindspace.auth.session.v1'
type StoragePair = { local: Storage; session: Storage }

export function createSessionStore(storage: StoragePair, mode: AuthSession['mode']) {
  let current: AuthSession | null = null
  let persistent = false
  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach((listener) => listener())

  function removeStored() {
    for (const target of [storage.local, storage.session]) {
      try { target.removeItem(SESSION_KEY) } catch { /* Storage may be unavailable. */ }
    }
  }

  function clear() {
    current = null
    removeStored()
    notify()
  }

  function read() {
    for (const [target, remember] of [[storage.session, false], [storage.local, true]] as const) {
      try {
        const value = target.getItem(SESSION_KEY)
        if (!value) continue
        const parsed = JSON.parse(value) as AuthSession
        if (
          parsed?.mode !== mode || !Number.isFinite(parsed.expiresAt) || parsed.expiresAt <= Date.now() ||
          typeof parsed.user?.id !== 'string' || !parsed.user.id ||
          typeof parsed.user?.name !== 'string' || !parsed.user.name.trim() ||
          typeof parsed.user?.email !== 'string' || !parsed.user.email ||
          (mode === 'api' && (typeof parsed.accessToken !== 'string' || !parsed.accessToken))
        ) {
          target.removeItem(SESSION_KEY)
          continue
        }
        current = {
          mode, expiresAt: parsed.expiresAt,
          accessToken: mode === 'api' ? parsed.accessToken : null,
          user: { id: parsed.user.id, name: parsed.user.name, email: parsed.user.email },
        }
        persistent = remember
        return current
      } catch {
        try { target.removeItem(SESSION_KEY) } catch { /* Use an in-memory session. */ }
      }
    }
    current = null
    return null
  }

  return {
    read, clear,
    getSnapshot: () => current,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    save(session: AuthSession, remember = persistent) {
      removeStored()
      persistent = remember
      current = session
      try {
        const target = remember ? storage.local : storage.session
        target.setItem(SESSION_KEY, JSON.stringify(session))
      } catch { /* Login remains available in memory when storage is blocked. */ }
      notify()
    },
  }
}
