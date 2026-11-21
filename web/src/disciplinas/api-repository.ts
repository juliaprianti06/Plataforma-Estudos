import { api } from '@/api/client'

export type Disciplina = {
  id: number
  nome: string
  professor: string
  descricao: string
  cor: string
  ativo: boolean
}

export type DisciplinaInput = Pick<Disciplina, 'nome' | 'professor' | 'descricao' | 'cor'> & { ativo: boolean }

export const disciplinasRepository = {
  async list() {
    const { data } = await api.get<Disciplina[]>('/disciplinas/')
    return data
  },
  async create(input: DisciplinaInput) {
    await api.post('/disciplinas/', input)
  },
  async update(id: number, input: DisciplinaInput) {
    await api.put(`/disciplinas/${id}`, input)
  },
  async remove(id: number) {
    await api.delete(`/disciplinas/${id}`)
  },
}
