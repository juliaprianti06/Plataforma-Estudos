import type { AuthUser } from '../auth/types.ts'
import { validateProfile, type ProfileInput, type UserProfile } from './store.ts'

export type ProfileStatus = { loading: boolean; error: string | null }
export type ProfileExport = UserProfile & { email: string }
export type ProfileTransport = {
  load: () => Promise<unknown>
  save: (input: ProfileInput) => Promise<unknown>
  reset: () => Promise<unknown>
  export: () => Promise<unknown>
}

function readProfile(data: unknown): UserProfile {
  if (!data || typeof data !== 'object' || !('updatedAt' in data)) {
    throw new Error('O servidor retornou um perfil inválido.')
  }
  const profile = data as UserProfile
  if (profile.updatedAt !== null && (typeof profile.updatedAt !== 'string' || !Number.isFinite(Date.parse(profile.updatedAt)))) {
    throw new Error('O servidor retornou uma data inválida.')
  }
  return { ...validateProfile(profile), updatedAt: profile.updatedAt }
}

export function createApiProfileStore(user: AuthUser, transport: ProfileTransport, onSaved: (profile: UserProfile) => void) {
  let current: UserProfile | null = null
  let status: ProfileStatus = { loading: true, error: null }
  let loading: Promise<UserProfile> | null = null
  let writing = false
  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach((listener) => listener())
  const publish = (value: unknown) => {
    const profile = readProfile(value)
    current = profile
    status = { loading: false, error: null }
    onSaved(profile)
    notify()
    return profile
  }

  async function write(request: () => Promise<unknown>) {
    if (!current || status.loading) throw new Error('Aguarde o carregamento do perfil.')
    if (writing) throw new Error('Aguarde a operação em andamento.')
    writing = true
    try { return publish(await request()) } finally { writing = false }
  }

  return {
    getSnapshot: () => current,
    getStatusSnapshot: () => status,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    load(): Promise<UserProfile> {
      if (loading) return loading
      if (current) return Promise.resolve(current)
      status = { loading: true, error: null }
      notify()
      loading = transport.load().then(publish).catch((cause: unknown) => {
        status = { loading: false, error: cause instanceof Error ? cause.message : 'Não foi possível carregar o perfil.' }
        notify()
        throw cause
      }).finally(() => { loading = null })
      return loading
    },
    save: (input: ProfileInput) => write(() => transport.save(validateProfile(input))),
    reset: () => write(transport.reset),
    async export(): Promise<ProfileExport> {
      const result = await transport.export()
      const profile = readProfile(result)
      if ((result as ProfileExport).email !== user.email) throw new Error('O servidor retornou uma conta inválida.')
      return { ...profile, email: user.email }
    },
  }
}
