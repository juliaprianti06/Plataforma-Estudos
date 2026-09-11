import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '../../api/client';

interface TarefaModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  tarefa?: any | null;
  disciplinaId: number;
  disciplinaNome: string;
}

const PRIORIDADES = [
  {
    label: 'Baixa',
    selected: 'bg-success/20 text-success border-success/40',
    unselected: 'border-border text-muted-foreground',
  },
  {
    label: 'Média',
    selected: 'bg-warning/20 text-warning border-warning/40',
    unselected: 'border-border text-muted-foreground',
  },
  {
    label: 'Alta',
    selected: 'bg-destructive/20 text-destructive border-destructive/40',
    unselected: 'border-border text-muted-foreground',
  },
];

const STATUS_OPTIONS = ['A fazer', 'Em andamento', 'Concluído'];

export default function TarefaModal({
  isOpen = true,
  onClose = () => {},
  onSuccess = () => {},
  tarefa = null,
  disciplinaId,
  disciplinaNome,
}: TarefaModalProps) {
  const [nome, setNome] = useState('');
  const [prioridade, setPrioridade] = useState('Média');
  const [dataVencimento, setDataVencimento] = useState('');
  const [status, setStatus] = useState('A fazer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (tarefa) {
      setNome(tarefa.nome || '');
      setPrioridade(tarefa.prioridade || 'Média');
      setDataVencimento(tarefa.data_vencimento || '');
      setStatus(tarefa.feito ? 'Concluído' : 'A fazer');
    } else {
      setNome('');
      setPrioridade('Média');
      setDataVencimento('');
      setStatus('A fazer');
    }
  }, [tarefa, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        nome,
        prioridade,
        data_vencimento: dataVencimento || null,
        feito: status === 'Concluído',
        disciplina_id: disciplinaId,
      };
      if (tarefa?.id) {
        await api.put(`/tarefas/${tarefa.id}`, payload);
      } else {
        await api.post('/tarefas/', payload);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4 backdrop-blur-sm">
      <div className="bg-card w-full max-w-sm rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-primary">
            {tarefa ? 'Editar tarefa' : 'Nova tarefa'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-primary transition-colors cursor-pointer rounded-full p-1 hover:bg-muted/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Título</label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Resolver lista de exercícios"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Disciplina</label>
            <div className="w-full px-3 py-2.5 rounded-xl border-2 border-dashed border-accent/50 bg-accent/5 text-sm text-primary font-medium">
              {disciplinaNome}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Data de entrega</label>
            <input
              type="date"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-transparent text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prioridade</label>
            <div className="flex gap-2">
              {PRIORIDADES.map(({ label, selected, unselected }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setPrioridade(label)}
                  className={`flex-1 py-2 rounded-full text-sm font-semibold border transition-colors cursor-pointer ${
                    prioridade === label ? selected : unselected
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</label>
            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors appearance-none cursor-pointer"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-6 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-accent text-accent-foreground px-6 py-2.5 rounded-xl text-sm font-semibold cursor-pointer hover:bg-accent/90 transition-colors shadow-sm disabled:opacity-70"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
