import { useState } from 'react';

export default function DisciplinaModal({ isOpen = true, onClose = () => {} }) {
  const [corSelecionada, setCorSelecionada] = useState('bg-accent');
  const cores = [
    'bg-accent',
    'bg-destructive',
    'bg-primary',
    'bg-warning',        
    'bg-success',        
    'bg-neutral-accent'  
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4 backdrop-blur-sm">
      <div className="bg-card w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-xl">
        <h2 className="text-xl font-bold text-primary mb-6">
          Nova disciplina
        </h2>
        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-muted-foreground">
              Nome
            </label>
            <input
              type="text"
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
              placeholder="Ex: Prof. Silva"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-muted-foreground">
              Descrição (opcional)
            </label>
            <textarea
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
              className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-accent text-accent-foreground px-8 py-2.5 rounded-xl text-sm font-semibold hover:bg-accent/90 transition-colors shadow-sm"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}