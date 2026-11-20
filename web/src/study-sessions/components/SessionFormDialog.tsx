import { useId, useRef, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { calcularDuracao, dataLocal, formatarDuracao } from '@/lib/study-sessions'
import type { DisciplinaEstudo, SessaoEstudo, SessaoEstudoInput } from '../type'

type Props = {
  onClose: () => void
  disciplinas: DisciplinaEstudo[]
  sessao?: SessaoEstudo
  onSubmit: (input: SessaoEstudoInput) => Promise<void>
}

const campo = 'w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 aria-invalid:border-destructive'
const rotulo = 'mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground'

// Montado a cada abertura para restaurar os valores iniciais do formulário.
export function SessionFormDialog({ onClose, disciplinas, sessao, onSubmit }: Props) {
  const id = useId()
  const primeiroCampo = useRef<HTMLSelectElement>(null)
  const [focoAnterior] = useState(() => document.activeElement instanceof HTMLElement ? document.activeElement : null)
  const [disciplinaId, setDisciplinaId] = useState(sessao ? String(sessao.disciplina.id) : '')
  const [data, setData] = useState(sessao?.data ?? dataLocal(new Date()))
  const [inicio, setInicio] = useState(sessao?.inicio ?? '14:00')
  const [termino, setTermino] = useState(sessao?.termino ?? '15:30')
  const [observacao, setObservacao] = useState(sessao?.observacao ?? '')
  const [tentou, setTentou] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const duracao = calcularDuracao(inicio, termino)
  const opcoes = sessao && !disciplinas.some(item => item.id === sessao.disciplina.id)
    ? [...disciplinas, sessao.disciplina] : disciplinas
  const disciplina = opcoes.find(item => String(item.id) === disciplinaId)
  const erroDisciplina = tentou && !disciplina
  const erroData = tentou && !data
  const erroInicio = tentou && !inicio
  const erroTermino = (tentou || Boolean(inicio && termino)) && duracao <= 0

  async function salvar(event: FormEvent) {
    event.preventDefault()
    if (salvando) return
    setTentou(true)
    if (!disciplina || !data || !inicio || duracao <= 0) return
    setSalvando(true)
    setErro('')
    try {
      await onSubmit({ disciplina, data, inicio, termino, observacao })
      onClose()
    } catch {
      setErro('Não foi possível salvar. Tente novamente.')
    } finally { setSalvando(false) }
  }

  return (
    <Dialog open onOpenChange={aberto => { if (!aberto && !salvando) onClose() }}>
      <DialogContent showCloseButton={false} className="max-h-[90dvh] overflow-y-auto bg-card p-6 sm:max-w-[400px]" onOpenAutoFocus={event => { event.preventDefault(); primeiroCampo.current?.focus() }} onCloseAutoFocus={event => { event.preventDefault(); focoAnterior?.focus() }}>
        <DialogHeader className="pr-7">
          <DialogTitle className="font-semibold text-primary">{sessao ? 'Editar sessão' : 'Registrar sessão'}</DialogTitle>
          <DialogDescription className="sr-only">Informe a disciplina, a data e os horários do estudo.</DialogDescription>
        </DialogHeader>
        <DialogClose asChild><Button aria-label="Fechar" type="button" size="icon-sm" variant="ghost" disabled={salvando} className="absolute right-3 top-3 text-muted-foreground"><X aria-hidden="true" /></Button></DialogClose>
        <form noValidate className="space-y-4" onSubmit={salvar}>
          <div>
            <label className={rotulo} htmlFor={`${id}-disciplina`}>Disciplina</label>
            <select ref={primeiroCampo} id={`${id}-disciplina`} className={campo} value={disciplinaId} onChange={event => setDisciplinaId(event.target.value)} required aria-invalid={erroDisciplina} aria-describedby={erroDisciplina ? `${id}-disciplina-erro` : undefined}>
              <option value="">Selecione a disciplina...</option>
              {opcoes.map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}
            </select>
            {erroDisciplina && <p id={`${id}-disciplina-erro`} className="mt-1 text-xs text-destructive">Selecione uma disciplina.</p>}
            {!opcoes.length && <p className="mt-1 text-xs text-muted-foreground">Cadastre uma disciplina para registrar sessões.</p>}
          </div>
          <div>
            <label className={rotulo} htmlFor={`${id}-data`}>Data</label>
            <input id={`${id}-data`} type="date" className={campo} value={data} onChange={event => setData(event.target.value)} required aria-invalid={erroData} aria-describedby={erroData ? `${id}-data-erro` : undefined} />
            {erroData && <p id={`${id}-data-erro`} className="mt-1 text-xs text-destructive">Informe a data.</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={rotulo} htmlFor={`${id}-inicio`}>Início</label>
              <input id={`${id}-inicio`} type="time" className={campo} value={inicio} onChange={event => setInicio(event.target.value)} required aria-invalid={erroInicio} aria-describedby={erroInicio ? `${id}-inicio-erro` : undefined} />
              {erroInicio && <p id={`${id}-inicio-erro`} className="mt-1 text-xs text-destructive">Informe o início.</p>}
            </div>
            <div>
              <label className={rotulo} htmlFor={`${id}-termino`}>Término</label>
              <input id={`${id}-termino`} type="time" className={campo} value={termino} onChange={event => setTermino(event.target.value)} required aria-invalid={erroTermino} aria-describedby={erroTermino ? `${id}-termino-erro` : undefined} />
              {erroTermino && <p id={`${id}-termino-erro`} className="mt-1 text-xs text-destructive">O término deve ser após o início.</p>}
            </div>
          </div>
          <div>
            <label className={rotulo} htmlFor={`${id}-duracao`}>Duração</label>
            <output id={`${id}-duracao`} aria-live="polite" className="text-sm font-semibold text-accent">{duracao > 0 ? formatarDuracao(duracao) : '—'}</output>
          </div>
          <div>
            <label className={rotulo} htmlFor={`${id}-observacao`}>Observação (opcional)</label>
            <textarea id={`${id}-observacao`} rows={3} className={`${campo} resize-y`} placeholder="Adicione uma nota..." value={observacao} onChange={event => setObservacao(event.target.value)} />
          </div>
          {erro && <p role="alert" className="text-xs text-destructive">{erro}</p>}
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" disabled={salvando} onClick={onClose} className="text-muted-foreground">Cancelar</Button>
            <Button type="submit" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
