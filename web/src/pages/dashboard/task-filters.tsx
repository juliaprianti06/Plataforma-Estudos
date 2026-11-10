import { X } from 'lucide-react'

import { defaultTaskFilters, hasActiveFilters, type TaskFilters } from '@/dashboard/filter-tasks'

const field = 'h-8 rounded-full border border-border bg-card px-3 text-[11px] text-primary outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/15'

type Option = { value: string; label: string }

export function TaskFiltersBar({ filters, groups, disciplines, onChange }: {
  filters: TaskFilters
  groups: Option[]
  disciplines: Option[]
  onChange: (filters: TaskFilters) => void
}) {
  const update = (patch: Partial<TaskFilters>) => onChange({ ...filters, ...patch })
  return (
    <div role="group" aria-label="Filtrar e ordenar tarefas" className="mb-2.5 flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor="task-filter-group">Grupo</label>
      <select id="task-filter-group" className={field} value={filters.group} onChange={event => update({ group: event.target.value })}>
        <option value="">Todos os grupos</option>
        <option value="personal">Tarefas pessoais</option>
        {groups.map(group => <option key={group.value} value={group.value}>{group.label}</option>)}
      </select>
      <label className="sr-only" htmlFor="task-filter-discipline">Disciplina</label>
      <select id="task-filter-discipline" className={field} value={filters.discipline} onChange={event => update({ discipline: event.target.value })} disabled={!disciplines.length}>
        <option value="">Todas as disciplinas</option>
        {disciplines.map(discipline => <option key={discipline.value} value={discipline.value}>{discipline.label}</option>)}
      </select>
      <label className="sr-only" htmlFor="task-filter-priority">Prioridade</label>
      <select id="task-filter-priority" className={field} value={filters.priority} onChange={event => update({ priority: event.target.value })}>
        <option value="">Todas as prioridades</option>
        <option value="high">Alta</option>
        <option value="medium">Média</option>
        <option value="low">Baixa</option>
      </select>
      <label className="sr-only" htmlFor="task-filter-sort">Ordenar por</label>
      <select id="task-filter-sort" className={field} value={filters.sort} onChange={event => update({ sort: event.target.value as TaskFilters['sort'] })}>
        <option value="due">Ordenar por prazo</option>
        <option value="priority">Ordenar por prioridade</option>
        <option value="recent">Mais recentes primeiro</option>
      </select>
      <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-card px-3 text-[11px] text-primary">
        <input type="checkbox" checked={filters.overdue} onChange={event => update({ overdue: event.target.checked })} />
        Somente atrasadas
      </label>
      {hasActiveFilters(filters) && (
        <button type="button" onClick={() => onChange({ ...defaultTaskFilters, query: filters.query })} className="flex h-8 items-center gap-1 rounded-full px-2 text-[11px] font-semibold text-accent hover:text-primary focus-visible:outline-2 focus-visible:outline-ring">
          <X aria-hidden="true" className="size-3.5" /> Limpar filtros
        </button>
      )}
    </div>
  )
}
