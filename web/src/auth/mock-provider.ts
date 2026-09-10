import type { AuthProvider, AuthSession, AuthUser } from './types.ts'

export const DEMO_EMAIL = 'demo@mindspace.test'

// Simulates the flow, not password verification. No passwords are saved.
export function createMockProvider(): AuthProvider {
  function session(user: AuthUser): AuthSession {
    return { user, accessToken: null, expiresAt: Date.now() + 24 * 60 * 60 * 1000, mode: 'mock' }
  }

  return {
    async login({ email }) {
      const normalizedEmail = email.trim().toLowerCase()
      return session({
        id: `mock:${normalizedEmail}`,
        name: normalizedEmail === DEMO_EMAIL ? 'Estudante Demo' : normalizedEmail.split('@')[0],
        email: normalizedEmail,
      })
    },
    async register({ name, email }) {
      const normalizedEmail = email.trim().toLowerCase()
      return session({ id: `mock:${normalizedEmail}`, name: name.trim(), email: normalizedEmail })
    },
    async restore(saved) { return saved },
    async logout() { /* No server session exists in demo mode. */ },
  }
}
