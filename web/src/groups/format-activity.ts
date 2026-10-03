const timeZone = 'America/Sao_Paulo'

export function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase('pt-BR')
}

export function formatMaterialSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  const unit = bytes < 1024 * 1024 ? 'KB' : 'MB'
  const amount = bytes / (unit === 'KB' ? 1024 : 1024 * 1024)
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(amount)} ${unit}`
}

export function formatActivityTime(value: string, now = new Date()) {
  const date = new Date(value)
  const day = (value: Date) => new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(value)
  const year = (value: Date) => new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric' }).format(value)
  const label = day(date) === day(now) ? 'Hoje' : day(date) === day(new Date(now.getTime() - 86400000)) ? 'Ontem' :
    new Intl.DateTimeFormat('pt-BR', { timeZone, day: '2-digit', month: 'short', ...(year(date) !== year(now) ? { year: 'numeric' } : {}) }).format(date)
  const time = new Intl.DateTimeFormat('pt-BR', { timeZone, hour: '2-digit', minute: '2-digit' }).format(date)
  return `${label}, ${time}`
}
