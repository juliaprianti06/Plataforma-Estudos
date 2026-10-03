const timeZone = 'America/Sao_Paulo'
const dayFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', timeZone })
const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone })
const weekdayFormatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', timeZone })
const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone,
})

export function formatEventDate(startsAt: string) {
  const date = new Date(startsAt)
  const weekday = weekdayFormatter.format(date)

  return {
    day: dayFormatter.format(date),
    month: monthFormatter.format(date).replace('.', '').toLocaleUpperCase('pt-BR'),
    schedule: `${weekday[0].toLocaleUpperCase('pt-BR')}${weekday.slice(1)}, ${timeFormatter.format(date)}`,
  }
}
