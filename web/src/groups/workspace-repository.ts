import type { AuthSession } from '@/auth/types'
import { createSessionRequest } from '@/api/session-request'
import type { StudyGroup } from '@/data/groups'
import type { ApiTask, ApiEvent } from '@/dashboard/api-repository'

export type GroupMember = { id: number; name: string; email: string; role: 'admin' | 'member'; avatar: string | null }
export type SharedMaterial = { id_material: number; id_usuario: number; titulo: string; descricao: string | null; url_arquivo: string; content_type: string; tamanho_bytes: number }
export type GroupWorkspace = { group: StudyGroup; members: GroupMember[]; tasks: ApiTask[]; events: ApiEvent[]; materials: SharedMaterial[]; responsibilities: Record<number, number[]> }
export type GroupActivity = {
  id: number; kind: 'comment' | 'joined' | 'material'
  actor: { id: number | null; name: string; avatar: string | null }
  createdAt: string; text: string | null; canDelete: boolean
  material: { id: number | null; title: string; size: number; available: boolean } | null
}
export type GroupFeed = { items: GroupActivity[]; nextCursor: number | null }

function parseFeed(data: GroupFeed): GroupFeed {
  if (!data || !Array.isArray(data.items) || (data.nextCursor !== null && (!Number.isInteger(data.nextCursor) || data.nextCursor <= 0))) throw new Error('Feed inválido recebido do grupo.')
  for (const item of data.items) {
    if (!item || !Number.isInteger(item.id) || !['comment', 'joined', 'material'].includes(item.kind) ||
      !item.actor || typeof item.actor.name !== 'string' || (item.actor.id !== null && !Number.isInteger(item.actor.id)) ||
      (item.actor.avatar !== null && typeof item.actor.avatar !== 'string') ||
      typeof item.createdAt !== 'string' || !Number.isFinite(Date.parse(item.createdAt)) ||
      (item.text !== null && typeof item.text !== 'string') || typeof item.canDelete !== 'boolean' ||
      (item.material !== null && (!item.material || typeof item.material.title !== 'string' ||
        !Number.isFinite(item.material.size) || item.material.size < 0 || typeof item.material.available !== 'boolean' ||
        (item.material.id !== null && !Number.isInteger(item.material.id))))) throw new Error('Atividade inválida recebida do grupo.')
  }
  return data
}

export function createWorkspaceRepository(session: AuthSession, groupId: string) {
  const request = createSessionRequest(session)
  const root = `/groups/${encodeURIComponent(groupId)}`
  return {
    load: async () => {
      const data = await request<GroupWorkspace>('get', `${root}/workspace`)
      if (!data || data.group?.id !== groupId || !Array.isArray(data.members) || !Array.isArray(data.tasks) || !Array.isArray(data.events) || !Array.isArray(data.materials) || !data.responsibilities) throw new Error('Dados inválidos recebidos do grupo.')
      return data
    },
    leave: () => request('post', `${root}/leave`),
    deleteGroup: () => request('delete', root),
    feed: async (before?: number) => parseFeed(await request<GroupFeed>('get', `${root}/feed${before ? `?before=${before}` : ''}`)),
    comment: (text: string) => request<GroupActivity>('post', `${root}/comments`, { text }),
    deleteComment: (id: number) => request('delete', `${root}/comments/${id}`),
    archive: (archived: boolean) => request('put', `${root}/archive`, { archived }),
    rotate: () => request('post', `${root}/invite`),
    role: (id: number, role: GroupMember['role']) => request('put', `${root}/members/${id}`, { role }),
    remove: (id: number) => request('delete', `${root}/members/${id}`),
    assign: (id: number, userIds: number[]) => request('put', `${root}/tasks/${id}/responsibilities`, { userIds }),
    ownMaterials: () => request<SharedMaterial[]>('get', '/materiais/'),
    share: (id: number) => request('post', `${root}/materials/${id}`),
    unshare: (id: number) => request('delete', `${root}/materials/${id}`),
    download: (id: number) => request<Blob>('get', `${root}/materials/${id}/download`, undefined, 'blob'),
  }
}
