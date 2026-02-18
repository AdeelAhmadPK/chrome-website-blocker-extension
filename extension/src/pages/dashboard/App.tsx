import React, { useState, useEffect, useRef } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import Sidebar from './components/Sidebar';
import Overview from './pages/Overview';
import BlockSites from './pages/BlockSites';
import UsageLimit from './pages/UsageLimit';
import Insights from './pages/Insights';
import FocusMode from './pages/FocusMode';
import PasswordProtection from './pages/PasswordProtection';
import CustomBlockPage from './pages/CustomBlockPage';
import Settings from './pages/Settings';
import About from './pages/About';
import Onboarding from './components/Onboarding';

export type Page =
  | 'overview'
  | 'block-sites'
  | 'usage-limit'
  | 'insights'
  | 'focus-mode'
  | 'password'
  | 'custom-block-page'
  | 'settings'
  | 'about';

function AppInner() {
  const [currentPage, setCurrentPage] = useState<Page>('overview');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [animating, setAnimating] = useState(false);
  const { store } = useStore();

  // Apply theme
  useEffect(() => {
    if (store.settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [store.settings.theme]);

  // Show onboarding if not completed
  useEffect(() => {
    if (store.onboardingCompleted === false) {
      setShowOnboarding(true);
    }
  }, [store.onboardingCompleted]);

  const navigate = (page: Page) => {
    if (page === currentPage) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrentPage(page);
      setAnimating(false);
    }, 120);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'overview': return <Overview />;
      case 'block-sites': return <BlockSites />;
      case 'usage-limit': return <UsageLimit />;
      case 'insights': return <Insights />;
      case 'focus-mode': return <FocusMode />;
      case 'password': return <PasswordProtection />;
      case 'custom-block-page': return <CustomBlockPage />;
      case 'settings': return <Settings />;
      case 'about': return <About />;
      default: return <Overview />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {showOnboarding && <Onboarding onClose={() => setShowOnboarding(false)} />}
      <Sidebar currentPage={currentPage} onNavigate={navigate} />
      <main className="flex-1 overflow-y-auto flex flex-col">
        <div
          className="flex-1 transition-opacity duration-100"
          style={{ opacity: animating ? 0 : 1 }}
        >
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
