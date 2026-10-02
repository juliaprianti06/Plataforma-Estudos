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

test('contrato de API: chamadas de disciplina', async (t) => {
  const previousWindow = globalThis.window
  globalThis.window = { localStorage: memoryStorage(), sessionStorage: memoryStorage() }
  const server = await createServer({
    configFile: false,
    envDir: false,
    define: { 'import.meta.env.VITE_AUTH_MODE': JSON.stringify('api') },
    optimizeDeps: { noDiscovery: true, include: [] },
    resolve: { alias: { '@': fileURLToPath(new URL('../../src', import.meta.url)) } },
    server: { middlewareMode: true, watch: null, ws: false },
  })
  t.after(async () => {
    await server.close()
    globalThis.window = previousWindow
  })
  
  const { sessionStore } = await server.ssrLoadModule('/src/auth/session.ts')
  const { api } = await server.ssrLoadModule('/src/api/client.ts')
  
  const profile = { id: 'user-1', name: 'User', email: 'user@test.com' }
  sessionStore.save({ user: profile, accessToken: 'valid-token', expiresAt: Date.now() + 3600000, mode: 'api' })

  let status = 200
  const calls = []
  
  const mockDisciplinas = [{ id: 1, nome: 'Matemática', professor: 'Carlos', cor: 'bg-blue' }]

  api.defaults.adapter = async (config) => {
    calls.push(config)
    if (status !== 200) {
      throw new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, null,
        { status, data: {}, config, headers: {} })
    }
    
    let data = {}
    if (config.method === 'get' && config.url.includes('/disciplinas')) data = mockDisciplinas
    if (config.method === 'post' && config.url.includes('/disciplinas')) data = { id: 2, ...JSON.parse(config.data) }
    if (config.method === 'put' && config.url.includes('/disciplinas')) data = JSON.parse(config.data)
    if (config.method === 'delete' && config.url.includes('/disciplinas')) data = null

    return { status, statusText: 'OK', headers: {}, config, data }
  }

  await t.test('recupera lista de disciplinas', async () => {
    const res = await api.get('/disciplinas/')
    assert.equal(calls.at(-1).url, '/disciplinas/')
    assert.equal(calls.at(-1).headers.Authorization, 'Bearer valid-token')
    assert.deepEqual(res.data, mockDisciplinas)
  })

  await t.test('cria nova disciplina', async () => {
    const payload = { nome: 'Física', professor: 'Einstein', cor: 'bg-red' }
    const res = await api.post('/disciplinas/', payload)
    assert.equal(calls.at(-1).url, '/disciplinas/')
    assert.deepEqual(JSON.parse(calls.at(-1).data), payload)
    assert.equal(res.data.id, 2)
  })

  await t.test('atualiza disciplina', async () => {
    const payload = { nome: 'Matemática 2' }
    await api.put('/disciplinas/1', payload)
    assert.equal(calls.at(-1).url, '/disciplinas/1')
    assert.deepEqual(JSON.parse(calls.at(-1).data), payload)
  })

  await t.test('deleta disciplina', async () => {
    await api.delete('/disciplinas/1')
    assert.equal(calls.at(-1).url, '/disciplinas/1')
    assert.equal(calls.at(-1).method, 'delete')
  })
})
