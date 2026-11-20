import { describe, expect, test } from 'vitest'
import { calcularDuracao, dataLocal, formatarDataSessao, formatarDuracao, ordenarSessoes, totalPeriodo, totaisPorDia, totaisPorDisciplina } from '@/lib/study-sessions'
import type { SessaoEstudo } from '@/study-sessions/type'

const matematica = { id: 1, nome: 'Matemática', cor: 'bg-success' }
const portugues = { id: 2, nome: 'Português', cor: 'bg-destructive' }
const sessao = (id: string, data: string, minutos: number, disciplina = matematica): SessaoEstudo => ({ id, data, disciplina, inicio: '10:00', termino: '11:00', duracaoMinutos: minutos, observacao: '' })

describe('cálculos das sessões de estudo', () => {
  test('calcula e formata duração, rejeitando horários incompletos, invertidos e iguais', () => {
    expect(calcularDuracao('14:00', '15:30')).toBe(90)
    expect(calcularDuracao('09:45', '11:15')).toBe(90)
    for (const [inicio, fim] of [['14:00', '13:00'], ['14:00', '14:00'], ['', '15:00'], ['25:00', '26:00'], ['12:60', '14:00']]) expect(calcularDuracao(inicio, fim)).toBe(0)
    expect(formatarDuracao(90)).toBe('1h30')
    expect(formatarDuracao(60)).toBe('1h00')
    expect(formatarDuracao(5)).toBe('0h05')
    expect(formatarDuracao(0)).toBe('0h00')
    expect(formatarDuracao(1500)).toBe('25h00')
  })

  test('usa semana de segunda a domingo, mesmo ao cruzar mês e ano', () => {
    const sessoes = [sessao('1', '2026-12-27', 20), sessao('2', '2026-12-28', 30), sessao('3', '2027-01-03', 90), sessao('4', '2027-01-04', 50)]
    expect(totalPeriodo(sessoes, 'semana', new Date(2027, 0, 3, 15))).toEqual({ minutos: 120, quantidade: 2 })
    expect(totalPeriodo(sessoes, 'mes', new Date(2027, 0, 3))).toEqual({ minutos: 140, quantidade: 2 })
    const dias = totaisPorDia(sessoes, new Date(2027, 0, 3))
    expect(dias.map(dia => dia.minutos)).toEqual([30, 0, 0, 0, 0, 0, 90])
    expect(dias[0].data).toBe('2026-12-28')
    expect(dias[6].rotulo).toBe('Dom')
  })

  test('agrega disciplinas por id e ordena por tempo sem misturar nomes iguais', () => {
    const sessoes = [sessao('1', '2026-11-20', 30), sessao('2', '2026-11-19', 70, portugues), sessao('3', '2026-11-18', 60), sessao('4', '2026-11-18', 10, { ...matematica, id: 3 })]
    expect(totaisPorDisciplina(sessoes).map(item => [item.disciplina.id, item.minutos])).toEqual([[1, 90], [2, 70], [3, 10]])
    expect(ordenarSessoes([...sessoes].reverse())[0].id).toBe('1')
    expect(sessoes[0].id).toBe('1')
  })

  test('retorna totais vazios e preserva datas locais, sem conversão para UTC', () => {
    expect(totalPeriodo([], 'mes', new Date(2026, 10, 20))).toEqual({ minutos: 0, quantidade: 0 })
    expect(totaisPorDisciplina([])).toEqual([])
    expect(totaisPorDia([], new Date(2026, 10, 20))).toHaveLength(7)
    expect(dataLocal(new Date(2026, 9, 28, 23, 59))).toBe('2026-10-28')
    expect(formatarDataSessao('2026-10-28')).toBe('28 Out 2026')
  })
})
