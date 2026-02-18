import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import Sidebar from './components/Sidebar';
import BlockSites from './pages/BlockSites';
import UsageLimit from './pages/UsageLimit';
import Insights from './pages/Insights';
import FocusMode from './pages/FocusMode';
import PasswordProtection from './pages/PasswordProtection';
import CustomBlockPage from './pages/CustomBlockPage';
import Settings from './pages/Settings';
import About from './pages/About';

export type Page =
  | 'block-sites'
  | 'usage-limit'
  | 'insights'
  | 'focus-mode'
  | 'password'
  | 'custom-block-page'
  | 'settings'
  | 'about';

function AppInner() {
  const [currentPage, setCurrentPage] = useState<Page>('block-sites');
  const { store } = useStore();

  // Apply theme
  React.useEffect(() => {
    if (store.settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [store.settings.theme]);

  const renderPage = () => {
    switch (currentPage) {
      case 'block-sites': return <BlockSites />;
      case 'usage-limit': return <UsageLimit />;
      case 'insights': return <Insights />;
      case 'focus-mode': return <FocusMode />;
      case 'password': return <PasswordProtection />;
      case 'custom-block-page': return <CustomBlockPage />;
      case 'settings': return <Settings />;
      case 'about': return <About />;
      default: return <BlockSites />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1 overflow-y-auto flex flex-col">
        <div className="flex-1">
          {renderPage()}
        </div>
        <footer className="border-t border-slate-200 dark:border-slate-800 px-8 py-3 flex items-center justify-between">
          <span className="text-xs text-slate-400">SiteBlocker Pro &mdash; Free &amp; open source</span>
          <span className="text-xs text-slate-400">
            &copy; 2026{' '}
            <a
              href="https://adeelahmad.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-primary-500 underline decoration-dotted transition-colors"
            >
              Muhammad Adeel
            </a>
          </span>
        </footer>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppInner />
    </StoreProvider>
  );
}
