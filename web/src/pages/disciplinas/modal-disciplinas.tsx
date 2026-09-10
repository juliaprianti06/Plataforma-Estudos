import { useState } from 'react';
import { api } from '../../api/client';
import { X } from 'lucide-react';

interface DisciplinaModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function DisciplinaModal({ 
  isOpen = true, 
  onClose = () => {}, 
  onSuccess = () => {} 
}: DisciplinaModalProps) {

  const [nome, setNome] = useState('');
  const [professor, setProfessor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [corSelecionada, setCorSelecionada] = useState('bg-accent');
  const [isSubmitting, setIsSubmitting] = useState(false); 

  const cores = [
    'bg-accent',
    'bg-destructive',
    'bg-primary',
    'bg-warning',        
    'bg-success',        
    'bg-neutral-accent'  
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setIsSubmitting(true);

    try {
      const payload = {
        nome,
        professor,
        descricao,
        cor: corSelecionada,
        ativo: true
      };

      await api.post('/disciplinas/', payload);
      setNome('');
      setProfessor('');
      setDescricao('');
      setCorSelecionada('bg-accent');
      
      onSuccess(); 
      onClose();   
      
    } catch (error) {
      console.error("Erro ao salvar disciplina:", error);
      alert("Houve um erro ao criar a disciplina. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4 backdrop-blur-sm">
      <div className="bg-card w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-primary">
            Nova disciplina
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-primary transition-colors rounded-full p-1 hover:bg-muted/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-muted-foreground">
              Nome
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Cálculo II"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-muted-foreground">
              Professor
            </label>
            <input
              type="text"
              required
              value={professor}
              onChange={(e) => setProfessor(e.target.value)}
              placeholder="Ex: Prof. Silva"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-muted-foreground">
              Descrição (opcional)
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva a disciplina..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors resize-none"
            />
          </div>
          <div className="space-y-2 pt-1">
            <label className="text-sm font-semibold text-muted-foreground">
              Cor
            </label>
            <div className="flex items-center gap-3">
              {cores.map((cor) => (
                <button
                  key={cor}
                  type="button"
                  onClick={() => setCorSelecionada(cor)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${cor}`}
                >
                  {corSelecionada === cor && (
                    <span className="w-2.5 h-2.5 bg-card rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-end gap-6 pt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-accent text-accent-foreground px-8 py-2.5 rounded-xl text-sm font-semibold hover:bg-accent/90 transition-colors shadow-sm disabled:opacity-70"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}