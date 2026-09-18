import axios from 'axios'
import { api } from './client'
import { sessionStore } from '@/auth/session'
import type { AuthSession } from '@/auth/types'

export function createSessionRequest(session: AuthSession) {
  const matches = () => {
    const current = sessionStore.getSnapshot()
    return current?.mode === 'api' && current.user.id === session.user.id && current.accessToken === session.accessToken
  }
  return async function request<T>(method: 'get' | 'post' | 'put' | 'delete', url: string, data?: unknown): Promise<T> {
    if (!matches()) throw new Error('Sua sess\u00e3o mudou. Entre novamente.')
    const controller = new AbortController()
    const unsubscribe = sessionStore.subscribe(() => { if (!matches()) controller.abort() })
    try {
      const response = await api.request<T>({ method, url, data, signal: controller.signal })
      if (!matches()) throw new Error('Sua sess\u00e3o mudou. Entre novamente.')
      return response.data
    } catch (cause) {
      if (axios.isAxiosError(cause)) {
        const message = cause.response?.data?.mensagem
        if (cause.response?.status === 401) throw new Error('Sua sess\u00e3o expirou. Entre novamente.', { cause })
        throw new Error(typeof message === 'string' ? message : 'N\u00e3o foi poss\u00edvel concluir a solicita\u00e7\u00e3o. Tente novamente.', { cause })
      }
      throw cause
    } finally { unsubscribe() }
  }
}
