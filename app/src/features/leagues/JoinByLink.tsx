import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { explainError } from '@/lib/errors';
import { Button } from '@/components/ui/core';
import { EmptyState, useToast } from '@/components/ui/feedback';
import { MobileShell, Screen } from '@/app/MobileLayout';
import { MobileFallback } from '@/app/App';
import { joinLeague } from './LeagueDialogs';

/** /rejoindre/:code : adhésion automatique (après inscription si besoin). */
export function JoinByLink() {
  const { code = '' } = useParams();
  const { userId, profile, loading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (loading || !userId || !profile || started.current) return;
    started.current = true;
    joinLeague(code)
      .then(async (id) => {
        await qc.invalidateQueries();
        toast({ tone: 'success', title: 'Bienvenue dans la ligue', message: 'Tes pronos comptent déjà ici, rien à refaire.' });
        navigate(`/ligues/${id}`, { replace: true });
      })
      .catch((e) => setError(explainError(e)));
  }, [loading, userId, profile, code, navigate, qc, toast]);

  if (loading) return <MobileFallback />;
  const next = `/rejoindre/${encodeURIComponent(code)}`;
  if (!userId) return <Navigate to={`/connexion?mode=inscription&next=${encodeURIComponent(next)}`} replace />;
  if (!profile) return <Navigate to={`/bienvenue?next=${encodeURIComponent(next)}`} replace />;

  return (
    <MobileShell nav={false}>
      <Screen top={80}>
        {error ? (
          <EmptyState icon="key-round" title={error.title} message={error.message} action={<Button size="sm" variant="secondary" onClick={() => navigate('/ligues')}>Mes ligues</Button>} />
        ) : (
          <EmptyState icon="users" title="On t’ajoute à la ligue…" />
        )}
      </Screen>
    </MobileShell>
  );
}
