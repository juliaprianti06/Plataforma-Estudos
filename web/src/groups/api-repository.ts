import type { AuthSession } from '@/auth/types'
import { createSessionRequest } from '@/api/session-request'
import { groupCategories, groupIcons, type StudyGroup } from '@/data/groups'
import type { GroupsRepository } from './repository'

function parseGroup(value: unknown, preview = false): StudyGroup {
  if (!value || typeof value !== 'object') throw new Error('Grupo inv\u00e1lido recebido do servidor.')
  const group = value as StudyGroup
  if (typeof group.id !== 'string' || !group.id || typeof group.name !== 'string' || !group.name.trim() ||
      typeof group.description !== 'string' || !groupCategories.includes(group.category) || !groupIcons.includes(group.icon) ||
      !Number.isInteger(group.members) || group.members < 0 || (!preview &&
      (!['admin', 'member'].includes(group.role) || typeof group.inviteCode !== 'string' || !/^[A-Z0-9]{6}$/.test(group.inviteCode)))) {
    throw new Error('Grupo inv\u00e1lido recebido do servidor.')
  }
  return { id: group.id, name: group.name, description: group.description, category: group.category,
    icon: group.icon, members: group.members, role: preview ? 'member' : group.role, inviteCode: preview ? '' : group.inviteCode }
}

function parseList(value: unknown, preview = false) {
  if (!Array.isArray(value)) throw new Error('Lista de grupos inv\u00e1lida.')
  return value.map((item) => parseGroup(item, preview))
}

export function createApiGroupsRepository(session: AuthSession): GroupsRepository {
  const request = createSessionRequest(session)
  return {
    list: async () => parseList(await request('get', '/groups')),
    discover: async () => parseList(await request('get', '/groups/discover'), true),
    create: async (input, inviteCode) => parseGroup(await request('post', '/groups', { ...input, ...(inviteCode ? { inviteCode } : {}) })),
    update: async (id, input) => parseGroup(await request('put', `/groups/${encodeURIComponent(id)}`, input)),
    join: async (id) => parseGroup(await request('post', `/groups/${encodeURIComponent(id)}/join`)),
    joinByCode: async (code) => parseGroup(await request('post', '/groups/join', { code })),
  }
}
