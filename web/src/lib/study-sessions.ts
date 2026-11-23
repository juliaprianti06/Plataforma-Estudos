import type { SessaoEstudo } from '@/study-sessions/type'

export function dataLocal(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
}

export function calcularDuracao(inicio: string, termino: string): number {
  const horaValida = /^([01]\d|2[0-3]):[0-5]\d$/
  if (!horaValida.test(inicio) || !horaValida.test(termino)) return 0
  const minutos = (hora: string) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3))
  return Math.max(0, minutos(termino) - minutos(inicio))
}

export function formatarDuracao(minutos: number): string {
  return `${Math.floor(minutos / 60)}h${String(minutos % 60).padStart(2, '0')}`
}

export function inicioSemana(referencia: Date): Date {
  const inicio = new Date(referencia.getFullYear(), referencia.getMonth(), referencia.getDate())
  inicio.setDate(inicio.getDate() - (inicio.getDay() + 6) % 7)
  return inicio
}

export function totalPeriodo(sessoes: SessaoEstudo[], periodo: 'semana' | 'mes', referencia: Date) {
  const inicio = periodo === 'semana' ? inicioSemana(referencia) : new Date(referencia.getFullYear(), referencia.getMonth(), 1)
  const fim = new Date(inicio)
  if (periodo === 'semana') fim.setDate(fim.getDate() + 7)
  else fim.setMonth(fim.getMonth() + 1)
  const lista = sessoes.filter(sessao => sessao.data >= dataLocal(inicio) && sessao.data < dataLocal(fim))
  return { minutos: lista.reduce((total, sessao) => total + sessao.duracaoMinutos, 0), quantidade: lista.length }
}

export function totaisPorDia(sessoes: SessaoEstudo[], referencia: Date) {
  const inicio = inicioSemana(referencia)
  return ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((rotulo, indice) => {
    const dia = new Date(inicio)
    dia.setDate(dia.getDate() + indice)
    const data = dataLocal(dia)
    return { rotulo, data, minutos: sessoes.filter(sessao => sessao.data === data).reduce((total, sessao) => total + sessao.duracaoMinutos, 0) }
  })
}

export function totaisPorDisciplina(sessoes: SessaoEstudo[]) {
  const totais = new Map<number, { disciplina: SessaoEstudo['disciplina']; minutos: number }>()
  for (const sessao of sessoes) {
    const atual = totais.get(sessao.disciplina.id)
    totais.set(sessao.disciplina.id, { disciplina: sessao.disciplina, minutos: (atual?.minutos ?? 0) + sessao.duracaoMinutos })
  }
  return [...totais.values()].sort((a, b) => b.minutos - a.minutos || a.disciplina.nome.localeCompare(b.disciplina.nome))
}

export function ordenarSessoes(sessoes: SessaoEstudo[]) {
  return [...sessoes].sort((a, b) => `${b.data}T${b.inicio}`.localeCompare(`${a.data}T${a.inicio}`))
}

export function formatarDataSessao(data: string) {
  const [ano, mes, dia] = data.split('-').map(Number)
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${String(dia).padStart(2, '0')} ${meses[mes - 1]} ${ano}`
}
