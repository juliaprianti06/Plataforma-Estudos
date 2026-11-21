import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ChevronLeft, ChevronRight, LoaderCircle, Menu } from 'lucide-react'
import { useAuth } from '@/auth/use-auth'
import { createDashboardRepository, type ApiEvent, type ApiTask } from '@/dashboard/api-repository'
import { useLayout } from '@/components/layout/layout-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import ConfirmDialog from '@/components/ui/confirm-dialog'

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

function PersonalEventDialog({ event, onSave, onClose }: { event?: ApiEvent; onSave: (title: string, startsAt: string) => Promise<void>; onClose: () => void }) {
  const [title, setTitle] = useState(event?.title ?? '')
  const [startsAt, setStartsAt] = useState(() => {
    if (event) {
      const date = new Date(event.startsAt)
      return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    }
    const date = new Date(Date.now() + 60 * 60 * 1000)
    date.setMinutes(0, 0, 0)
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const field = 'mt-1 w-full rounded-md border border-border bg-background p-2 text-foreground focus:outline-ring'

  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose() }}><DialogContent showCloseButton={!busy}>
    <DialogTitle>{event ? 'Editar evento pessoal' : 'Novo evento pessoal'}</DialogTitle>
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
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={title.trim().length < 3}>{busy ? 'Salvando...' : event ? 'Salvar alterações' : 'Criar evento'}</Button></div>
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
  const [editingEvent, setEditingEvent] = useState<ApiEvent | null | undefined>(undefined)
  const [deleteEventTarget, setDeleteEventTarget] = useState<ApiEvent | null>(null)
  const [deletingEvent, setDeletingEvent] = useState(false)
  const [deleteError, setDeleteError] = useState('')

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
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button aria-label="Abrir menu de navegação" className="lg:hidden" onClick={openMenu} size="icon" variant="outline"><Menu aria-hidden="true" /></Button>
          <div><h1 className="text-2xl font-semibold tracking-tight">Calendário</h1><p className="text-sm text-muted-foreground">Organize suas tarefas e compromissos acadêmicos</p></div>
        </div>
        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
          <Button className="flex-1 text-xs sm:flex-none" onClick={() => setEditingEvent(null)}>Novo evento pessoal</Button>
          <Button aria-label="Mês anterior" onClick={() => changeMonth(-1)} size="icon" variant="outline"><ChevronLeft aria-hidden="true" /></Button>
          <span className="min-w-28 text-center text-xs font-semibold capitalize sm:min-w-36 sm:text-sm">{monthFormatter.format(month)}</span>
          <Button aria-label="Próximo mês" onClick={() => changeMonth(1)} size="icon" variant="outline"><ChevronRight aria-hidden="true" /></Button>
        </div>
      </header>
      {error && <div className="mt-5 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"><AlertCircle aria-hidden="true" className="size-4" />{error}</div>}
      <Card className="mt-6 overflow-hidden"><CardContent className="overflow-hidden p-0">
        <div><div className="grid grid-cols-7 border-b text-center text-[9px] font-medium text-muted-foreground sm:text-xs">{weekdays.map(day => <div className="min-w-0 px-0.5 py-2 sm:px-2 sm:py-3" key={day}>{day}</div>)}</div>
        {loading ? <div className="flex min-h-80 items-center justify-center"><LoaderCircle aria-label="Carregando calendário" className="size-6 animate-spin text-primary" /></div> :
          <div className="grid grid-cols-7">{days.map((day, index) => {
            const key = day ? dateKey(day) : `empty-${index}`
            const dayTasks = day ? monthTasks.filter(task => task.dueAt && dateKey(new Date(task.dueAt)) === key) : []
            const dayEvents = day ? events.filter(event => dateKey(new Date(event.startsAt)) === key) : []
            const selected = key === selectedDate
            return <button className={`min-h-20 min-w-0 overflow-hidden border-b border-r p-1 text-left align-top transition-colors hover:bg-muted/60 sm:min-h-28 sm:p-2 ${selected ? 'bg-primary/10 ring-2 ring-inset ring-primary' : ''}`} disabled={!day} key={key} onClick={() => day && setSelectedDate(key)} type="button">
              {day && <><span className={`text-[9px] sm:text-xs ${selected ? 'font-bold text-primary' : 'text-muted-foreground'}`}>{day.getDate()}</span><div className="mt-1 min-w-0 space-y-1 sm:mt-2">{dayTasks.slice(0, 3).map(task => <div className={`truncate rounded px-1 py-0.5 text-[8px] font-medium text-white sm:px-1.5 sm:py-1 sm:text-[11px] ${taskColor(task)}`} key={task.id}>{task.title}</div>)}{dayEvents.slice(0, 2).map(event => <div className={`truncate rounded px-1 py-0.5 text-[8px] font-medium text-white sm:px-1.5 sm:py-1 sm:text-[11px] ${event.groupId === 'personal' ? 'bg-pink-500' : 'bg-teal-500'}`} key={`event-${event.id}`}>{event.title}</div>)}{dayTasks.length + dayEvents.length > 5 && <span className="text-[8px] text-muted-foreground sm:text-[11px]">+{dayTasks.length + dayEvents.length - 5} atividade(s)</span>}</div></>}
            </button>
          })}</div>}
        </div>
      </CardContent></Card>
      <section aria-live="polite" className="mt-5"><h2 className="text-base font-semibold">Atividades em {dateFormatter.format(new Date(`${selectedDate}T12:00:00`))}</h2>
        {selectedTasks.length === 0 && selectedEvents.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Nenhuma atividade nesta data.</p> : <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{selectedTasks.map(task => <Card key={task.id}><CardContent className="p-4"><p className="font-medium">{task.title}</p><p className="mt-1 text-sm text-muted-foreground">{task.groupName}</p></CardContent></Card>)}{selectedEvents.map(event => <Card key={`event-card-${event.id}`}><CardContent className="p-4"><p className="font-medium">{event.title}</p><p className="mt-1 text-sm text-muted-foreground">{event.groupId === 'personal' ? 'Evento pessoal' : event.groupName}</p>{event.groupId === 'personal' && <div className="mt-3 flex gap-2"><Button onClick={() => setEditingEvent(event)} size="sm" variant="outline">Editar</Button><Button onClick={() => { setDeleteError(''); setDeleteEventTarget(event) }} size="sm" variant="destructive">Excluir</Button></div>}</CardContent></Card>)}</div>}
      </section>
      {editingEvent !== undefined && repository && <PersonalEventDialog event={editingEvent ?? undefined} onClose={() => setEditingEvent(undefined)} onSave={async (title, startsAt) => {
        if (editingEvent) await repository.updateEvent(editingEvent.id, { title, startsAt })
        else await repository.createEvent({ title, startsAt, groupId: null })
        setRefresh(value => value + 1)
      }} />}
      <ConfirmDialog
        isOpen={deleteEventTarget !== null}
        onClose={() => { if (!deletingEvent) setDeleteEventTarget(null) }}
        onConfirm={() => {
          if (!deleteEventTarget || !repository) return
          setDeletingEvent(true)
          void repository.deleteEvent(deleteEventTarget.id).then(() => {
            setDeleteEventTarget(null)
            setRefresh(value => value + 1)
          }).catch(cause => setDeleteError(cause instanceof Error ? cause.message : 'Não foi possível excluir o evento.')).finally(() => setDeletingEvent(false))
        }}
        title="Excluir evento pessoal?"
        description="Este evento será removido da sua agenda e essa ação não pode ser desfeita."
        isLoading={deletingEvent}
        error={deleteError}
      />
    </div>
  )
}
