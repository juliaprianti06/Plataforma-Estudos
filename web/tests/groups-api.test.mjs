import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

function storage() {
  const data = new Map()
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) }
}

test('groups API uses authenticated contracts, validates responses and cancels writes after account changes', async t => {
  const previousWindow = globalThis.window
  globalThis.window = { localStorage: storage(), sessionStorage: storage() }
  const server = await createServer({ configFile: false, envDir: false,
    define: { 'import.meta.env.VITE_AUTH_MODE': JSON.stringify('api') },
    optimizeDeps: { noDiscovery: true, include: [] }, resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
    server: { middlewareMode: true, watch: null, ws: false },
  })
  t.after(async () => { await server.close(); globalThis.window = previousWindow })
  const { sessionStore } = await server.ssrLoadModule('/src/auth/session.ts')
  const { api } = await server.ssrLoadModule('/src/api/client.ts')
  const { createApiGroupsRepository } = await server.ssrLoadModule('/src/groups/api-repository.ts')
  const session = { mode: 'api', user: { id: '1', name: 'Ana', email: 'ana@example.com' }, accessToken: 'token', expiresAt: Date.now() + 3600000 }
  sessionStore.save(session)
  const group = { id: '1', name: 'Clube Python', description: 'Aprendendo Python', category: 'Programação', icon: 'laptop', members: 1, inviteCode: 'ABC123', role: 'admin' }
  const calls = []
  let payload
  api.defaults.adapter = async config => {
    calls.push(config)
    return { data: payload, status: 200, statusText: 'OK', headers: {}, config }
  }
  const groups = createApiGroupsRepository(session)
  payload = [group]
  assert.deepEqual(await groups.list(), [group])
  payload = [{ id: group.id, name: group.name, description: group.description, category: group.category, icon: group.icon, members: 1 }]
  assert.equal((await groups.discover())[0].inviteCode, '')
  payload = group
  const input = { name: group.name, description: group.description, category: group.category, icon: group.icon }
  await groups.create(input, group.inviteCode)
  assert.equal(JSON.parse(calls.at(-1).data).inviteCode, group.inviteCode)
  await groups.update('1', input)
  assert.equal(calls.at(-1).method, 'put')
  await groups.joinByCode('ABC123')
  assert.equal(calls.at(-1).url, '/groups/join')
  await groups.join('1')
  assert.equal(calls.at(-1).url, '/groups/1/join')
  assert.ok(calls.every(call => call.headers.Authorization === 'Bearer token'))
  payload = [{ ...group, inviteCode: 'bad' }]
  await assert.rejects(groups.list())
  const before = calls.length
  const pending = groups.create(input)
  sessionStore.save({ ...session, user: { ...session.user, id: '2' }, accessToken: 'second-token' })
  await assert.rejects(pending)
  assert.equal(calls.length, before)
  await assert.rejects(groups.join('1'))
  assert.equal(calls.length, before)
})
