import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabaseConfigured } from '@/lib/supabase';
import { ToastProvider } from '@/components/ui/feedback';
import { Skeleton } from '@/components/ui/core';
import { MobileLayout } from './MobileLayout';
import { HomeRoute } from '@/features/home/HomeRoute';
import { SignIn } from '@/features/auth/SignIn';
import { Onboarding } from '@/features/auth/Onboarding';
import { JoinByLink } from '@/features/leagues/JoinByLink';
import { PronosHub } from '@/features/predictions/PronosHub';
import { PickScreen } from '@/features/predictions/PickScreen';
import { CandidatesGrid } from '@/features/candidates/CandidatesGrid';
import { CandidateDetail } from '@/features/candidates/CandidateDetail';
import { Leaderboard } from '@/features/leaderboard/Leaderboard';
import { LeaguesList } from '@/features/leagues/LeaguesList';
import { LeaguePage } from '@/features/leagues/LeaguePage';
import { Profile } from '@/features/profile/Profile';
import { Notifications } from '@/features/notifications/Notifications';
import { Finale } from '@/features/finale/Finale';
import { NotConfigured } from './NotConfigured';

const AdminApp = lazy(() => import('@/features/admin/AdminApp'));

export function MobileFallback() {
  return (
    <div className="mx-auto flex max-w-app flex-col gap-4 px-5 pt-16">
      <Skeleton h={44} />
      <Skeleton h={300} />
      <Skeleton h={140} />
    </div>
  );
}

/** Connexion + profil (pseudo) obligatoires. */
export function RequirePlayer({ children }: { children: ReactNode }) {
  const { userId, profile, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <MobileFallback />;
  if (!userId) return <Navigate to={`/connexion?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  if (!profile) return <Navigate to={`/bienvenue?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin, loading, userId } = useAuth();
  if (loading) return <MobileFallback />;
  if (!userId) return <Navigate to="/connexion?next=/admin" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function App() {
  if (!supabaseConfigured) return <NotConfigured />;
  return (
    <Routes>
      <Route
        path="/admin/*"
        element={
          <RequireAdmin>
            <ToastProvider position="bottom-right">
              <Suspense fallback={null}>
                <AdminApp />
              </Suspense>
            </ToastProvider>
          </RequireAdmin>
        }
      />
      <Route
        path="*"
        element={
          <ToastProvider>
            <Routes>
              <Route path="/connexion" element={<SignIn />} />
              <Route path="/bienvenue" element={<Onboarding />} />
              <Route path="/rejoindre/:code" element={<JoinByLink />} />
              <Route path="/" element={<HomeRoute />} />
              <Route element={<RequirePlayer><MobileLayout /></RequirePlayer>}>
                <Route path="/pronos" element={<PronosHub />} />
                <Route path="/candidats" element={<CandidatesGrid />} />
                <Route path="/classement" element={<Leaderboard />} />
                <Route path="/ligues" element={<LeaguesList />} />
                <Route path="/profil" element={<Profile />} />
              </Route>
              <Route element={<RequirePlayer><MobileLayout nav={false} /></RequirePlayer>}>
                <Route path="/pronos/:id" element={<PickScreen />} />
                <Route path="/candidats/:id" element={<CandidateDetail />} />
                <Route path="/ligues/:id" element={<LeaguePage />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/finale" element={<Finale />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        }
      />
    </Routes>
  );
}
