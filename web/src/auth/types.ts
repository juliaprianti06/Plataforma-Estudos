export type AuthUser = { id: string; name: string; email: string }
export type Credentials = { email: string; password: string }
export type Registration = Credentials & { name: string }
export type AuthSession = {
  user: AuthUser
  accessToken: string | null
  expiresAt: number
  mode: 'mock' | 'api'
}

export interface AuthProvider {
  login(input: Credentials): Promise<AuthSession>
  register(input: Registration): Promise<AuthSession>
  restore(session: AuthSession): Promise<AuthSession>
  logout(): Promise<void>
}
