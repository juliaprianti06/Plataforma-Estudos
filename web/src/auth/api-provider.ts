import { api } from '@/api/client'
import type { AuthProvider, AuthSession, AuthUser } from './types'

type TokenResponse = { access_token: string; expires_in: number; user: AuthUser }

function validateUser(user: AuthUser) {
  if (!user || typeof user.id !== 'string' || !user.id ||
    typeof user.name !== 'string' || !user.name.trim() ||
    typeof user.email !== 'string' || !user.email) {
    throw new Error('O servidor retornou um perfil inválido.')
  }
  return { id: user.id, name: user.name, email: user.email }
}

function toSession(data: TokenResponse): AuthSession {
  if (!data || typeof data.access_token !== 'string' || !data.access_token ||
    !Number.isFinite(data.expires_in) || data.expires_in <= 0) {
    throw new Error('O servidor retornou uma sessão inválida.')
  }
  return {
    user: validateUser(data.user), accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000, mode: 'api',
  }
}

export const apiProvider: AuthProvider = {
  async login(input) {
    return toSession((await api.post<TokenResponse>('/auth/login', input)).data)
  },
  async register(input) {
    return toSession((await api.post<TokenResponse>('/auth/register', input)).data)
  },
  async restore(session) {
    const { data } = await api.get<AuthUser>('/auth/me')
    return { ...session, user: validateUser(data) }
  },
  async logout() { await api.post('/auth/logout') },
}
