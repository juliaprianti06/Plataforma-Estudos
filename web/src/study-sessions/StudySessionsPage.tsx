import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from '@tanstack/react-router'
import { Bell, BookOpen, Calendar, Clock, Menu, Plus } from 'lucide-react'
import { useAuth } from '@/auth/use-auth'
import type { AuthSession } from '@/auth/types'
import { criarApiSessoesEstudo } from '@/api/study-sessions'
import { useLayout } from '@/components/layout/layout-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import ConfirmDialog from '@/components/ui/confirm-dialog'
import { formatarDuracao, totalPeriodo, totaisPorDia, totaisPorDisciplina } from '@/lib/study-sessions'
import { StatCard } from './components/StatCard'
import { SessionFormDialog } from './components/SessionFormDialog'
import { SessionHistory } from './components/SessionHistory'
import { HoursPerDayChart } from './components/HoursPerDayChart'
import { TimeBySubject } from './components/TimeBySubject'
import type { DisciplinaEstudo, SessaoEstudo, SessaoEstudoInput } from './type'

export function StudySessionsPage() {
  const session = useAuth()
  if (!session) return <Navigate to="/" replace />
  if (session.mode !== 'api') return (
    <div className="mx-auto max-w-[1440px] p-6">
      <Card className="items-start p-6">
        <h1 className="text-xl font-bold text-primary">Sessões de estudo</h1>
        <p>Entre com uma conta conectada ao servidor para registrar e consultar suas sessões.</p>
        <Link to="/" className="text-accent underline">Voltar ao início</Link>
      </Card>
    </div>
  )
  return <StudySessionsContent key={`${session.user.id}:${session.accessToken}`} session={session} />
}

function StudySessionsContent({ session }: { session: AuthSession }) {
  const { openMenu } = useLayout()
  const api = useMemo(() => criarApiSessoesEstudo(session), [session])
  const [sessoes, setSessoes] = useState<SessaoEstudo[]>([])
  const [disciplinas, setDisciplinas] = useState<DisciplinaEstudo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [tentativa, setTentativa] = useState(0)
  const [editor, setEditor] = useState<SessaoEstudo | 'nova' | null>(null)
  const [excluindo, setExcluindo] = useState<SessaoEstudo | null>(null)
  const [removendo, setRemovendo] = useState(false)
  const [erroExclusao, setErroExclusao] = useState('')
  const [notificacoes, setNotificacoes] = useState(false)
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    let ativo = true
    async function carregar() {
      try {
        const [listaDisciplinas, listaSessoes] = await Promise.all([api.listarDisciplinas(), api.listar()])
        if (ativo) { setDisciplinas(listaDisciplinas); setSessoes(listaSessoes) }
      } catch {
        if (ativo) setErro('Não foi possível carregar as sessões e disciplinas. Tente novamente.')
      } finally { if (ativo) setCarregando(false) }
    }
    void carregar()
    return () => { ativo = false }
  }, [api, tentativa])

  async function salvar(input: SessaoEstudoInput) {
    const resultado = editor && editor !== 'nova' ? await api.editar(editor.id, input) : await api.criar(input)
    setSessoes(atuais => [...atuais.filter(item => item.id !== resultado.id), resultado])
    setMensagem(editor === 'nova' ? 'Sessão registrada.' : 'Sessão atualizada.')
  }

  async function excluir() {
    if (!excluindo || removendo) return
    setRemovendo(true)
    setErroExclusao('')
    try {
      await api.excluir(excluindo.id)
      setSessoes(atuais => atuais.filter(item => item.id !== excluindo.id))
      setExcluindo(null)
      setMensagem('Sessão excluída.')
    } catch { setErroExclusao('Não foi possível excluir. Tente novamente.') }
    finally { setRemovendo(false) }
  }

  const hoje = new Date()
  const semana = totalPeriodo(sessoes, 'semana', hoje)
  const mes = totalPeriodo(sessoes, 'mes', hoje)
  const porDisciplina = totaisPorDisciplina(sessoes)
  const principal = porDisciplina[0]

  return (
    <div className="mx-auto min-h-screen max-w-[1440px] space-y-6 px-4 py-5 sm:px-6 sm:py-7 xl:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button aria-label="Abrir menu" type="button" onClick={openMenu} size="icon" variant="ghost" className="-ml-2 text-primary lg:hidden"><Menu aria-hidden="true" /></Button>
          <div>
            <h1 className="font-heading text-xl font-bold tracking-tight text-primary sm:text-[22px]">Sessões de estudo</h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-[13px]">Registre e acompanhe seu tempo de estudo</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Button type="button" aria-label="Notificações" aria-expanded={notificacoes} onClick={() => setNotificacoes(atual => !atual)} size="icon" variant="ghost" className="text-muted-foreground"><Bell aria-hidden="true" /></Button>
            {notificacoes && <div className="absolute left-0 top-11 z-30 w-64 rounded-xl border border-border bg-card p-4 text-xs shadow-xl sm:left-auto sm:right-0"><p className="mb-2 font-semibold text-primary">Notificações</p><Link to="/dashboard" className="text-muted-foreground hover:underline">Confira seus avisos e atividades no Início.</Link></div>}
          </div>
          <Button type="button" onClick={() => { setMensagem(''); setEditor('nova') }} disabled={carregando || Boolean(erro)} className="h-9 px-4 text-xs"><Plus aria-hidden="true" />Registrar sessão</Button>
        </div>
      </header>

      {carregando ? <Card className="p-8 text-center text-muted-foreground" role="status">Carregando sessões...</Card> : erro ? (
        <Card className="items-start p-5"><p role="alert" className="text-sm text-muted-foreground">{erro}</p><Button type="button" variant="outline" onClick={() => { setErro(''); setCarregando(true); setTentativa(atual => atual + 1) }}>Tentar novamente</Button></Card>
      ) : <>
        <section aria-label="Resumo das sessões" className="grid gap-4 md:grid-cols-3">
          <StatCard label="Esta semana" value={formatarDuracao(semana.minutos)} hint={`${semana.quantidade} ${semana.quantidade === 1 ? 'sessão' : 'sessões'}`} icon={<Clock size={16} />} />
          <StatCard label="Este mês" value={formatarDuracao(mes.minutos)} hint={`${mes.quantidade} ${mes.quantidade === 1 ? 'sessão' : 'sessões'}`} icon={<Calendar size={16} />} />
          <StatCard label="Disciplina mais estudada" value={principal ? <span className="flex flex-wrap items-center justify-between gap-3 text-sm"><span className="flex min-w-0 items-center gap-2"><span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${principal.disciplina.cor || 'bg-accent'}`} />{principal.disciplina.nome}</span><span>{formatarDuracao(principal.minutos)}</span></span> : '—'} hint={principal ? undefined : 'Nenhuma sessão registrada'} icon={<BookOpen size={16} />} />
        </section>
        <section aria-label="Gráficos do tempo de estudo" className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <HoursPerDayChart dias={totaisPorDia(sessoes, hoje)} />
          <TimeBySubject totais={porDisciplina} />
        </section>
        <SessionHistory sessions={sessoes} onEdit={setEditor} onDelete={sessao => { setErroExclusao(''); setExcluindo(sessao) }} />
        {!disciplinas.length && <p className="text-sm text-muted-foreground">Cadastre uma disciplina em <Link to="/disciplinas" className="text-accent underline">Disciplinas</Link> para registrar sessões.</p>}
        <p role="status" aria-live="polite" className="sr-only">{mensagem}</p>
      </>}

      {editor && <SessionFormDialog disciplinas={disciplinas} sessao={editor === 'nova' ? undefined : editor} onClose={() => setEditor(null)} onSubmit={salvar} />}
      <ConfirmDialog isOpen={Boolean(excluindo)} onClose={() => { if (!removendo) setExcluindo(null) }} onConfirm={() => { void excluir() }} title="Excluir sessão" description={`Deseja excluir a sessão de ${excluindo?.disciplina.nome ?? 'estudo'}?`} isLoading={removendo} error={erroExclusao} />
    </div>
  )
}
