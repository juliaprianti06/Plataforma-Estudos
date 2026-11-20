import { calcularDuracao, dataLocal } from '@/lib/study-sessions'
import type { DisciplinaEstudo, SessaoEstudo } from '@/study-sessions/type'

export const disciplinasDemonstracao: DisciplinaEstudo[] = [
  { id: 1, nome: 'Matemática', cor: 'bg-success' },
  { id: 2, nome: 'Português', cor: 'bg-destructive' },
  { id: 3, nome: 'Ciências', cor: 'bg-warning' },
  { id: 4, nome: 'História', cor: 'bg-accent' },
  { id: 5, nome: 'Inglês', cor: 'bg-primary' },
]

// Datas relativas mantêm a demonstração útil em qualquer semana.
export function criarSessoesDemonstracao(disciplinas: DisciplinaEstudo[], referencia: Date): SessaoEstudo[] {
  if (!disciplinas.length) return []
  return [
    { dias: 0, inicio: '14:00', termino: '15:30', observacao: 'Revisão e exercícios' },
    { dias: 0, inicio: '09:00', termino: '10:15', observacao: 'Leitura e anotações' },
    { dias: 1, inicio: '16:00', termino: '17:30', observacao: '' },
    { dias: 2, inicio: '10:00', termino: '11:00', observacao: 'Revisão do conteúdo' },
    { dias: 3, inicio: '08:00', termino: '09:15', observacao: 'Exercícios de fixação' },
    { dias: 8, inicio: '14:00', termino: '16:00', observacao: '' },
  ].map((item, indice) => {
    const data = new Date(referencia)
    data.setDate(data.getDate() - item.dias)
    return { id: `demo-${indice}`, disciplina: { ...disciplinas[indice % disciplinas.length] }, data: dataLocal(data),
      inicio: item.inicio, termino: item.termino, duracaoMinutos: calcularDuracao(item.inicio, item.termino), observacao: item.observacao }
  })
}
