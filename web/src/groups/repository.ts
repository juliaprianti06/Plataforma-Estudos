import { discoverGroups, groupCategories, groupIcons, initialGroups } from '../data/groups.ts'
import type { GroupInput, StudyGroup } from '../data/groups.ts'
import { generateInviteCode, normalizeInviteCode } from './invite-code.ts'

export interface GroupsRepository {
  list(): Promise<StudyGroup[]>
  discover(): Promise<StudyGroup[]>
  create(input: GroupInput, inviteCode?: string): Promise<StudyGroup>
  update(id: string, input: GroupInput): Promise<StudyGroup>
  join(id: string): Promise<StudyGroup>
  joinByCode(code: string): Promise<StudyGroup>
}

type StoredUser = { id: string; groups: StudyGroup[] }
type GroupState = { users: StoredUser[] }

function isGroup(value: unknown, legacy = false): value is StudyGroup {
  if (!value || typeof value !== 'object') return false
  const group = value as StudyGroup
  return typeof group.id === 'string' && !!group.id &&
    typeof group.name === 'string' && !!group.name.trim() && group.name.length <= 60 &&
    typeof group.description === 'string' && group.description.length <= 240 &&
    groupCategories.includes(group.category) && groupIcons.includes(group.icon) &&
    Number.isInteger(group.members) && group.members > 0 &&
    (group.role === 'admin' || group.role === 'member') &&
    (legacy || (typeof group.inviteCode === 'string' && /^[A-Z0-9]{6}$/.test(group.inviteCode)))
}

function validate(input: GroupInput): GroupInput {
  const name = input.name.trim()
  const description = input.description.trim()
  if (name.length < 3 || name.length > 60) throw new Error('Use entre 3 e 60 caracteres no nome.')
  if (description.length < 10 || description.length > 240) throw new Error('Use entre 10 e 240 caracteres na descrição.')
  if (!groupCategories.includes(input.category) || !groupIcons.includes(input.icon)) throw new Error('Escolha uma categoria e um ícone válidos.')
  return { name, description, category: input.category, icon: input.icon }
}

// A shared local snapshot allows demo users in this browser to exchange invitations.
// One storage write commits membership and member counts together.
export function createLocalGroupsRepository(userId: string, storage: Pick<Storage, 'getItem' | 'setItem'>, demo = true): GroupsRepository {
  const key = `mindspace.groups.v2:${demo ? 'mock' : 'api'}`
  const legacyKey = `mindspace.groups.v1:${encodeURIComponent(userId)}`
  const examples = demo ? [...initialGroups, ...discoverGroups] : []
  let fallback: GroupState = { users: [] }

  function allGroups(state: GroupState) {
    return [...state.users.flatMap((user) => user.groups), ...examples]
  }

  function uniqueCode(state: GroupState) {
    const used = new Set(allGroups(state).map((group) => group.inviteCode))
    for (let attempt = 0; attempt < 100; attempt++) {
      const code = generateInviteCode()
      if (!used.has(code)) return code
    }
    throw new Error('Não foi possível gerar um código. Tente novamente.')
  }

  function read() {
    let state = fallback
    try {
      const saved = storage.getItem(key)
      if (saved) {
        const parsed = JSON.parse(saved) as GroupState
        if (!parsed || !Array.isArray(parsed.users) || !parsed.users.every((user) =>
          user && typeof user.id === 'string' && Array.isArray(user.groups) && user.groups.every((group) => isGroup(group)))) {
          throw new Error('Invalid local groups')
        }
        state = parsed
      }
    } catch { /* Keep local fallback if storage is unavailable or malformed. */ }

    let current = state.users.find((user) => user.id === userId)
    if (!current) {
      let groups = demo ? initialGroups.map((group) => ({ ...group })) : []
      try {
        const raw = storage.getItem(legacyKey)
        if (raw !== null) {
          const legacy: unknown = JSON.parse(raw)
          if (Array.isArray(legacy) && legacy.every((group) => isGroup(group, true)) &&
            new Set(legacy.map((group) => group.id)).size === legacy.length) {
            groups = legacy.map((group) => ({ ...group }))
          }
        }
      } catch { /* Existing malformed legacy data falls back to demo groups. */ }
      current = { id: userId, groups: [] }
      state.users.push(current)
      for (const group of groups) {
        const shared = state.users.flatMap((user) => user.groups).find((item) => item.id === group.id)
        const example = examples.find((item) => item.id === group.id)
        const code = shared?.inviteCode ?? example?.inviteCode ?? uniqueCode(state)
        current.groups.push({ ...group, ...(shared ?? {}), role: group.role, inviteCode: code })
      }
      // Preserve migrated codes on reload without preventing read-only use when storage is blocked.
      try { storage.setItem(key, JSON.stringify(state)) } catch { /* Mutations report write failures. */ }
    }
    fallback = state
    return { state, current }
  }

  function save(state: GroupState) {
    try { storage.setItem(key, JSON.stringify(state)) } catch {
      throw new Error('Não foi possível salvar. Verifique se o navegador permite armazenamento local.')
    }
    fallback = state
  }

  function joinGroup(state: GroupState, current: StoredUser, available: StudyGroup) {
    if (current.groups.some((group) => group.id === available.id)) throw new Error('Você já participa deste grupo.')
    const joined: StudyGroup = { ...available, members: available.members + 1, role: 'member' }
    const next = structuredClone(state)
    for (const user of next.users) {
      user.groups = user.groups.map((group) => group.id === joined.id ? { ...joined, role: group.role } : group)
      if (user.id === userId) user.groups.push(joined)
    }
    save(next)
    return { ...joined }
  }

  return {
    async list() { return read().current.groups.map((group) => ({ ...group })) },
    async discover() {
      const { state, current } = read()
      return demo ? discoverGroups.filter((group) => !current.groups.some((joined) => joined.id === group.id))
        .map((group) => ({ ...(allGroups(state).find((item) => item.id === group.id) ?? group) })) : []
    },
    async create(input, inviteCode) {
      const details = validate(input)
      const { state } = read()
      const code = inviteCode === undefined ? uniqueCode(state) : normalizeInviteCode(inviteCode)
      if (allGroups(state).some((group) => group.inviteCode === code)) {
        throw new Error('Este código já está em uso. Reabra o formulário para gerar outro.')
      }
      const group: StudyGroup = { ...details, id: crypto.randomUUID(), members: 1, role: 'admin', inviteCode: code }
      const next = structuredClone(state)
      next.users.find((user) => user.id === userId)!.groups.push(group)
      save(next)
      return { ...group }
    },
    async update(id, input) {
      const details = validate(input)
      const { state, current } = read()
      const existing = current.groups.find((group) => group.id === id)
      if (!existing) throw new Error('Grupo não encontrado.')
      if (existing.role !== 'admin') throw new Error('Apenas administradores podem editar este grupo.')
      const next = structuredClone(state)
      for (const user of next.users) {
        user.groups = user.groups.map((group) => group.id === id ? { ...group, ...details } : group)
      }
      save(next)
      return { ...existing, ...details }
    },
    async join(id) {
      const { state, current } = read()
      if (current.groups.some((group) => group.id === id)) throw new Error('Você já participa deste grupo.')
      const available = demo && discoverGroups.some((group) => group.id === id) ?
        allGroups(state).find((group) => group.id === id) : undefined
      if (!available) throw new Error('Grupo não encontrado.')
      return joinGroup(state, current, available)
    },
    async joinByCode(input) {
      const code = normalizeInviteCode(input)
      const { state, current } = read()
      const available = allGroups(state).find((group) => group.inviteCode === code)
      if (!available) throw new Error('Código não encontrado. Confira com quem enviou o convite.')
      return joinGroup(state, current, available)
    },
  }
}
