import { useMemo, useState, type PointerEvent, type ReactNode } from 'react'
import { Check, Circle } from 'lucide-react'

import type { DashboardTask, TaskPriority, TaskStatus } from '@/data/dashboard'
import { cn } from '@/lib/utils'

const columns: { label: string; status: TaskStatus }[] = [
  { label: 'A fazer', status: 'todo' },
  { label: 'Em andamento', status: 'progress' },
  { label: 'Concluído', status: 'done' },
]

const priorityClasses: Record<TaskPriority, string> = {
  high: 'bg-destructive',
  medium: 'bg-chart-3',
  low: 'bg-success',
}
type KanbanBoardProps = {
  tasks: DashboardTask[]
  searching: boolean
  toolbar?: ReactNode
  expanded?: boolean
  emptyHint?: string
  onEdit?: (task: DashboardTask) => void
  onMove?: (task: DashboardTask, status: TaskStatus) => void
  busy?: boolean
}

function TaskCard({ task, onEdit, onMove, busy, dragging, onTouchStart }: { task: DashboardTask; onEdit?: (task: DashboardTask) => void; onMove?: KanbanBoardProps['onMove']; busy?: boolean; dragging?: boolean; onTouchStart?: (event: PointerEvent<HTMLElement>, task: DashboardTask) => void }) {
  const completed = task.status === 'done'
  const editable = 'canEdit' in task && task.canEdit === true

  return (
    <article
      draggable={!!onMove && editable && !busy}
      onDragStart={event => { event.dataTransfer.setData('text/plain', String(task.id)); event.dataTransfer.effectAllowed = 'move' }}
      onPointerDown={event => { if (event.pointerType === 'touch') onTouchStart?.(event, task) }}
      className={cn(
        'rounded-lg border border-border bg-card px-3 py-2.5 shadow-xs shadow-primary/5 transition hover:-translate-y-0.5 hover:border-ring/50 hover:shadow-md touch-pan-y',
        completed && 'bg-card/65',
        dragging && 'pointer-events-none opacity-60 ring-2 ring-accent',
      )}
    >
      <div className="flex items-start gap-2">
        {completed ? (
          <span className="mt-0.5 grid size-3.5 shrink-0 place-items-center rounded-full bg-success/20 text-success">
            <Check aria-hidden="true" className="size-2.5" strokeWidth={3} />
          </span>
        ) : (
          <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', priorityClasses[task.priority])} />
        )}
        <div className="min-w-0">
          <h3
            className={cn(
              'text-[11px] font-semibold leading-4 text-primary',
              completed && 'text-muted-foreground',
            )}
          >
            {task.title}
          </h3>
          <p
            className={cn(
              'mt-1 text-[9px] font-medium capitalize text-muted-foreground',
              task.priority === 'high' && task.status !== 'done' && 'text-destructive',
              completed && 'text-success',
            )}
          >
            {task.detail}
          </p>
          {'description' in task && typeof task.description === 'string' && task.description && <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">{task.description}</p>}
          {'dueAt' in task && typeof task.dueAt === 'string' && <p className="mt-1 text-[9px] text-muted-foreground">Prazo: <time dateTime={task.dueAt}>{new Date(task.dueAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' })}</time></p>}
        </div>
      </div>
      {onEdit && editable && <button type="button" disabled={busy} className="mt-2 rounded text-xs font-semibold text-accent focus-visible:outline-ring" onPointerDown={event => event.stopPropagation()} onClick={() => onEdit(task)}>Editar tarefa</button>}
    </article>
  )
}
export function KanbanBoard({ tasks, searching, toolbar, emptyHint, onEdit, onMove, busy }: KanbanBoardProps) {
  const [draggingTaskId, setDraggingTaskId] = useState<number | null>(null)
  const [dropStatus, setDropStatus] = useState<TaskStatus | null>(null)
  const groupedTasks = useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        tasks: tasks.filter((task) => task.status === column.status),
      })),
    [tasks],
  )

  const hasTasks = tasks.length > 0

  function startTouchDrag(event: PointerEvent<HTMLElement>, task: DashboardTask) {
    if (!onMove || busy || !('canEdit' in task) || task.canEdit !== true) return
    event.preventDefault()
    setDraggingTaskId(task.id)
  }

  function finishTouchDrag(status: TaskStatus) {
    if (draggingTaskId === null) return
    const task = tasks.find(item => item.id === draggingTaskId)
    if (task && task.status !== status) onMove?.(task, status)
    setDraggingTaskId(null)
    setDropStatus(null)
  }

  return (
    <section aria-labelledby="kanban-title" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="mb-2.5 flex items-center justify-between">
        <h2 id="kanban-title" className="text-[13px] font-bold text-primary">
          Kanban
        </h2>
      </div>
      {toolbar}

      <div className="min-h-[400px] flex-1 overflow-x-hidden rounded-xl border border-border bg-card p-3 shadow-sm shadow-primary/5 sm:overflow-x-auto sm:p-4" onPointerUp={() => { setDraggingTaskId(null); setDropStatus(null) }} onPointerCancel={() => { setDraggingTaskId(null); setDropStatus(null) }}>
        {hasTasks ? (
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:min-w-[570px] sm:grid-cols-3">
            {groupedTasks.map((column) => {
              const displayedTasks = column.tasks

              return (
                <section
                  onDragOver={event => { if (onMove && !busy) event.preventDefault() }}
                  onDrop={event => {
                    event.preventDefault()
                    const task = tasks.find(task => String(task.id) === event.dataTransfer.getData('text/plain'))
                    if (task && 'canEdit' in task && task.canEdit === true && !busy && task.status !== column.status) onMove?.(task, column.status)
                  }}
                  onPointerEnter={() => { if (draggingTaskId !== null) setDropStatus(column.status) }}
                  onPointerUp={() => finishTouchDrag(column.status)}
                  aria-labelledby={`column-${column.status}`}
                  className={cn('self-start rounded-xl bg-muted p-2.5 transition-colors', dropStatus === column.status && 'ring-2 ring-accent')}
                  key={column.status}
                >
                  <div className="mb-2.5 flex items-center justify-between px-0.5">
                    <h3 id={`column-${column.status}`} className="text-[10px] font-bold text-primary">
                      {column.label}
                    </h3>
                    <span className="grid size-5 place-items-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground">
                      {column.tasks.length}
                    </span>
                  </div>

                  <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1 sm:max-h-[480px]">
                    {displayedTasks.map((task) => (
                      <TaskCard key={task.id} task={task} onEdit={onEdit} onMove={onMove} busy={busy} dragging={draggingTaskId === task.id} onTouchStart={startTouchDrag} />
                    ))}
                    {displayedTasks.length === 0 && (
                      <div className="grid min-h-20 place-items-center rounded-lg border border-dashed border-border text-center text-[10px] text-muted-foreground">
                        Nenhuma tarefa
                      </div>
                    )}
                  </div>

                </section>
              )
            })}
          </div>
        ) : (
          <div className="grid h-full min-h-[360px] place-items-center text-center">
            <div>
              <Circle aria-hidden="true" className="mx-auto mb-3 size-8 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">Nenhuma tarefa encontrada</p>
              <p className="mt-1 text-xs text-muted-foreground">{searching ? 'Tente outro termo de busca ou limpe os filtros.' : emptyHint ?? 'Crie uma tarefa em um dos seus grupos para começar.'}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
