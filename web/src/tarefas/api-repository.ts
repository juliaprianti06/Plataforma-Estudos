import { api } from '@/api/client'

export type Tarefa = {
  id: number
  nome: string
  prioridade: string
  data_vencimento: string | null
  status: string
  disciplina_id: number
}

export type TarefaInput = {
  nome: string
  prioridade: string
  data_vencimento: string | null
  status: string
  disciplina_id: number
}

export const tarefasRepository = {
  async listByDisciplina(disciplinaId: number) {
    const { data } = await api.get<Tarefa[]>(`/tarefas/disciplina/${disciplinaId}`)
    return data
  },
  async create(input: TarefaInput) {
    await api.post('/tarefas/', input)
  },
  async update(id: number, input: TarefaInput) {
    await api.put(`/tarefas/${id}`, input)
  },
  async remove(id: number) {
    await api.delete(`/tarefas/${id}`)
  },
}
