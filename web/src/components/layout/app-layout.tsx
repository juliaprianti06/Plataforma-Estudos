import { useState, useEffect, useRef } from 'react';
import { LayoutContext } from './layout-context'
import { navigationItems } from './navigation'
import { Sidebar } from './sidebar'
import { useNavigate } from '@tanstack/react-router';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const messageTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(messageTimer.current), []);

  function handleNavigate(label: string) {
    clearTimeout(messageTimer.current);
    const item = navigationItems.find((item) => item.label === label);
    if (item && 'to' in item) {
      setMessage('');
      navigate({ to: item.to });
      return;
    }
    setMessage(`${label} estará disponível em breve.`);
    messageTimer.current = setTimeout(() => setMessage(''), 2500);
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