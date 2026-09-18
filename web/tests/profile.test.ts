import assert from 'node:assert/strict'
import test from 'node:test'
import { createProfileStore, defaultProfile, profileInput } from '../src/profile/store.ts'
import { prepareProfilePhoto } from '../src/profile/photo.ts'

const user = { id: 'ana', name: 'Ana Silva', email: 'ana@example.test' }
function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
    removeItem: (key: string) => { values.delete(key) },
  }
}

test('perfil persiste campos permitidos e fica separado por usuário e modo', () => {
  const storage = memoryStorage()
  const store = createProfileStore(user, storage)
  const saved = store.save({
    ...profileInput(defaultProfile(user)), name: '  Ana  Maria Silva  ', bio: ' Estudando React. ',
    interests: ['Programação', 'Design'], notifications: { tasks: false, groups: true },
  })
  assert.equal(saved.name, 'Ana Maria Silva')
  assert.equal(saved.bio, 'Estudando React.')
  assert.ok(saved.updatedAt)
  assert.deepEqual(createProfileStore(user, storage).getSnapshot(), saved)
  assert.equal(createProfileStore({ ...user, id: 'bia', name: 'Bia' }, storage).getSnapshot().name, 'Bia')
  assert.equal(createProfileStore(user, storage, 'api').getSnapshot().name, user.name)
})

test('falhas de gravação não atualizam dados nem notificam componentes', () => {
  const store = createProfileStore(user, {
    getItem: () => null,
    setItem: () => { throw new Error('Quota exceeded') },
    removeItem: () => { throw new Error('Storage blocked') },
  })
  let notifications = 0
  store.subscribe(() => { notifications++ })
  assert.throws(() => store.save({ ...profileInput(defaultProfile(user)), name: 'Novo nome' }), /Não foi possível salvar/)
  assert.throws(() => store.reset(), /Não foi possível restaurar/)
  assert.equal(store.getSnapshot().name, user.name)
  assert.equal(notifications, 0)
})

test('validação impede nomes vazios, bios extensas e imagens em formatos não permitidos', () => {
  const store = createProfileStore(user, memoryStorage())
  const draft = profileInput(defaultProfile(user))
  assert.throws(() => store.save({ ...draft, name: ' ' }))
  assert.throws(() => store.save({ ...draft, bio: 'a'.repeat(301) }))
  assert.throws(() => store.save({ ...draft, avatar: 'https://example.test/photo.png' }))
  assert.throws(() => store.save({ ...draft, avatar: 'data:image/svg+xml;base64,AAAA' }))
  assert.throws(() => store.save({ ...draft, interests: ['Design', 'Programação', 'Matemática', 'Idiomas'] }))
  assert.equal(store.getSnapshot().updatedAt, null)
})

test('restaurar perfil não remove grupos ou dados de outro usuário', () => {
  const storage = memoryStorage()
  storage.setItem('mindspace.groups.v2:mock', 'group-fixture')
  const owner = createProfileStore(user, storage)
  const other = createProfileStore({ ...user, id: 'bia', name: 'Bia' }, storage)
  owner.save({ ...profileInput(defaultProfile(user)), bio: 'Nova apresentação.' })
  other.save({ ...profileInput(other.getSnapshot()), bio: 'Perfil da Bia.' })
  let calls = 0
  owner.subscribe(() => { calls++ })
  owner.reset()
  assert.equal(calls, 1)
  assert.equal(owner.getSnapshot().bio, '')
  assert.equal(storage.getItem('mindspace.groups.v2:mock'), 'group-fixture')
  assert.equal(createProfileStore({ ...user, id: 'bia', name: 'Bia' }, storage).getSnapshot().bio, 'Perfil da Bia.')
})

test('perfil corrompido não impede acesso e campos extras não são persistidos', () => {
  const storage = memoryStorage()
  storage.setItem('mindspace.profile.v1:mock:ana', '{broken')
  const store = createProfileStore(user, storage)
  assert.equal(store.getSnapshot().name, user.name)
  const supplied = { ...profileInput(defaultProfile(user)), password: 'secret', accessToken: 'token' }
  store.save(supplied)
  const raw = storage.getItem('mindspace.profile.v1:mock:ana')!
  assert.equal(raw.includes('secret'), false)
  assert.equal(raw.includes('accessToken'), false)
})

test('upload rejeita formato incompatível e arquivo maior que 5 MB', async () => {
  await assert.rejects(prepareProfilePhoto(new File(['test'], 'document.txt', { type: 'text/plain' })), /JPG ou PNG/)
  await assert.rejects(prepareProfilePhoto(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' })), /5 MB/)
})
