import assert from 'node:assert/strict'
import test from 'node:test'
import { createSessionStore, SESSION_KEY } from '../src/auth/session-store.ts'
import { createMockProvider } from '../src/auth/mock-provider.ts'

function memoryStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() { return values.size },
    key: (index) => [...values.keys()][index] ?? null,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value) },
    removeItem: (key) => { values.delete(key) },
    clear: () => values.clear(),
  }
}

test('cadastro simulado preserva perfil ao recarregar, sem salvar a senha', async () => {
  const storage = { local: memoryStorage(), session: memoryStorage() }
  const provider = createMockProvider()
  const session = await provider.register({ name: ' Ana Silva ', email: 'ANA@example.test', password: 'segredo123' })
  createSessionStore(storage, 'mock').save(session, false)
  const restored = createSessionStore(storage, 'mock').read()
  assert.equal(restored?.user.name, 'Ana Silva')
  assert.equal(restored?.user.email, 'ana@example.test')
  assert.equal(storage.local.length, 0)
  assert.equal(storage.session.getItem(SESSION_KEY)?.includes('segredo123'), false)
  assert.equal(restored?.accessToken, null)
})

test('lembrar de mim persiste; trocar para sessão temporária remove a persistente; sair limpa ambas', async () => {
  const storage = { local: memoryStorage(), session: memoryStorage() }
  const store = createSessionStore(storage, 'mock')
  const session = await createMockProvider().login({ email: 'demo@mindspace.test', password: '123456' })
  store.save(session, true)
  assert.equal(storage.session.length, 0)
  const reloaded = createSessionStore(storage, 'mock')
  assert.equal(reloaded.read()?.user.name, 'Estudante Demo')
  reloaded.save(session)
  assert.ok(storage.local.getItem(SESSION_KEY))
  reloaded.save(session, false)
  assert.equal(storage.local.length, 0)
  assert.ok(storage.session.getItem(SESSION_KEY))
  reloaded.clear()
  assert.equal(reloaded.getSnapshot(), null)
  assert.equal(storage.local.length + storage.session.length, 0)
})

test('sessões corrompidas, expiradas ou de outro modo não autorizam acesso', async () => {
  const valid = await createMockProvider().login({ email: 'demo@example.test', password: '123456' })
  for (const raw of ['{invalid', 'null', JSON.stringify({ ...valid, expiresAt: 1 }),
    JSON.stringify({ ...valid, user: {} }), JSON.stringify({ ...valid, mode: 'api' })]) {
    const storage = { local: memoryStorage(), session: memoryStorage() }
    storage.local.setItem(SESSION_KEY, raw)
    assert.equal(createSessionStore(storage, 'mock').read(), null)
    assert.equal(storage.local.length, 0)
  }
  const storage = { local: memoryStorage(), session: memoryStorage() }
  storage.local.setItem(SESSION_KEY, JSON.stringify(valid))
  assert.equal(createSessionStore(storage, 'api').read(), null)
})

test('armazenamento bloqueado mantém sessão apenas em memória e permite sair', async () => {
  const blocked = new Proxy({} as Storage, { get() { throw new Error('Storage blocked') } })
  const store = createSessionStore({ local: blocked, session: blocked }, 'mock')
  assert.equal(store.read(), null)
  const session = await createMockProvider().login({ email: 'demo@example.test', password: '123456' })
  store.save(session, true)
  assert.equal(store.getSnapshot()?.user.email, 'demo@example.test')
  store.clear()
  assert.equal(store.getSnapshot(), null)
})
