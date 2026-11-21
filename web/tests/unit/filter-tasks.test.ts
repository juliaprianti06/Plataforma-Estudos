import assert from 'node:assert/strict'
import test from 'node:test'
import { defaultTaskFilters, filterTasks, hasActiveFilters } from '../../src/dashboard/filter-tasks.ts'

const now = Date.parse('2026-11-10T12:00:00-03:00')
const tasks = [
  { id: 1, title: 'Lista de cálculo', detail: 'Cálculo I', status: 'todo' as const, priority: 'low' as const, groupId: 'personal', disciplineId: 7, dueAt: '2026-11-20T12:00:00-03:00' },
  { id: 2, title: 'Slides do grupo', detail: 'Clube Python', status: 'progress' as const, priority: 'high' as const, groupId: '3', disciplineId: null, dueAt: '2026-11-09T12:00:00-03:00' },
  { id: 3, title: 'Resumo entregue', detail: 'Cálculo I', status: 'done' as const, priority: 'medium' as const, groupId: 'personal', disciplineId: 7, dueAt: '2026-11-01T12:00:00-03:00' },
  { id: 4, title: 'Leitura sem prazo', detail: 'Clube Python', status: 'todo' as const, priority: 'medium' as const, groupId: '3', disciplineId: null, dueAt: null },
]
const ids = (filters: Partial<typeof defaultTaskFilters>) => filterTasks(tasks, { ...defaultTaskFilters, ...filters }, now).map(task => task.id)

test('filtra por grupo, tarefas pessoais, disciplina e prioridade', () => {
  assert.deepEqual(ids({ group: '3' }), [2, 4])
  assert.deepEqual(ids({ group: 'personal' }), [3, 1])
  assert.deepEqual(ids({ discipline: '7' }), [3, 1])
  assert.deepEqual(ids({ priority: 'medium' }), [3, 4])
})

test('atrasadas ignoram tarefas concluídas e sem prazo', () => {
  assert.deepEqual(ids({ overdue: true }), [2])
})

test('ordena por prazo, prioridade e mais recentes', () => {
  assert.deepEqual(ids({}), [3, 2, 1, 4])
  assert.deepEqual(ids({ sort: 'priority' }), [2, 3, 4, 1])
  assert.deepEqual(ids({ sort: 'recent' }), [4, 3, 2, 1])
})

test('busca ignora acentos e combina com os filtros', () => {
  assert.deepEqual(ids({ query: 'calculo', priority: 'low' }), [1])
})

test('a busca sozinha não conta como filtro ativo', () => {
  assert.equal(hasActiveFilters({ ...defaultTaskFilters, query: 'python' }), false)
  assert.equal(hasActiveFilters({ ...defaultTaskFilters, overdue: true }), true)
  assert.equal(hasActiveFilters({ ...defaultTaskFilters, sort: 'recent' }), true)
})
