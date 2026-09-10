import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { AxiosError } from 'axios'

function memoryStorage() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

test('contrato de API: login, restauração, erros, autorização e logout', async (t) => {
  const previousWindow = globalThis.window
  globalThis.window = { localStorage: memoryStorage(), sessionStorage: memoryStorage() }
  const server = await createServer({
    configFile: false,
    envDir: false,
    define: { 'import.meta.env.VITE_AUTH_MODE': JSON.stringify('api') },
    optimizeDeps: { noDiscovery: true, include: [] },
    resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
    server: { middlewareMode: true, watch: null, ws: false },
  })
  t.after(async () => {
    await server.close()
    globalThis.window = previousWindow
  })
  const { auth, authError } = await server.ssrLoadModule('/src/auth/auth.ts')
  const { api } = await server.ssrLoadModule('/src/api/client.ts')
  const { sessionStore } = await server.ssrLoadModule('/src/auth/session.ts')
  const { Route } = await server.ssrLoadModule('/src/routes/dashboard.tsx')
  const { Route: GroupsRoute } = await server.ssrLoadModule('/src/routes/groups.tsx')
  const { Route: ProfileRoute } = await server.ssrLoadModule('/src/routes/profile.tsx')
  const profile = { id: 'user-1', name: 'Ana Silva', email: 'ana@example.test' }
  let status = 200
  let invalidSession = false
  const calls = []
  api.defaults.adapter = async (config) => {
    calls.push(config)
    if (status !== 200) {
      throw new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, null,
        { status, data: {}, config, headers: {} })
    }
    return {
      status, statusText: 'OK', headers: {}, config,
      data: config.url === '/auth/me' ? profile :
        { access_token: invalidSession ? '' : 'server-token', expires_in: 3600, user: profile },
    }
  }

  await t.test('validates input before making requests', async () => {
    await assert.rejects(auth.login({ email: 'invalid', password: '123456' }, false))
    await assert.rejects(auth.register({ name: ' ', email: profile.email, password: '123456' }))
    assert.equal(calls.length, 0)
  })

  await t.test('uses login contract and persists no password', async () => {
    await auth.login({ email: ' ANA@example.test ', password: '123456' }, true)
    const request = calls.at(-1)
    assert.equal(request.url, '/auth/login')
    assert.deepEqual(JSON.parse(request.data), { email: profile.email, password: '123456' })
    assert.equal(request.headers.Authorization, undefined)
    assert.equal(sessionStore.getSnapshot().accessToken, 'server-token')
    const stored = globalThis.window.localStorage.getItem('mindspace.auth.session.v1')
    assert.equal(stored.includes('password'), false)
  })

  await t.test('validates a saved session with me and attaches bearer token', async () => {
    await auth.restore()
    assert.equal(calls.at(-1).url, '/auth/me')
    assert.equal(calls.at(-1).headers.Authorization, 'Bearer server-token')
    assert.equal(sessionStore.getSnapshot().user.name, 'Ana Silva')
    await Route.options.beforeLoad()
    await GroupsRoute.options.beforeLoad()
    await ProfileRoute.options.beforeLoad()
  })

  await t.test('registration uses the agreed contract', async () => {
    await auth.register({ name: ' Ana Silva ', email: profile.email, password: '123456' })
    assert.equal(calls.at(-1).url, '/auth/register')
    assert.deepEqual(JSON.parse(calls.at(-1).data), { name: 'Ana Silva', email: profile.email, password: '123456' })
    assert.equal(globalThis.window.localStorage.getItem('mindspace.auth.session.v1'), null)
  })

  await t.test('failed public login does not clear an existing session', async () => {
    status = 401
    await assert.rejects(auth.login({ email: profile.email, password: 'wrong-password' }, false),
      (error) => authError(error) === 'E-mail ou senha incorretos.')
    assert.ok(sessionStore.getSnapshot())
  })

  await t.test('401 from a protected resource clears the session', async () => {
    await assert.rejects(api.get('/private'))
    assert.equal(sessionStore.getSnapshot(), null)
  })

  await t.test('malformed successful responses are rejected', async () => {
    status = 200
    invalidSession = true
    await assert.rejects(auth.login({ email: profile.email, password: '123456' }, false))
    assert.equal(sessionStore.getSnapshot(), null)
    invalidSession = false
  })

  await t.test('expired session is removed before protected requests', async () => {
    await auth.login({ email: profile.email, password: '123456' }, false)
    sessionStore.save({ ...sessionStore.getSnapshot(), expiresAt: 1 })
    const count = calls.length
    await assert.rejects(api.get('/private'))
    assert.equal(calls.length, count)
    assert.equal(sessionStore.getSnapshot(), null)
  })

  await t.test('logout clears local session even if backend fails', async () => {
    await auth.login({ email: profile.email, password: '123456' }, true)
    status = 500
    await assert.rejects(auth.logout())
    await assert.rejects(Route.options.beforeLoad(), (error) => error.options?.to === '/')
    await assert.rejects(GroupsRoute.options.beforeLoad(), (error) => error.options?.to === '/')
    await assert.rejects(ProfileRoute.options.beforeLoad(), (error) => error.options?.to === '/')
    assert.equal(calls.at(-1).url, '/auth/logout')
    assert.equal(sessionStore.getSnapshot(), null)
    assert.equal(globalThis.window.localStorage.getItem('mindspace.auth.session.v1'), null)
  })
})
