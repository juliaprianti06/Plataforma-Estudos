import { Pencil, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatarDataSessao, formatarDuracao, ordenarSessoes } from '@/lib/study-sessions'
import type { SessaoEstudo } from '../type'

type Props = { sessions: SessaoEstudo[]; onEdit: (sessao: SessaoEstudo) => void; onDelete: (sessao: SessaoEstudo) => void }

export function SessionHistory({ sessions, onEdit, onDelete }: Props) {
  return (
    <section aria-labelledby="historico-titulo">
      <h2 id="historico-titulo" className="text-sm font-semibold text-primary">Histórico de sessões</h2>
      <p className="mb-3 mt-1 text-xs text-muted-foreground">Últimas sessões registradas</p>
      <Card className="gap-0 py-0">
        {!sessions.length ? <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma sessão registrada. Registre sua primeira sessão de estudo.</p> : (
          <ul className="divide-y divide-border">
            {ordenarSessoes(sessions).map(sessao => (
              <li key={sessao.id} className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 text-xs md:grid-cols-[minmax(110px,1.1fr)_100px_115px_56px_minmax(0,1.5fr)_auto]">
                <span className="flex min-w-0 items-center gap-2 font-medium"><span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${sessao.disciplina.cor || 'bg-accent'}`} /><span className="truncate" title={sessao.disciplina.nome}>{sessao.disciplina.nome}</span></span>
                <time dateTime={sessao.data} className="text-muted-foreground">{formatarDataSessao(sessao.data)}</time>
                <span className="text-muted-foreground">{sessao.inicio} – {sessao.termino}</span>
                <span className="w-fit rounded bg-muted px-2 py-0.5 font-medium text-accent">{formatarDuracao(sessao.duracaoMinutos)}</span>
                <span className={`min-w-0 break-words text-muted-foreground ${sessao.observacao ? '' : 'italic'}`}>{sessao.observacao || 'Sem observações'}</span>
                <span className="flex justify-end gap-1">
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={`Editar sessão de ${sessao.disciplina.nome} em ${formatarDataSessao(sessao.data)} às ${sessao.inicio}`} onClick={() => onEdit(sessao)}><Pencil aria-hidden="true" className="size-3.5" /></Button>
                  <Button type="button" variant="ghost" size="icon-sm" className="hover:text-destructive" aria-label={`Excluir sessão de ${sessao.disciplina.nome} em ${formatarDataSessao(sessao.data)} às ${sessao.inicio}`} onClick={() => onDelete(sessao)}><Trash2 aria-hidden="true" className="size-3.5" /></Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  )
}
