export type DisciplinaEstudo = { id: number; nome: string; cor: string }

export type SessaoEstudo = {
  id: string
  disciplina: DisciplinaEstudo
  data: string
  inicio: string
  termino: string
  duracaoMinutos: number
  observacao: string
}

export type SessaoEstudoInput = Omit<SessaoEstudo, 'id' | 'duracaoMinutos'>
