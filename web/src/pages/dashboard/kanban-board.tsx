import { useMemo, useState } from 'react'
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
}

function TaskCard({ task }: { task: DashboardTask }) {
  const completed = task.status === 'done'

  return (
    <article
      className={cn(
        'rounded-lg border border-border bg-card px-3 py-2.5 shadow-xs shadow-primary/5 transition hover:-translate-y-0.5 hover:border-ring/50 hover:shadow-md',
        completed && 'bg-card/65',
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
        </div>
      </div>
    </article>
  )
}
export function KanbanBoard({ tasks, searching }: KanbanBoardProps) {
  const [showAll, setShowAll] = useState(false)

  const groupedTasks = useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        tasks: tasks.filter((task) => task.status === column.status),
      })),
    [tasks],
  )

  const hasTasks = tasks.length > 0

  return (
    <section aria-labelledby="kanban-title" className="flex min-h-0 flex-1 flex-col">
      <div className="mb-2.5 flex items-center justify-between">
        <h2 id="kanban-title" className="text-[13px] font-bold text-primary">
          Kanban
        </h2>
        {!searching && (
          <button
            aria-expanded={showAll}
            className="rounded text-[10px] font-bold text-accent transition hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            onClick={() => setShowAll((current) => !current)}
            type="button"
          >
            {showAll ? 'Mostrar menos' : 'Ver todas as tarefas'}
          </button>
        )}
      </div>

      <div className="min-h-[400px] flex-1 overflow-x-auto rounded-xl border border-border bg-card p-3 shadow-sm shadow-primary/5 sm:p-4">
        {hasTasks ? (
          <div className="grid min-w-[570px] grid-cols-3 gap-3">
            {groupedTasks.map((column) => {
              const displayedTasks = showAll || searching ? column.tasks : column.tasks.slice(0, 2)
              const hiddenCount = column.tasks.length - displayedTasks.length

              return (
                <section
                  aria-labelledby={`column-${column.status}`}
                  className="self-start rounded-xl bg-muted p-2.5"
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

                  <div className="space-y-2">
                    {displayedTasks.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                    {displayedTasks.length === 0 && (
                      <div className="grid min-h-20 place-items-center rounded-lg border border-dashed border-border text-center text-[10px] text-muted-foreground">
                        Nenhuma tarefa
                      </div>
                    )}
                  </div>

                  {hiddenCount > 0 && (
                    <p className="mt-2.5 px-1 text-[9px] font-medium text-muted-foreground">
                      +{hiddenCount} {hiddenCount === 1 ? 'tarefa' : 'tarefas'}
                    </p>
                  )}
                </section>
              )
            })}
          </div>
        ) : (
          <div className="grid h-full min-h-[360px] place-items-center text-center">
            <div>
              <Circle aria-hidden="true" className="mx-auto mb-3 size-8 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">Nenhuma tarefa encontrada</p>
              <p className="mt-1 text-xs text-muted-foreground">Tente buscar usando outro termo.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
