import { useState, useEffect, Suspense, lazy } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { LoginScreen } from './components/LoginScreen';

const ExplainerPreview = lazy(() =>
  import('./explainer/ExplainerPreview').then((m) => ({ default: m.ExplainerPreview })),
);

export function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'login' | 'explainer'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      if (view === 'explainer') {
        return 'explainer';
      }
      if (
        view === 'login' || 
        view === 'engines' || 
        view === 'connect-engines' || 
        view === 'gemini-key' || 
        view === 'upload-resume' ||
        view === 'resume' ||
        window.location.pathname === '/login'
      ) {
        return 'login';
      }
    }
    return 'home';
  });

  // Sync URL when screen changes
  const navigateTo = (screen: 'home' | 'login' | 'explainer') => {
    setCurrentScreen(screen);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (screen === 'login') {
        url.searchParams.set('view', 'login');
      } else if (screen === 'explainer') {
        url.searchParams.set('view', 'explainer');
      } else {
        url.searchParams.delete('view');
      }
      window.history.pushState({}, '', url.toString());
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      if (view === 'explainer') {
        setCurrentScreen('explainer');
      } else if (view === 'login') {
        setCurrentScreen('login');
      } else {
        setCurrentScreen('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (currentScreen === 'explainer') {
    return (
      <Suspense fallback={<div className="p-8 text-sm text-slate-500 font-sans">Loading explainer…</div>}>
        <ExplainerPreview />
      </Suspense>
    );
  }

  if (currentScreen === 'login') {
    return <LoginScreen onNavigateHome={() => navigateTo('home')} />;
  }

  return <HomeScreen onNavigateToLogin={() => navigateTo('login')} />;
}

export default App;
