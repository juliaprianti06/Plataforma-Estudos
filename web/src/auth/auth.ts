import axios from 'axios'
import { apiProvider } from './api-provider'
import { authMode } from './config'
import { createMockProvider } from './mock-provider'
import { sessionStore } from './session'
import type { Credentials, Registration } from './types'

const provider = authMode === 'api' ? apiProvider : createMockProvider()
let initialization: Promise<void> | undefined

function validate(input: Credentials) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    throw new Error('Informe um e-mail válido.')
  }
  if (input.password.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.')
  return { ...input, email: input.email.trim().toLowerCase() }
}

export const auth = {
  mode: authMode,
  async restore() {
    initialization ??= (async () => {
      const saved = sessionStore.read()
      if (!saved) return
      try {
        const restored = await provider.restore(saved)
        if (sessionStore.getSnapshot() === saved) sessionStore.save(restored)
      } catch { sessionStore.clear() }
    })()
    await initialization
    const session = sessionStore.getSnapshot()
    if (session && session.expiresAt <= Date.now()) sessionStore.clear()
  },
  async login(input: Credentials, remember: boolean) {
    const session = await provider.login(validate(input))
    sessionStore.save(session, remember)
  },
  async register(input: Registration) {
    const credentials = validate(input)
    if (input.name.trim().length < 2) throw new Error('Informe seu nome com pelo menos 2 caracteres.')
    const session = await provider.register({ ...credentials, name: input.name.trim() })
    sessionStore.save(session, false)
  },
  async logout() {
    try { await provider.logout() } finally { sessionStore.clear() }
  },
}

export function authError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Não foi possível conectar ao servidor. Tente novamente.'
    if (error.response.status === 401) return 'E-mail ou senha incorretos.'
    if (error.response.status === 409) return 'Já existe uma conta com este e-mail.'
    if (error.response.status === 422) return 'Confira os dados informados e tente novamente.'
    if (error.response.status === 429) return 'Muitas tentativas. Aguarde um pouco e tente novamente.'
    return 'Não foi possível concluir a solicitação. Tente novamente.'
  }
  return error instanceof Error ? error.message : 'Ocorreu um erro. Tente novamente.'
}
