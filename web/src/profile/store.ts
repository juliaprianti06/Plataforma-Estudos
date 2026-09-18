import type { AuthUser } from '../auth/types.ts'

export const studyInterests = ['Programação', 'Design', 'Matemática', 'Ciência de dados', 'Idiomas', 'Ciências'] as const
export type StudyInterest = typeof studyInterests[number]
export type ProfileInput = {
  name: string
  bio: string
  interests: StudyInterest[]
  avatar: string | null
  notifications: { tasks: boolean; groups: boolean }
}
export type UserProfile = ProfileInput & { updatedAt: string | null }
type ProfileStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function defaultProfile(user: AuthUser): UserProfile {
  return { name: user.name, bio: '', interests: [], avatar: null, notifications: { tasks: true, groups: true }, updatedAt: null }
}

export function profileInput(profile: UserProfile): ProfileInput {
  return {
    name: profile.name, bio: profile.bio, interests: [...profile.interests],
    avatar: profile.avatar, notifications: { ...profile.notifications },
  }
}

export function validateProfile(input: ProfileInput): ProfileInput {
  if (typeof input.name !== 'string' || input.name.trim().length < 2 || input.name.trim().length > 100) {
    throw new Error('Informe um nome entre 2 e 100 caracteres.')
  }
  if (typeof input.bio !== 'string' || input.bio.length > 300) throw new Error('A apresentação deve ter até 300 caracteres.')
  if (!Array.isArray(input.interests) || input.interests.length > 3 || !input.interests.every((item) => studyInterests.includes(item))) {
    throw new Error('Escolha até 3 áreas de interesse.')
  }
  if (input.avatar !== null && (typeof input.avatar !== 'string' || input.avatar.length > 300000 ||
    !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(input.avatar))) {
    throw new Error('Escolha uma foto válida para o perfil.')
  }
  if (!input.notifications || typeof input.notifications.tasks !== 'boolean' || typeof input.notifications.groups !== 'boolean') {
    throw new Error('Confira suas preferências de notificações.')
  }
  return {
    name: input.name.trim().replace(/\s+/g, ' '), bio: input.bio.trim(),
    interests: [...new Set(input.interests)], avatar: input.avatar,
    notifications: { tasks: input.notifications.tasks, groups: input.notifications.groups },
  }
}

export function createProfileStore(user: AuthUser, storage: ProfileStorage, mode: 'mock' | 'api' = 'mock') {
  const key = `mindspace.profile.v1:${mode}:${encodeURIComponent(user.id)}`
  let current = defaultProfile(user)
  const listeners = new Set<() => void>()
  try {
    const raw = storage.getItem(key)
    if (raw) {
      const saved = JSON.parse(raw) as UserProfile
      current = {
        ...validateProfile(saved),
        updatedAt: typeof saved.updatedAt === 'string' && Number.isFinite(Date.parse(saved.updatedAt)) ? saved.updatedAt : null,
      }
    }
  } catch { /* A missing or malformed local profile does not prevent access. */ }

  return {
    getSnapshot: () => current,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    save(input: ProfileInput) {
      const next: UserProfile = { ...validateProfile(input), updatedAt: new Date().toISOString() }
      try { storage.setItem(key, JSON.stringify(next)) } catch {
        throw new Error('Não foi possível salvar. Verifique o espaço e as permissões de armazenamento do navegador.')
      }
      current = next
      listeners.forEach((listener) => listener())
      return next
    },
    reset() {
      try { storage.removeItem(key) } catch {
        throw new Error('Não foi possível restaurar o perfil. Tente novamente.')
      }
      current = defaultProfile(user)
      listeners.forEach((listener) => listener())
      return current
    },
  }
}
