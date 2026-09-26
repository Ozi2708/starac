import { useEffect, type ReactNode } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/ui/game';

const NAV = [
  { value: '/', label: 'Accueil', icon: 'house' },
  { value: '/candidats', label: 'Candidats', icon: 'users' },
  { value: '/pronos', label: 'Pronos', icon: 'star', center: true },
  { value: '/classement', label: 'Classement', icon: 'trophy' },
  { value: '/profil', label: 'Profil', icon: 'user' },
];

function navValue(path: string) {
  if (path.startsWith('/ligues')) return '/classement';
  return NAV.find((n) => n.value !== '/' && path.startsWith(n.value))?.value ?? (path === '/' ? '/' : '');
}

/** Colonne mobile (390–480px) centrée, fond violet avec halo, BottomNav fixe. */
export function MobileShell({ children, nav = true }: { children: ReactNode; nav?: boolean }) {
  const loc = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [loc.pathname]);
  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-app" style={{ background: 'radial-gradient(120% 40% at 50% 0%,rgba(106,60,240,.28),rgba(13,3,34,0) 70%), var(--surface-page)' }}>
      <div key={loc.pathname} className="page-enter" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {children}
      </div>
      {nav && (
        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-app" style={{ paddingBottom: 'env(safe-area-inset-bottom)', background: 'rgba(13,3,34,.82)' }}>
          <BottomNav items={NAV} value={navValue(loc.pathname)} onChange={(v) => navigate(v)} />
        </div>
      )}
    </div>
  );
}

export function MobileLayout({ nav = true }: { nav?: boolean }) {
  return (
    <MobileShell nav={nav}>
      <Outlet />
    </MobileShell>
  );
}

/** Contenu standard d'un écran : gouttière 20px, 120px en bas pour la nav. */
export function Screen({ children, gap = 22, bottom = 120, top = 16 }: { children: ReactNode; gap?: number; bottom?: number; top?: number }) {
  return (
    <main className="flex flex-col px-5" style={{ gap, paddingBottom: bottom, paddingTop: top }}>
      {children}
    </main>
  );
}
