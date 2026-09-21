import assert from 'node:assert/strict'
import test from 'node:test'
import { formatEventDate } from '../../src/lib/event-date.ts'

test('dia, mês e horário correspondem à data completa do evento', () => {
  assert.deepEqual(formatEventDate('2026-10-12T14:00:00-03:00'), {
    day: '12', month: 'OUT', schedule: 'Segunda-feira, 14:00',
  })
  assert.deepEqual(formatEventDate('2028-02-29T10:30:00-03:00'), {
    day: '29', month: 'FEV', schedule: 'Terça-feira, 10:30',
  })
})

test('usa o fuso de São Paulo mesmo quando a data UTC está em outro mês e ano', () => {
  assert.deepEqual(formatEventDate('2027-01-01T01:00:00Z'), {
    day: '31', month: 'DEZ', schedule: 'Quinta-feira, 22:00',
  })
  assert.deepEqual(formatEventDate('2027-01-01T00:00:00-03:00'), {
    day: '01', month: 'JAN', schedule: 'Sexta-feira, 00:00',
  })
})
