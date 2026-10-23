import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CalendarDays, ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react'
import { useAuth } from '@/auth/use-auth'
import { createDashboardRepository, type ApiEvent, type ApiTask } from '@/dashboard/api-repository'
import { useLayout } from '@/components/layout/layout-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

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

function PersonalEventDialog({ onSave, onClose }: { onSave: (title: string, startsAt: string) => Promise<void>; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [startsAt, setStartsAt] = useState(() => {
    const date = new Date(Date.now() + 60 * 60 * 1000)
    date.setMinutes(0, 0, 0)
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const field = 'mt-1 w-full rounded-md border border-border bg-background p-2 text-foreground focus:outline-ring'

  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose() }}><DialogContent showCloseButton={!busy}>
    <DialogTitle>Novo evento pessoal</DialogTitle>
    <DialogDescription>Adicione um compromisso que ficará visível somente para você.</DialogDescription>
    <form onSubmit={async event => {
      event.preventDefault(); setError('')
      if (new Date(startsAt).getTime() <= Date.now()) { setError('Escolha uma data futura.'); return }
      setBusy(true)
      try { await onSave(title.trim(), new Date(startsAt).toISOString()); onClose() }
      catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível criar o evento.') }
      finally { setBusy(false) }
    }}>
      <fieldset className="space-y-3" disabled={busy}>
        <label className="block">Título<input className={field} value={title} onChange={event => setTitle(event.target.value)} minLength={3} maxLength={150} required /></label>
        <label className="block">Data e horário<input className={field} type="datetime-local" value={startsAt} onChange={event => setStartsAt(event.target.value)} required /></label>
        {error && <p role="alert" className="text-destructive">{error}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={title.trim().length < 3}>{busy ? 'Salvando...' : 'Criar evento'}</Button></div>
      </fieldset>
    </form>
  </DialogContent></Dialog>
}

export default function Calendario() {
  const { openMenu } = useLayout()
  const session = useAuth()
  const repository = useMemo(() => session ? createDashboardRepository(session) : null, [session])
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()))
  const [tasks, setTasks] = useState<ApiTask[]>([])
  const [events, setEvents] = useState<ApiEvent[]>([])
  const [loading, setLoading] = useState(Boolean(repository))
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [newEventOpen, setNewEventOpen] = useState(false)

  useEffect(() => {
    if (!repository) return
    let active = true
    Promise.all([repository.calendarTasks(), repository.calendarEvents()]).then(([nextTasks, nextEvents]) => {
      if (active) { setTasks(nextTasks); setEvents(nextEvents); setError('') }
    }).catch(cause => {
      if (active) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o calendário.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [repository, refresh])

  const days = useMemo(() => calendarDays(month), [month])
  const monthTasks = useMemo(() => tasks.filter(task => task.dueAt && new Date(task.dueAt).getMonth() === month.getMonth() && new Date(task.dueAt).getFullYear() === month.getFullYear()), [month, tasks])
  const selectedTasks = useMemo(() => tasks.filter(task => task.dueAt && dateKey(new Date(task.dueAt)) === selectedDate), [selectedDate, tasks])
  const selectedEvents = useMemo(() => events.filter(event => dateKey(new Date(event.startsAt)) === selectedDate), [events, selectedDate])

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
          <div><h1 className="text-2xl font-semibold tracking-tight">Calendário</h1><p className="text-sm text-muted-foreground">Organize suas tarefas e compromissos acadêmicos</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setNewEventOpen(true)}>Novo evento pessoal</Button>
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
            const dayEvents = day ? events.filter(event => dateKey(new Date(event.startsAt)) === key) : []
            const selected = key === selectedDate
            return <button className={`min-h-28 border-b border-r p-2 text-left align-top transition-colors hover:bg-muted/60 ${selected ? 'bg-primary/10 ring-2 ring-inset ring-primary' : ''}`} disabled={!day} key={key} onClick={() => day && setSelectedDate(key)} type="button">
              {day && <><span className={`text-xs ${selected ? 'font-bold text-primary' : 'text-muted-foreground'}`}>{day.getDate()}</span><div className="mt-2 space-y-1">{dayTasks.slice(0, 3).map(task => <div className={`truncate rounded px-1.5 py-1 text-[11px] font-medium text-white ${taskColor(task)}`} key={task.id}>{task.title}</div>)}{dayEvents.slice(0, 2).map(event => <div className={`truncate rounded px-1.5 py-1 text-[11px] font-medium text-white ${event.groupId === 'personal' ? 'bg-pink-500' : 'bg-teal-500'}`} key={`event-${event.id}`}>{event.title}</div>)}{dayTasks.length + dayEvents.length > 5 && <span className="text-[11px] text-muted-foreground">+{dayTasks.length + dayEvents.length - 5} atividade(s)</span>}</div></>}
            </button>
          })}</div>}
      </CardContent></Card>
      <section aria-live="polite" className="mt-5"><h2 className="text-base font-semibold">Atividades em {dateFormatter.format(new Date(`${selectedDate}T12:00:00`))}</h2>
        {selectedTasks.length === 0 && selectedEvents.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Nenhuma atividade nesta data.</p> : <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{selectedTasks.map(task => <Card key={task.id}><CardContent className="p-4"><p className="font-medium">{task.title}</p><p className="mt-1 text-sm text-muted-foreground">{task.groupName}</p></CardContent></Card>)}{selectedEvents.map(event => <Card key={`event-card-${event.id}`}><CardContent className="p-4"><p className="font-medium">{event.title}</p><p className="mt-1 text-sm text-muted-foreground">{event.groupId === 'personal' ? 'Evento pessoal' : event.groupName}</p></CardContent></Card>)}</div>}
      </section>
      {newEventOpen && repository && <PersonalEventDialog onClose={() => setNewEventOpen(false)} onSave={async (title, startsAt) => {
        await repository.createEvent({ title, startsAt, groupId: null })
        setRefresh(value => value + 1)
      }} />}
    </div>
  )
}
