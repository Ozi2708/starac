import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/auth';
import { App } from '@/app/App';
import '@/styles/index.css';
import { registerSW } from 'virtual:pwa-register';
// Capte au plus tôt la proposition d'installation de Chrome (guide « Installer l'app »)
import '@/features/install/install';

// Mises à jour de l'app : la nouvelle version est récupérée dès sa publication puis l'app se recharge
// d'elle-même (mode autoUpdate). On revérifie toutes les 15 min et à chaque retour au premier plan.
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return;
    setInterval(() => reg.update().catch(() => undefined), 15 * 60_000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') reg.update().catch(() => undefined);
    });
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 20_000, retry: 1, refetchOnWindowFocus: true },
    // Jamais de mise à jour optimiste : un prono n'est affiché comme enregistré qu'après la réponse du serveur.
    mutations: { retry: 0 },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
