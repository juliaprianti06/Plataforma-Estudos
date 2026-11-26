export type AuthUser = { id: string; name: string; email: string }
export type Credentials = { email: string; password: string }
export type Registration = Credentials & { name: string }
export type AuthSession = {
  user: AuthUser
  sessionKey: string
  expiresAt: number
  mode: 'mock' | 'api'
}

export interface AuthProvider {
  login(input: Credentials, remember?: boolean): Promise<AuthSession>
  register(input: Registration): Promise<AuthSession>
  restore(session: AuthSession): Promise<AuthSession>
  logout(): Promise<void>
}
