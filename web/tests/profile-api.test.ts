import assert from 'node:assert/strict'
import test from 'node:test'
import { createApiProfileStore } from '../src/profile/api-store.ts'
import { defaultProfile, profileInput } from '../src/profile/store.ts'

const user = { id: '1', name: 'Ana Silva', email: 'ana@example.com' }
const initial = defaultProfile(user)
const updated = { ...initial, name: 'Ana Maria', bio: 'Python', updatedAt: '2026-09-12T12:00:00Z' }

function transport() {
  return {
    load: async (): Promise<unknown> => initial,
    save: async (): Promise<unknown> => updated,
    reset: async (): Promise<unknown> => initial,
    export: async (): Promise<unknown> => ({ ...updated, email: user.email }),
  }
}

test('remote profile starts unloaded, shares pending load and blocks premature saves', async () => {
  let resolve!: (value: unknown) => void
  let calls = 0
  const api = transport()
  api.load = () => { calls++; return new Promise((done) => { resolve = done }) }
  const store = createApiProfileStore(user, api, () => {})
  assert.equal(store.getSnapshot(), null)
  const first = store.load()
  const second = store.load()
  assert.equal(calls, 1)
  await assert.rejects(store.save(profileInput(initial)), /carregamento/)
  resolve(initial)
  await Promise.all([first, second])
  assert.deepEqual(store.getSnapshot(), initial)
  assert.deepEqual(store.getStatusSnapshot(), { loading: false, error: null })
})

test('load errors remain visible and can be retried', async () => {
  const api = transport()
  api.load = async () => { throw new Error('Servidor indisponivel') }
  const store = createApiProfileStore(user, api, () => {})
  await assert.rejects(store.load())
  assert.equal(store.getSnapshot(), null)
  assert.equal(store.getStatusSnapshot().error, 'Servidor indisponivel')
  api.load = async () => initial
  await store.load()
  assert.equal(store.getStatusSnapshot().error, null)
})

test('save and reset only publish confirmed results and export fetches server data', async () => {
  const api = transport()
  const names: string[] = []
  const store = createApiProfileStore(user, api, (profile) => names.push(profile.name))
  await store.load()
  assert.deepEqual(await store.save(profileInput(updated)), updated)
  assert.deepEqual(await store.export(), { ...updated, email: user.email })
  assert.deepEqual(await store.reset(), initial)
  assert.deepEqual(names, [initial.name, updated.name, initial.name])
})

test('failed saves preserve confirmed data and allow subsequent requests', async () => {
  const api = transport()
  const store = createApiProfileStore(user, api, () => {})
  await store.load()
  api.save = async () => { throw new Error('Offline') }
  await assert.rejects(store.save(profileInput(updated)))
  assert.deepEqual(store.getSnapshot(), initial)
  api.save = async () => updated
  assert.deepEqual(await store.save(profileInput(updated)), updated)
})

test('invalid responses and foreign exports are rejected without replacing the profile', async () => {
  const api = transport()
  const store = createApiProfileStore(user, api, () => {})
  await store.load()
  for (const data of [null, {}, { ...updated, updatedAt: 'invalid' }, { ...updated, name: '' }]) {
    api.save = async () => data
    await assert.rejects(store.save(profileInput(updated)))
    assert.deepEqual(store.getSnapshot(), initial)
  }
  api.export = async () => ({ ...updated, email: 'another@example.com' })
  await assert.rejects(store.export())
})

test('concurrent mutations are blocked until the first operation completes', async () => {
  const api = transport()
  let resolve!: (value: unknown) => void
  api.save = () => new Promise((done) => { resolve = done })
  const store = createApiProfileStore(user, api, () => {})
  await store.load()
  const save = store.save(profileInput(updated))
  await assert.rejects(store.reset(), /andamento/)
  resolve(updated)
  await save
  assert.deepEqual(store.getSnapshot(), updated)
})
