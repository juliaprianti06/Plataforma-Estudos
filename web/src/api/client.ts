import axios from 'axios'
import { sessionStore } from '@/auth/session'

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    sessionKey?: string
  }
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export const storageBaseUrl = API_URL.replace('/api/v1', '')

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const session = sessionStore.getSnapshot()
  const isPublicAuth = ['/auth/login', '/auth/register'].includes(config.url ?? '')
  if (!isPublicAuth && session?.mode === 'api') {
    if (session.expiresAt <= Date.now()) {
      sessionStore.clear()
      return Promise.reject(new Error('Sua sessão expirou. Entre novamente.'))
    }
    config.sessionKey = session.sessionKey
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const session = sessionStore.getSnapshot()
    if (axios.isAxiosError(error) && error.response?.status === 401 && session &&
      error.config?.sessionKey === session.sessionKey) {
      sessionStore.clear()
    }
    return Promise.reject(error)
  },
)
