import { useState, useEffect } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { LoginScreen } from './components/LoginScreen';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'login'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      if (
        view === 'login' || 
        view === 'engines' || 
        view === 'connect-engines' || 
        view === 'gemini-key' || 
        window.location.pathname === '/login'
      ) {
        return 'login';
      }
    }
    return 'home';
  });

  // Sync URL when screen changes
  const navigateTo = (screen: 'home' | 'login') => {
    setCurrentScreen(screen);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (screen === 'login') {
        url.searchParams.set('view', 'login');
      } else {
        url.searchParams.delete('view');
      }
      window.history.pushState({}, '', url.toString());
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setCurrentScreen(params.get('view') === 'login' ? 'login' : 'home');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (currentScreen === 'login') {
    return <LoginScreen onNavigateHome={() => navigateTo('home')} />;
  }

  return <HomeScreen onNavigateToLogin={() => navigateTo('login')} />;
}

export default App;
