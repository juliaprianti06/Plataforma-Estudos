import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

function storage() {
  const data = new Map()
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) }
}

test('dashboard API validates contracts, permissions and cancels writes after account changes', async t => {
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
  const { createDashboardRepository, taskInput } = await server.ssrLoadModule('/src/dashboard/api-repository.ts')
  const session = { mode: 'api', user: { id: '1', name: 'Ana', email: 'ana@example.com' }, accessToken: 'token', expiresAt: Date.now() + 3600000 }
  sessionStore.save(session)
  const group = { id: '1', name: 'Clube Python', description: 'Aprendendo Python', category: 'Programa\u00e7\u00e3o', icon: 'laptop', members: 1, inviteCode: 'ABC123', role: 'admin' }
  const task = { id: 1, title: 'Estudar Python', description: '', priority: 'high', status: 'todo', dueAt: null, disciplineId: null, groupId: '1', groupName: group.name, detail: group.name, canEdit: true }
  const event = { id: '1', title: 'Encontro Python', startsAt: '2030-01-01T15:00:00Z', groupId: '1', groupName: group.name, canEdit: true }
  const data = { tasks: [task], events: [event], notifications: [], summary: { total: 1, completed: 0, progress: 0, activeTask: task } }
  const calls = []
  let payload
  api.defaults.adapter = async config => {
    calls.push(config)
    return { data: payload, status: 200, statusText: 'OK', headers: {}, config }
  }
  const dashboard = createDashboardRepository(session)
  payload = data
  assert.deepEqual(await dashboard.load(), data)
  payload = task
  await dashboard.createTask({ ...taskInput(task), groupId: '1' })
  assert.equal(calls.at(-1).url, '/tasks')
  await dashboard.updateTask(1, { ...taskInput(task), status: 'done' })
  assert.equal(JSON.parse(calls.at(-1).data).status, 'done')
  assert.equal(JSON.parse(calls.at(-1).data).groupId, undefined)
  await dashboard.deleteTask(1)
  assert.equal(calls.at(-1).method, 'delete')
  payload = event
  await dashboard.createEvent({ title: event.title, startsAt: event.startsAt, groupId: '1' })
  assert.equal(calls.at(-1).url, '/events')
  await dashboard.deleteEvent('1')
  assert.equal(calls.at(-1).method, 'delete')
  assert.ok(calls.every(call => call.headers.Authorization === 'Bearer token'))

  for (const malformed of [null, { ...data, tasks: [{ ...task, status: 'unknown' }] }, { ...data, summary: { ...data.summary, progress: 101 } }, { ...data, events: [{ ...event, startsAt: 'yesterday' }] }]) {
    payload = malformed
    await assert.rejects(dashboard.load(), /inv\u00e1lidos/)
  }
  payload = { tasks: [], events: [], notifications: [], summary: { total: 0, completed: 0, progress: 0, activeTask: null } }
  assert.deepEqual(await dashboard.load(), payload)

  const { createElement } = await import('react')
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { StudyCard } = await server.ssrLoadModule('/src/components/dashboard/study-card.tsx')
  const { UpcomingEvents } = await server.ssrLoadModule('/src/components/dashboard/upcoming-events.tsx')
  const { KanbanBoard } = await server.ssrLoadModule('/src/components/dashboard/kanban-board.tsx')
  const emptySummary = renderToStaticMarkup(createElement(StudyCard, { summary: payload.summary }))
  assert.match(emptySummary, /0 de 0 tarefas/)
  assert.doesNotMatch(emptySummary, /Hooks|82%/)
  assert.match(emptySummary, /disabled/)
  const emptyEvents = renderToStaticMarkup(createElement(UpcomingEvents, { events: [] }))
  assert.match(emptyEvents, /Nenhum evento agendado/)
  assert.doesNotMatch(emptyEvents, /Workshop/)
  const readOnly = renderToStaticMarkup(createElement(KanbanBoard, { tasks: [{ ...task, canEdit: false }], searching: false, onEdit() {} }))
  assert.doesNotMatch(readOnly, /Editar tarefa/)
  const editable = renderToStaticMarkup(createElement(KanbanBoard, { tasks: [task], searching: false, onEdit() {} }))
  assert.match(editable, /Editar tarefa/)

  const before = calls.length
  const pending = dashboard.createTask({ ...taskInput(task), groupId: '1' })
  sessionStore.save({ ...session, user: { ...session.user, id: '2' }, accessToken: 'second-token' })
  await assert.rejects(pending)
  assert.equal(calls.length, before)
})
