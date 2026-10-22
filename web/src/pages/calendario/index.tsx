import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CalendarDays, ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react'
import { useAuth } from '@/auth/use-auth'
import { createDashboardRepository, type ApiTask } from '@/dashboard/api-repository'
import { useLayout } from '@/components/layout/layout-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' })

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function calendarDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const leading = (first.getDay() + 6) % 7
  return Array.from({ length: leading + count }, (_, index) => index < leading ? null : new Date(month.getFullYear(), month.getMonth(), index - leading + 1))
}

function taskColor(task: ApiTask) {
  if (task.status === 'done') return 'bg-emerald-500'
  if (task.priority === 'high') return 'bg-orange-500'
  return 'bg-indigo-500'
}

export default function Calendario() {
  const { openMenu } = useLayout()
  const session = useAuth()
  const repository = useMemo(() => session ? createDashboardRepository(session) : null, [session])
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()))
  const [tasks, setTasks] = useState<ApiTask[]>([])
  const [loading, setLoading] = useState(Boolean(repository))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!repository) return
    let active = true
    repository.calendarTasks().then(nextTasks => {
      if (active) { setTasks(nextTasks); setError('') }
    }).catch(cause => {
      if (active) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o calendário.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [repository])

  const days = useMemo(() => calendarDays(month), [month])
  const monthTasks = useMemo(() => tasks.filter(task => task.dueAt && new Date(task.dueAt).getMonth() === month.getMonth() && new Date(task.dueAt).getFullYear() === month.getFullYear()), [month, tasks])
  const selectedTasks = useMemo(() => tasks.filter(task => task.dueAt && dateKey(new Date(task.dueAt)) === selectedDate), [selectedDate, tasks])

  function changeMonth(offset: number) {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1)
    setMonth(next)
    setSelectedDate(dateKey(next))
  }

  return (
    <div className="mx-auto min-h-screen max-w-[1440px] px-4 py-5 sm:px-6 sm:py-7 xl:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button aria-label="Abrir menu de navegação" className="lg:hidden" onClick={openMenu} size="icon" variant="outline"><CalendarDays aria-hidden="true" /></Button>
          <div><h1 className="text-2xl font-semibold tracking-tight">Calendário</h1><p className="text-sm text-muted-foreground">Tarefas com prazo de entrega</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Button aria-label="Mês anterior" onClick={() => changeMonth(-1)} size="icon" variant="outline"><ChevronLeft aria-hidden="true" /></Button>
          <span className="min-w-36 text-center text-sm font-semibold capitalize">{monthFormatter.format(month)}</span>
          <Button aria-label="Próximo mês" onClick={() => changeMonth(1)} size="icon" variant="outline"><ChevronRight aria-hidden="true" /></Button>
        </div>
      </header>
      {error && <div className="mt-5 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"><AlertCircle aria-hidden="true" className="size-4" />{error}</div>}
      <Card className="mt-6"><CardContent className="p-0">
        <div className="grid grid-cols-7 border-b text-center text-xs font-medium text-muted-foreground">{weekdays.map(day => <div className="px-2 py-3" key={day}>{day}</div>)}</div>
        {loading ? <div className="flex min-h-80 items-center justify-center"><LoaderCircle aria-label="Carregando calendário" className="size-6 animate-spin text-primary" /></div> :
          <div className="grid grid-cols-7">{days.map((day, index) => {
            const key = day ? dateKey(day) : `empty-${index}`
            const dayTasks = day ? monthTasks.filter(task => task.dueAt && dateKey(new Date(task.dueAt)) === key) : []
            const selected = key === selectedDate
            return <button className={`min-h-28 border-b border-r p-2 text-left align-top transition-colors hover:bg-muted/60 ${selected ? 'bg-primary/10 ring-2 ring-inset ring-primary' : ''}`} disabled={!day} key={key} onClick={() => day && setSelectedDate(key)} type="button">
              {day && <><span className={`text-xs ${selected ? 'font-bold text-primary' : 'text-muted-foreground'}`}>{day.getDate()}</span><div className="mt-2 space-y-1">{dayTasks.slice(0, 3).map(task => <div className={`truncate rounded px-1.5 py-1 text-[11px] font-medium text-white ${taskColor(task)}`} key={task.id}>{task.title}</div>)}{dayTasks.length > 3 && <span className="text-[11px] text-muted-foreground">+{dayTasks.length - 3} tarefa(s)</span>}</div></>}
            </button>
          })}</div>}
      </CardContent></Card>
      <section aria-live="polite" className="mt-5"><h2 className="text-base font-semibold">Atividades em {dateFormatter.format(new Date(`${selectedDate}T12:00:00`))}</h2>
        {selectedTasks.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Nenhuma tarefa com prazo nesta data.</p> : <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{selectedTasks.map(task => <Card key={task.id}><CardContent className="p-4"><p className="font-medium">{task.title}</p><p className="mt-1 text-sm text-muted-foreground">{task.groupName}</p></CardContent></Card>)}</div>}
      </section>
    </div>
  )
}
