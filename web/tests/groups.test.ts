import assert from 'node:assert/strict'
import test from 'node:test'
import { createLocalGroupsRepository } from '../src/groups/repository.ts'
import { initialGroups, matchesGroup, type GroupInput } from '../src/data/groups.ts'

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
  }
}
const input: GroupInput = { name: 'Novo grupo', category: 'Design', description: 'Um grupo para estudar juntos.', icon: 'pencil' }

test('grupos criados e editados persistem e ficam separados por usuário', async () => {
  const storage = memoryStorage()
  const repository = createLocalGroupsRepository('ana', storage)
  const created = await repository.create(input)
  assert.equal(created.members, 1)
  assert.equal(created.role, 'admin')
  await repository.update(created.id, { ...input, name: 'Design de Interfaces' })
  const restored = await createLocalGroupsRepository('ana', storage).list()
  assert.equal(restored.find((group) => group.id === created.id)?.name, 'Design de Interfaces')
  assert.equal((await createLocalGroupsRepository('bia', storage).list()).length, initialGroups.length)
})

test('membros não podem editar, e valores inválidos não são gravados', async () => {
  const repository = createLocalGroupsRepository('ana', memoryStorage())
  await assert.rejects(repository.update('ux', input), /administradores/)
  await assert.rejects(repository.create({ ...input, name: '  ' }))
  await assert.rejects(repository.create({ ...input, description: '  ' }))
  assert.equal((await repository.list()).length, initialGroups.length)
})

test('adicionar grupo atualiza membros e impede participações duplicadas', async () => {
  const repository = createLocalGroupsRepository('ana', memoryStorage())
  const available = await repository.discover()
  const joined = await repository.join(available[0].id)
  assert.equal(joined.members, available[0].members + 1)
  assert.equal(joined.role, 'member')
  assert.equal((await repository.discover()).length, available.length - 1)
  await assert.rejects(repository.join(joined.id), /já participa/)
  await assert.rejects(repository.join('inexistente'), /não encontrado/)
})

test('busca ignora acentos e espaços e também encontra por assunto', () => {
  assert.equal(matchesGroup(initialGroups[3], '  calculo  '), true)
  assert.equal(matchesGroup(initialGroups[0], 'HOOKS'), true)
  assert.equal(matchesGroup(initialGroups[1], 'design'), true)
  assert.equal(matchesGroup(initialGroups[0], 'biologia'), false)
})

test('falha de armazenamento não produz sucesso falso; dados inválidos são recuperados', async () => {
  const repository = createLocalGroupsRepository('ana', {
    getItem: () => '[{"id":"invalido"}]',
    setItem: () => { throw new Error('Quota exceeded') },
  })
  assert.equal((await repository.list()).length, initialGroups.length)
  await assert.rejects(repository.create(input), /Não foi possível salvar/)
  assert.equal((await repository.list()).length, initialGroups.length)
  const realMode = createLocalGroupsRepository('real-user', memoryStorage(), false)
  assert.equal((await realMode.list()).length, 0)
  assert.equal((await realMode.discover()).length, 0)
})

test('código exibido na criação é único, persiste e não muda ao editar', async () => {
  const storage = memoryStorage()
  const repository = createLocalGroupsRepository('ana', storage)
  const created = await repository.create(input, 'AB3X9K')
  assert.equal(created.inviteCode, 'AB3X9K')
  const edited = await repository.update(created.id, { ...input, name: 'Grupo atualizado' })
  assert.equal(edited.inviteCode, created.inviteCode)
  const reloaded = await createLocalGroupsRepository('ana', storage).list()
  assert.equal(reloaded.find((group) => group.id === created.id)?.inviteCode, 'AB3X9K')
  await assert.rejects(repository.create(input, 'AB3X9K'), /já está em uso/)
  const generated = await repository.create(input)
  assert.match(generated.inviteCode, /^[A-Z0-9]{6}$/)
  assert.notEqual(generated.inviteCode, created.inviteCode)
})

test('outra pessoa entra por código e mantém papel de membro, sem duplicar contagem', async () => {
  const storage = memoryStorage()
  const owner = createLocalGroupsRepository('ana', storage)
  const visitor = createLocalGroupsRepository('bia', storage)
  await visitor.list()
  const group = await owner.create(input, 'RX7K2M')
  const joined = await visitor.joinByCode('  rx7k2m  ')
  assert.equal(joined.id, group.id)
  assert.equal(joined.role, 'member')
  assert.equal(joined.members, 2)
  assert.equal((await owner.list()).find((item) => item.id === group.id)?.members, 2)
  await assert.rejects(visitor.joinByCode(group.inviteCode), /já participa/)
  await assert.rejects(visitor.update(group.id, input), /administradores/)
  await owner.update(group.id, { ...input, name: 'Novo nome compartilhado' })
  const refreshed = (await createLocalGroupsRepository('bia', storage).list()).find((item) => item.id === group.id)
  assert.equal(refreshed?.name, 'Novo nome compartilhado')
  assert.equal(refreshed?.members, 2)
  assert.equal(refreshed?.role, 'member')
})

test('códigos inválidos, inexistentes e ainda não criados não dão acesso', async () => {
  const repository = createLocalGroupsRepository('ana', memoryStorage())
  await assert.rejects(repository.joinByCode('a!'), /6 letras/)
  await assert.rejects(repository.joinByCode('ABC123'), /não encontrado/)
  assert.equal((await repository.list()).length, initialGroups.length)
})

test('grupos antigos recebem código sem perder informações ou duplicar participação', async () => {
  const storage = memoryStorage()
  storage.setItem('mindspace.groups.v1:ana', JSON.stringify([
    { ...input, id: 'legacy-group', name: 'Meu grupo antigo', members: 3, role: 'admin' },
    { ...initialGroups[0], inviteCode: undefined, name: 'React com nome personalizado' },
  ]))
  const owner = createLocalGroupsRepository('ana', storage)
  const [migrated] = await owner.list()
  assert.equal(migrated.name, 'Meu grupo antigo')
  assert.equal(migrated.members, 3)
  assert.equal((await owner.list())[1].name, 'React com nome personalizado')
  assert.match(migrated.inviteCode, /^[A-Z0-9]{6}$/)
  assert.equal((await createLocalGroupsRepository('ana', storage).list())[0].inviteCode, migrated.inviteCode)
  await createLocalGroupsRepository('bia', storage).joinByCode(migrated.inviteCode)
  assert.equal((await owner.list())[0].members, 4)
})

test('falha ao gravar entrada não altera participantes nem contagem', async () => {
  const storage = memoryStorage()
  const owner = createLocalGroupsRepository('ana', storage)
  const group = await owner.create(input)
  const visitor = createLocalGroupsRepository('bia', storage)
  await visitor.list()
  const blocked = createLocalGroupsRepository('bia', {
    getItem: storage.getItem,
    setItem: () => { throw new Error('Quota exceeded') },
  })
  await assert.rejects(blocked.joinByCode(group.inviteCode), /Não foi possível salvar/)
  assert.equal((await owner.list()).find((item) => item.id === group.id)?.members, 1)
  assert.equal((await visitor.list()).some((item) => item.id === group.id), false)
})
