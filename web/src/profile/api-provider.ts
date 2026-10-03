import axios from 'axios'
import { api } from '@/api/client'
import { sessionStore } from '@/auth/session'
import type { AuthSession } from '@/auth/types'
import { createApiProfileStore } from './api-store'

export function createRemoteProfileStore(session: AuthSession) {
  const isCurrent = () => {
    const current = sessionStore.getSnapshot()
    return current?.mode === 'api' && current.user.id === session.user.id && current.accessToken === session.accessToken
  }
  async function request(run: (signal: AbortSignal) => Promise<{ data: unknown }>) {
    if (!isCurrent()) throw new Error('Sua sessão mudou. Entre novamente.')
    const controller = new AbortController()
    const unsubscribe = sessionStore.subscribe(() => { if (!isCurrent()) controller.abort() })
    try {
      const response = await run(controller.signal)
      if (!isCurrent()) throw new Error('Sua sessão mudou. Entre novamente.')
      return response.data
    } catch (cause) {
      if (axios.isAxiosError(cause)) {
        if (cause.response?.status === 401) throw new Error('Sua sessão expirou. Entre novamente.', { cause })
        if (cause.response?.status === 422) throw new Error('Confira o nome, a apresentação, os interesses e a foto informados.', { cause })
        throw new Error('Não foi possível acessar seu perfil. Tente novamente.', { cause })
      }
      throw cause
    } finally { unsubscribe() }
  }
  return createApiProfileStore(session.user, {
    load: () => request((signal) => api.get('/profile/me', { signal })),
    save: (input) => request((signal) => api.put('/profile/me', input, { signal })),
    reset: () => request((signal) => api.delete('/profile/me', { signal })),
    export: () => request((signal) => api.get('/profile/me/export', { signal })),
  }, (profile) => {
    const current = sessionStore.getSnapshot()
    if (isCurrent() && current && current.user.name !== profile.name) {
      sessionStore.save({ ...current, user: { ...current.user, name: profile.name } })
    }
  })
}
