import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useSeason } from '@/lib/queries';
import { MobileFallback } from '@/app/App';
import { MobileShell } from '@/app/MobileLayout';
import { Landing } from './Landing';
import { Dashboard } from './Dashboard';

/** `/` : avant-saison si phase = pre (ou visiteur), sinon tableau de bord. Bascule automatique via v_seasons.phase. */
export function HomeRoute() {
  const { userId, profile, loading } = useAuth();
  const season = useSeason();
  if (loading || season.isLoading) return <MobileFallback />;
  if (!userId) return <MobileShell nav={false}><Landing season={season.data ?? null} /></MobileShell>;
  if (!profile) return <Navigate to="/bienvenue" replace />;
  if (!season.data || season.data.phase === 'pre') return <MobileShell><Landing season={season.data ?? null} signedIn /></MobileShell>;
  return <MobileShell><Dashboard season={season.data} /></MobileShell>;
}
