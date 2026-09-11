import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Check } from 'lucide-react';
import TarefaModal from './modal-tarefas';
import ConfirmDialog from '../../components/ui/confirm-dialog';
import { api } from '../../api/client';

interface Disciplina {
  id: number;
  nome: string;
  professor: string;
  cor: string;
}

interface Tarefa {
  id: number;
  nome: string;
  prioridade: string;
  data_vencimento: string | null;
  feito: boolean;
  disciplina_id: number;
}

interface TarefasPanelProps {
  disciplina: Disciplina;
  onTarefasChange?: () => void;
}

export function TarefasPanel({ disciplina, onTarefasChange }: TarefasPanelProps) {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tarefaEditando, setTarefaEditando] = useState<Tarefa | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tarefaParaExcluir, setTarefaParaExcluir] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const carregarTarefas = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/tarefas/disciplina/${disciplina.id}`);
      setTarefas(response.data);
      onTarefasChange?.();
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarTarefas();
  }, [disciplina.id]);

  const handleToggleFeito = async (tarefa: Tarefa) => {
    try {
      await api.put(`/tarefas/${tarefa.id}`, { feito: !tarefa.feito });
      carregarTarefas();
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
    }
  };

  const handleExcluir = async () => {
    if (tarefaParaExcluir === null) return;
    setIsDeleting(true);
    try {
      await api.delete(`/tarefas/${tarefaParaExcluir}`);
      carregarTarefas();
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
    } finally {
      setIsDeleting(false);
      setConfirmOpen(false);
      setTarefaParaExcluir(null);
    }
  };

  const getBadgeCor = (prioridade: string) => {
    switch (prioridade) {
      case 'Alta': return 'bg-destructive/15 text-destructive font-bold';
      case 'Média': return 'bg-warning/15 text-warning font-bold';
      case 'Baixa': return 'bg-success/15 text-success font-bold';
      default: return 'bg-muted text-muted-foreground font-bold';
    }
  };

  const concluidas = tarefas.filter((t) => t.feito).length;

  return (
    <>
      <div className="border border-accent bg-card rounded-2xl p-4 sm:p-6 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-6 gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className={`w-1 h-12 sm:h-10 rounded-full shrink-0 ${disciplina.cor || 'bg-accent'}`} />
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-primary">{disciplina.nome}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {disciplina.professor}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <span className="text-sm text-muted-foreground">
              {loading ? 'Carregando...' : `${tarefas.length} tarefa${tarefas.length !== 1 ? 's' : ''}`}
            </span>
            <button
              onClick={() => { setTarefaEditando(null); setIsModalOpen(true); }}
              className="bg-accent text-accent-foreground px-5 py-2 rounded-full text-sm font-medium flex items-center justify-center gap-2 hover:bg-accent/90 transition-colors w-full sm:w-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Adicionar tarefa
            </button>
          </div>
          {!loading && tarefas.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma tarefa ainda. Adicione a primeira!
            </p>
          )}
          <div className="space-y-1">
            {tarefas.map((tarefa) => (
              <div
                key={tarefa.id}
                className="flex flex-col md:flex-row md:items-center justify-between py-3 md:py-4 border-b border-border/50 hover:bg-muted/30 px-2 rounded-lg transition-colors group gap-3 md:gap-0"
              >
                <div className="flex items-start md:items-center gap-3 md:gap-4">
                  <button
                    onClick={() => handleToggleFeito(tarefa)}
                    className={`w-5 h-5 mt-0.5 md:mt-0 shrink-0 rounded flex items-center justify-center transition-colors cursor-pointer ${
                      tarefa.feito
                        ? 'bg-accent text-white'
                        : 'border-2 border-border text-transparent hover:border-accent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  </button>
                  <span className={`text-sm font-medium leading-tight ${tarefa.feito ? 'text-muted-foreground line-through' : 'text-primary'}`}>
                    {tarefa.nome}
                  </span>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6 w-full md:w-auto pl-8 md:pl-0">
                  <div className="flex items-center gap-3 md:gap-6">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getBadgeCor(tarefa.prioridade)}`}>
                      {tarefa.prioridade}
                    </span>
                    {tarefa.data_vencimento && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(tarefa.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 text-muted-foreground opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setTarefaEditando(tarefa); setIsModalOpen(true); }}
                      className="hover:text-primary cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setTarefaParaExcluir(tarefa.id); setConfirmOpen(true); }}
                      className="hover:text-destructive cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <TarefaModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setTarefaEditando(null); }}
        onSuccess={carregarTarefas}
        tarefa={tarefaEditando}
        disciplinaId={disciplina.id}
        disciplinaNome={disciplina.nome}
      />
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleExcluir}
        title="Excluir tarefa"
        description="Deseja realmente excluir essa tarefa? Essa ação não pode ser desfeita."
        isLoading={isDeleting}
      />
    </>
  );
}
