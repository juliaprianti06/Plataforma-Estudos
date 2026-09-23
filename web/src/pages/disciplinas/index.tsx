import { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, Menu, ChevronDown, ChevronUp } from 'lucide-react';
import { useLayout } from '../../components/layout/layout-context';
import NovaDisciplinaModal from './modal-disciplinas';
import ConfirmDialog from '../../components/ui/confirm-dialog';
import { TarefasPanel } from '../tarefas/index';
import { MateriaisPanel } from '../materiais/materiais-panel';
import { api } from '../../api/client';

interface Disciplina {
  id: number;
  nome: string;
  professor: string;
  descricao: string;
  cor: string;
  ativo: boolean;
}

export default function Disciplinas() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [disciplinaEditando, setDisciplinaEditando] = useState<Disciplina | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [disciplinaParaExcluir, setDisciplinaParaExcluir] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [busca, setBusca] = useState('');
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState<Disciplina | null>(null);
  const [progressoMap, setProgressoMap] = useState<Record<number, { total: number; concluidas: number }>>({});
  const [activeTab, setActiveTab] = useState<'tarefas' | 'materiais'>('tarefas');
  const { openMenu } = useLayout();

  const disciplinasFiltradas = disciplinas.filter((d) =>
    d.nome.toLowerCase().includes(busca.toLowerCase())
  );
  
  const carregarProgresso = async (lista: Disciplina[]) => {
    try {
      const resultados = await Promise.all(
        lista.map((d) => api.get(`/tarefas/disciplina/${d.id}`).then((r) => ({ id: d.id, tarefas: r.data })))
      );
      const mapa: Record<number, { total: number; concluidas: number }> = {};
      resultados.forEach(({ id, tarefas }) => {
        mapa[id] = {
          total: tarefas.length,
          concluidas: tarefas.filter((t: any) => t.status === 'concluido').length,
        };
      });
      setProgressoMap(mapa);
    } catch (error) {
      console.error('Erro ao carregar progresso:', error);
    }
  };

  const carregarDisciplinas = async () => {
    try {
      const response = await api.get('/disciplinas/');
      setDisciplinas(response.data);
      carregarProgresso(response.data);
    } catch (error) {
      console.error('Erro ao buscar disciplinas:', error);
    }
  };

  useEffect(() => {
    carregarDisciplinas();
  }, []);

  const handleAbrirConfirmExcluir = (id: number) => {
    setDisciplinaParaExcluir(id);
    setConfirmOpen(true);
  };

  const handleExcluir = async () => {
    if (disciplinaParaExcluir === null) return;
    setIsDeleting(true);
    try {
      await api.delete(`/disciplinas/${disciplinaParaExcluir}`);
      if (disciplinaSelecionada?.id === disciplinaParaExcluir) setDisciplinaSelecionada(null);
      carregarDisciplinas();
    } catch (error) {
      console.error('Erro ao excluir:', error);
    } finally {
      setIsDeleting(false);
      setConfirmOpen(false);
      setDisciplinaParaExcluir(null);
    }
  };

  const handleSelecionarDisciplina = (disc: Disciplina) => {
    setDisciplinaSelecionada((prev) => prev?.id === disc.id ? null : disc);
  };
  const handleEditarDisciplina = (disciplina: Disciplina) => {
    setDisciplinaEditando(disciplina);
    setIsModalOpen(true);
  };

  const handleFecharModal = () => {
    setDisciplinaEditando(null);
    setIsModalOpen(false);
  };


  return (
    <div className="bg-background font-sans text-foreground w-full p-4 sm:p-8 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-4">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              onClick={openMenu}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary">Disciplinas</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">Organize suas matérias e acompanhe o progresso</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Buscar disciplina..." 
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-full border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring w-full sm:w-64"
              />
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors w-full sm:w-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Nova disciplina
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {disciplinasFiltradas.map((disc) => (
            <div 
              key={disc.id}
              onClick={() => handleSelecionarDisciplina(disc)}
              className={`relative p-5 rounded-xl border transition-all cursor-pointer group ${
                disciplinaSelecionada?.id === disc.id
                  ? 'border-accent bg-card shadow-md'
                  : 'border-border bg-card hover:border-accent/50'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-start gap-3">
                  <div className={`w-1 h-10 rounded-full shrink-0 mt-0.5 ${disc.cor || 'bg-accent'}`} />
                  <div>
                    <h3 className="font-semibold text-primary text-lg leading-tight">{disc.nome}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{disc.professor}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2`}>
                  <div className={`flex gap-2 text-muted-foreground transition-opacity`}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEditarDisciplina(disc); }} 
                      className="hover:text-primary transition-colors cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleAbrirConfirmExcluir(disc.id); }} 
                      className="hover:text-destructive transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {disciplinaSelecionada?.id === disc.id
                    ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  }
                </div>
              </div>

              {disc.descricao && (
                <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                  {disc.descricao}
                </p>
              )}

              <div className="space-y-2">
                <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${disc.cor || 'bg-accent'}`}
                    style={{ width: `${progressoMap[disc.id]?.total ? Math.round((progressoMap[disc.id].concluidas / progressoMap[disc.id].total) * 100) : 0}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">
                    {progressoMap[disc.id]?.concluidas ?? 0} de {progressoMap[disc.id]?.total ?? 0} tarefas
                  </span>
                  <span className="font-semibold text-muted-foreground">
                    {progressoMap[disc.id]?.total ? Math.round((progressoMap[disc.id].concluidas / progressoMap[disc.id].total) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {disciplinaSelecionada && (
          <div className="space-y-4">
            <div className="flex border-b border-border gap-6">
              <button
                className={`pb-2 text-sm font-semibold transition-colors ${activeTab === 'tarefas' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-primary'}`}
                onClick={() => setActiveTab('tarefas')}
              >
                Tarefas
              </button>
              <button
                className={`pb-2 text-sm font-semibold transition-colors ${activeTab === 'materiais' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-primary'}`}
                onClick={() => setActiveTab('materiais')}
              >
                Materiais
              </button>
            </div>
            
            {activeTab === 'tarefas' ? (
              <TarefasPanel
                disciplina={disciplinaSelecionada}
                onTarefasChange={() => carregarProgresso(disciplinas)}
              />
            ) : (
              <MateriaisPanel 
                disciplinaId={disciplinaSelecionada.id} 
                disciplinas={disciplinas}
              />
            )}
          </div>
        )}

      </div>
      <NovaDisciplinaModal 
        isOpen={isModalOpen} 
        onClose={handleFecharModal} 
        onSuccess={carregarDisciplinas}
        disciplina={disciplinaEditando}
      />
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleExcluir}
        title="Excluir disciplina"
        description="Deseja realmente excluir essa disciplina? Essa ação não pode ser desfeita."
        isLoading={isDeleting}
      />
    </div>
  );
}