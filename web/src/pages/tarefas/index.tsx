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
  status: string;
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
      const novoStatus = tarefa.status === 'concluido' ? 'a_fazer' : 'concluido';
      await api.put(`/tarefas/${tarefa.id}`, { status: novoStatus });
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

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'concluido': return { label: 'Concluído', className: 'bg-accent/15 text-accent font-bold' };
      case 'em_andamento': return { label: 'Em andamento', className: 'bg-primary/15 text-primary font-bold' };
      case 'a_fazer': default: return { label: 'A fazer', className: 'bg-muted text-muted-foreground font-bold' };
    }
  };

  const concluidas = tarefas.filter((t) => t.status === 'concluido').length;

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
            {tarefas.length > 0 && (
              <div className="hidden md:flex items-center justify-between py-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border/50">
                <div className="pl-9">Título</div>
                <div className="flex items-center pr-32">
                  <div className="w-24 text-center">Prioridade</div>
                  <div className="w-28 text-center">Data</div>
                  <div className="w-32 text-center">Status</div>
                </div>
              </div>
            )}
            {tarefas.map((tarefa) => (
              <div
                key={tarefa.id}
                className="flex flex-col md:flex-row md:items-center justify-between py-3 md:py-4 border-b border-border/50 hover:bg-muted/30 px-2 rounded-lg transition-colors group gap-3 md:gap-0"
              >
                <div className="flex items-start md:items-center gap-3 md:gap-4">
                  <button
                    onClick={() => handleToggleFeito(tarefa)}
                    className={`w-5 h-5 mt-0.5 md:mt-0 shrink-0 rounded flex items-center justify-center transition-colors cursor-pointer ${
                      tarefa.status === 'concluido'
                        ? 'bg-accent text-white'
                        : 'border-2 border-border text-transparent hover:border-accent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  </button>
                  <span className={`text-sm font-medium leading-tight ${tarefa.status === 'concluido' ? 'text-muted-foreground line-through' : 'text-primary'}`}>
                    {tarefa.nome}
                  </span>
                </div>
                <div className="flex items-center justify-between md:justify-end w-full md:w-auto pl-8 md:pl-0 md:pr-16">
                  <div className="flex items-center gap-3 md:gap-0">
                    <div className="md:w-24 flex justify-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getBadgeCor(tarefa.prioridade)}`}>
                        {tarefa.prioridade}
                      </span>
                    </div>
                    <div className="md:w-28 flex justify-center hidden md:flex">
                      {tarefa.data_vencimento ? (
                        <span className="text-xs text-muted-foreground">
                          {new Date(tarefa.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>
                    {/* Data mobile: */}
                    {tarefa.data_vencimento && (
                      <span className="text-xs text-muted-foreground md:hidden">
                        {new Date(tarefa.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    )}
                    <div className="md:w-32 flex justify-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusDisplay(tarefa.status).className}`}>
                        {getStatusDisplay(tarefa.status).label}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3 text-muted-foreground opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity md:w-16 justify-end">
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
