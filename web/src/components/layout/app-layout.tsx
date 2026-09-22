import { useState, createContext, useContext } from 'react';
import { Sidebar } from './sidebar'
import { useNavigate } from '@tanstack/react-router';

export const LayoutContext = createContext({ openMenu: () => {} });
export const useLayout = () => useContext(LayoutContext);
export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  function handleNavigate(label: string) {
    if (label === 'Início' || label === 'Disciplinas' || label === 'Materiais') {
      if (label === 'Início') navigate({ to: '/dashboard' });
      if (label === 'Disciplinas') navigate({ to: '/disciplinas' });
      if (label === 'Materiais') navigate({ to: '/materiais' });
      return;
    }
    setMessage(`${label} estará disponível em breve.`);
    window.setTimeout(() => setMessage(''), 2500);
  }

  return (
    <LayoutContext.Provider value={{ openMenu: () => setSidebarOpen(true) }}>
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar
          onClose={() => setSidebarOpen(false)}
          onNavigate={handleNavigate}
          open={sidebarOpen}
        />
        <main className="min-w-0 flex-1">
          {children}
        </main>   
        {message && (
          <div
            aria-live="polite"
            className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-xl"
            role="status"
          >
            {message}
          </div>
        )}
      </div>
    </LayoutContext.Provider>
  );
}