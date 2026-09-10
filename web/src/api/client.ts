import axios from 'axios'
import { sessionStore } from '@/auth/session'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const session = sessionStore.getSnapshot()
  const isPublicAuth = ['/auth/login', '/auth/register'].includes(config.url ?? '')
  if (!isPublicAuth && session?.mode === 'api' && session.accessToken) {
    if (session.expiresAt <= Date.now()) {
      sessionStore.clear()
      return Promise.reject(new Error('Sua sessão expirou. Entre novamente.'))
    }
    config.headers.Authorization = `Bearer ${session.accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const token = sessionStore.getSnapshot()?.accessToken
    if (axios.isAxiosError(error) && error.response?.status === 401 && token &&
      error.config?.headers.Authorization === `Bearer ${token}`) {
      sessionStore.clear()
    }
    return Promise.reject(error)
  },
)
