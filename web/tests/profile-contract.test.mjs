import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

function memoryStorage() {
  const data = new Map()
  return { getItem: k => data.get(k) ?? null, setItem: (k,v) => data.set(k,v), removeItem: k => data.delete(k) }
}

test('profile API binds requests to the session and keeps the account name in sync', async (t) => {
  const previousWindow = globalThis.window
  globalThis.window = { localStorage: memoryStorage(), sessionStorage: memoryStorage() }
  const server = await createServer({
    configFile: false, envDir: false,
    define: { 'import.meta.env.VITE_AUTH_MODE': JSON.stringify('api') },
    optimizeDeps: { noDiscovery: true, include: [] },
    resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
    server: { middlewareMode: true, watch: null, ws: false },
  })
  t.after(async () => { await server.close(); globalThis.window = previousWindow })
  const { createRemoteProfileStore } = await server.ssrLoadModule('/src/profile/api-provider.ts')
  const { sessionStore } = await server.ssrLoadModule('/src/auth/session.ts')
  const { api } = await server.ssrLoadModule('/src/api/client.ts')
  const first = { user: { id: '1', name: 'Ana', email: 'ana@example.com' }, accessToken: 'first-token', mode: 'api', expiresAt: Date.now() + 3600000 }
  const profile = { name: 'Ana Maria', bio: '', interests: [], avatar: null, notifications: { tasks: true, groups: true }, updatedAt: null }
  sessionStore.save(first)
  const calls = []
  api.defaults.adapter = async (config) => {
    calls.push(config)
    return { data: config.url.endsWith('/export') ? { ...profile, email: first.user.email } : profile, status: 200, statusText: 'OK', headers: {}, config }
  }
  const store = createRemoteProfileStore(first)
  await store.load()
  assert.equal(sessionStore.getSnapshot().user.name, profile.name)
  assert.equal(calls[0].headers.Authorization, 'Bearer first-token')
  await store.save(profile)
  assert.equal(calls.at(-1).method, 'put')
  assert.equal(JSON.parse(calls.at(-1).data).name, profile.name)
  await store.export()
  assert.equal(calls.at(-1).url, '/profile/me/export')
  await store.reset()
  assert.equal(calls.at(-1).method, 'delete')

  // Changing accounts before Axios dispatch must cancel the old write.
  const count = calls.length
  const pending = store.save(profile)
  sessionStore.save({ ...first, user: { ...first.user, id: '2', name: 'Bia' }, accessToken: 'second-token' })
  await assert.rejects(pending)
  assert.equal(calls.length, count)
  assert.equal(sessionStore.getSnapshot().user.name, 'Bia')
  await assert.rejects(store.reset())
  assert.equal(calls.length, count)
})
