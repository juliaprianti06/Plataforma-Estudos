import { useState } from 'react';
import { Search, Plus, Pencil, Trash2, Check, Menu } from 'lucide-react';
import { useLayout } from '../../components/layout/app-layout';
import NovaDisciplinaModal from './modal-disciplinas'; 

export default function Disciplinas() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { openMenu } = useLayout();

  const disciplinas = [
    { id: 1, nome: 'Cálculo III', professor: 'Prof. Ana Santos', concluidas: 5, total: 9, progresso: 56, cor: 'bg-destructive', corTexto: 'text-destructive', ativo: true },
    { id: 2, nome: 'Estrutura de Dados', professor: 'Prof. Carlos Lima', concluidas: 7, total: 10, progresso: 70, cor: 'bg-accent', corTexto: 'text-accent', ativo: false },
    { id: 3, nome: 'UX Design', professor: 'Prof. Marina Costa', concluidas: 8, total: 8, progresso: 100, cor: 'bg-success', corTexto: 'text-success', ativo: false },
    { id: 4, nome: 'Banco de Dados', professor: 'Prof. João Mendes', concluidas: 3, total: 7, progresso: 43, cor: 'bg-warning', corTexto: 'text-warning', ativo: false },
    { id: 5, nome: 'Redes de Computadores', professor: 'Prof. Lucia Ferreira', concluidas: 4, total: 6, progresso: 67, cor: 'bg-accent', corTexto: 'text-accent', ativo: false },
    { id: 6, nome: 'Inteligência Artificial', professor: 'Prof. Roberto Alves', concluidas: 2, total: 8, progresso: 25, cor: 'bg-destructive', corTexto: 'text-destructive', ativo: false },
  ];

  const tarefas = [
    { id: 1, nome: 'Resolver lista de integrais triplas', prioridade: 'Alta', status: 'Vence amanhã', feito: false },
    { id: 2, nome: 'Estudar teorema de Green', prioridade: 'Média', status: 'Vence Ter', feito: false },
    { id: 3, nome: 'Entregar trabalho de séries', prioridade: 'Alta', status: 'Atrasado', feito: false, statusCor: 'text-destructive' },
    { id: 4, nome: 'Revisar limites multivariáveis', prioridade: 'Baixa', status: 'Vence Qui', feito: false },
    { id: 5, nome: 'Fazer exercícios cap. 12', prioridade: 'Média', status: 'Vence Sex', feito: false },
    { id: 6, nome: 'Completar quiz de derivadas parciais', prioridade: 'Baixa', status: 'Concluído', feito: true, statusCor: 'text-success' },
    { id: 7, nome: 'Ler capítulo sobre divergência', prioridade: 'Baixa', status: 'Concluído', feito: true, statusCor: 'text-success' },
  ];

  const getBadgeCor = (prioridade: string) => {
    switch (prioridade) {
      case 'Alta': return 'bg-red-100 text-red-600';
      case 'Média': return 'bg-orange-100 text-orange-600';
      case 'Baixa': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
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
          {disciplinas.map((disc) => (
            <div 
              key={disc.id} 
              className={`relative p-5 rounded-xl border transition-all cursor-pointer group ${
                disc.ativo 
                  ? 'border-accent bg-secondary shadow-sm' 
                  : 'border-border bg-card hover:border-accent/50'
              }`}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-semibold text-primary text-lg leading-tight">{disc.nome}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{disc.professor}</p>
                </div>
                <div className={`flex gap-2 text-muted-foreground ${disc.ativo ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'} transition-opacity`}>
                  <button className="hover:text-primary"><Pencil className="w-4 h-4" /></button>
                  <button className="hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${disc.cor}`} style={{ width: `${disc.progresso}%` }}></div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">{disc.concluidas} de {disc.total} tarefas</span>
                  <span className={`font-semibold ${disc.corTexto}`}>{disc.progresso}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="border border-accent bg-card rounded-2xl p-4 sm:p-6 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-6 gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-1 h-12 sm:h-10 bg-destructive rounded-full shrink-0"></div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-primary">Cálculo III</h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Prof. Ana Santos - 3º Semestre - 5 de 9 tarefas concluídas</p>
              </div>
            </div>
          </div>
          <div className="flex gap-6 mt-6 border-b border-border overflow-x-auto">
            <button className="pb-3 text-primary font-bold border-b-2 border-primary text-sm whitespace-nowrap">Tarefas</button>
            <button className="pb-3 text-muted-foreground font-medium text-sm hover:text-primary transition-colors whitespace-nowrap">Materiais</button>
          </div>
          <div className="mt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <span className="text-sm text-muted-foreground">9 tarefas</span>
              <button className="bg-destructive text-white px-5 py-2 rounded-full text-sm font-medium flex items-center justify-center gap-2 hover:bg-destructive/90 transition-colors w-full sm:w-auto cursor-pointer">
                <Plus className="w-4 h-4" /> Adicionar tarefa
              </button>
            </div>
            <div className="space-y-1">
              {tarefas.map((tarefa) => (
                <div key={tarefa.id} className="flex flex-col md:flex-row md:items-center justify-between py-3 md:py-4 border-b border-border/50 hover:bg-muted/30 px-2 rounded-lg transition-colors group gap-3 md:gap-0">
                  <div className="flex items-start md:items-center gap-3 md:gap-4">
                    <button className={`w-5 h-5 mt-0.5 md:mt-0 shrink-0 rounded flex items-center justify-center transition-colors cursor-pointer ${tarefa.feito ? 'bg-accent text-white' : 'border-2 border-border text-transparent hover:border-accent'}`}>
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
                      <span className={`text-xs font-medium w-20 md:w-24 text-left ${tarefa.statusCor || 'text-muted-foreground'}`}>
                        {tarefa.status}
                      </span>
                    </div>
                    <div className="flex gap-3 text-muted-foreground opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button className="hover:text-primary"><Pencil className="w-4 h-4" /></button>
                      <button className="hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <NovaDisciplinaModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}