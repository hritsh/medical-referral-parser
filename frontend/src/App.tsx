import { useState, useEffect } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TopBar } from '@/components/TopBar';
import { ImportView } from '@/components/ImportView';
import { OrdersView } from '@/components/OrdersView';
import type { ViewType } from '@/types';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('import');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleSaveSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <TopBar
          currentView={currentView}
          onViewChange={setCurrentView}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
        <main className="overflow-auto">
          {currentView === 'import' ? (
            <ImportView onSaveSuccess={handleSaveSuccess} />
          ) : (
            <OrdersView refreshTrigger={refreshTrigger} />
          )}
        </main>
      </div>
    </TooltipProvider>
  );
}

export default App;
