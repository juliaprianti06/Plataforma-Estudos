import { useState, useEffect } from 'react';
import { Search, Plus, Menu, ChevronDown } from 'lucide-react';
import { useLayout } from '../../components/layout/layout-context';
import { MateriaisPanel } from './materiais-panel';
import ModalMateriais from './modal-materiais';
import { api } from '../../api/client';

interface Disciplina {
  id: number;
  nome: string;
  cor: string;
}

export default function Materiais() {
  const { openMenu } = useLayout();
  const [busca, setBusca] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [filtroDisciplina, setFiltroDisciplina] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    api.get('/disciplinas/').then(res => setDisciplinas(res.data)).catch(console.error);
  }, []);

  return (
    <div className="bg-background font-sans text-foreground w-full p-4 sm:p-8 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-6 md:gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              onClick={openMenu}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary">Materiais</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">Arquivos compartilhados e adicionados por você</p>
            </div>
          </div>     
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Buscar material..." 
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-full border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring w-full sm:w-64"
              />
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors w-full sm:w-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Adicionar Material
            </button>
          </div>
        </header>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => { setFiltroDisciplina(''); setFiltroGrupo(''); setBusca(''); }}
            className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-colors cursor-pointer ${
              !filtroDisciplina && !filtroGrupo && !busca
                ? 'border-accent bg-accent/10 text-primary' 
                : 'border-border text-muted-foreground hover:bg-muted/50'
            }`}
          >
            Todos
          </button>    
          <div className="relative">
            <select
              value={filtroDisciplina}
              onChange={(e) => setFiltroDisciplina(e.target.value)}
              className="appearance-none flex items-center gap-1.5 pl-4 pr-10 py-1.5 rounded-full border border-border text-muted-foreground hover:bg-muted/50 text-sm font-medium bg-transparent focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="">Disciplina</option>
              {disciplinas.map(d => (
                <option key={d.id} value={d.id}>{d.nome}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={filtroGrupo}
              onChange={(e) => setFiltroGrupo(e.target.value)}
              className="appearance-none flex items-center gap-1.5 pl-4 pr-10 py-1.5 rounded-full border border-border text-muted-foreground hover:bg-muted/50 text-sm font-medium bg-transparent focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="">Grupo</option>
              <option value="Provas">Provas</option>
              <option value="Resumos">Resumos</option>
              <option value="Trabalhos">Trabalhos</option>
              <option value="Listas">Listas</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>
        <div key={refreshKey}>
          <MateriaisPanel 
            disciplinas={disciplinas} 
            searchTerm={busca}
            filtroDisciplinaId={filtroDisciplina}
            filtroGrupo={filtroGrupo}
          />
        </div>      
      </div>
      <ModalMateriais 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => setRefreshKey(prev => prev + 1)}
      />
    </div>
  );
}
