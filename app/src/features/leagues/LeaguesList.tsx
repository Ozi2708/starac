import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLeagueMemberCounts, useMyLeagues } from '@/lib/queries';
import { plural } from '@/lib/format';
import { Button, Skeleton, Thumb } from '@/components/ui/core';
import { Icon } from '@/components/ui/Icon';
import { EmptyState, ErrorState } from '@/components/ui/feedback';
import { Screen } from '@/app/MobileLayout';
import { LeagueDialogs, type LeagueDialog } from './LeagueDialogs';
import { useLeagueLeaderboard } from '@/lib/queries';
import { useAuth } from '@/lib/auth';

export function LeaguesList() {
  const navigate = useNavigate();
  const leagues = useMyLeagues();
  const counts = useLeagueMemberCounts((leagues.data ?? []).map((l) => l.league_id));
  const [dlg, setDlg] = useState<LeagueDialog>(null);

  return (
    <Screen gap={20}>
      <div className="flex flex-col gap-1">
        <span className="t-caption text-muted">Tes pronos comptent dans toutes tes ligues</span>
        <h1 className="t-h1 m-0">Mes ligues</h1>
      </div>
      {leagues.isLoading ? (
        <div className="flex flex-col gap-2.5"><Skeleton h={84} /><Skeleton h={84} /></div>
      ) : leagues.isError ? (
        <ErrorState onRetry={() => leagues.refetch()} />
      ) : !leagues.data?.length ? (
        <EmptyState icon="users" title="Aucune ligue pour l’instant" message="Crée la tienne ou rejoins celle de tes amis avec leur code." />
      ) : (
        <div className="flex flex-col gap-2.5">
          {leagues.data.map((m) => (
            <div key={m.league_id} role="button" tabIndex={0} onClick={() => navigate(`/ligues/${m.league_id}`)} onKeyDown={(e) => e.key === 'Enter' && navigate(`/ligues/${m.league_id}`)}
              className="gp-card gp-card--glass gp-card--interactive flex items-center gap-3.5 p-3.5">
              <Thumb name={m.leagues.name} src={m.leagues.image_url} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="t-body truncate font-bold">{m.leagues.name}</span>
                <LeagueSub leagueId={m.league_id} count={counts.data?.[m.league_id]} primary={m.is_primary} />
              </div>
              <Icon name="chevron-right" size={18} className="text-muted" />
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-2.5">
        <Button size="lg" block icon="plus" onClick={() => setDlg('create')}>Créer une ligue</Button>
        <Button size="lg" block variant="secondary" icon="key-round" onClick={() => setDlg('join')}>Rejoindre avec un code</Button>
      </div>
      <LeagueDialogs open={dlg} onClose={() => setDlg(null)} onDone={(id) => navigate(`/ligues/${id}`)} />
    </Screen>
  );
}

function LeagueSub({ leagueId, count, primary }: { leagueId: string; count?: number; primary: boolean }) {
  const { userId } = useAuth();
  const lb = useLeagueLeaderboard(leagueId);
  const me = lb.data?.find((r) => r.user_id === userId);
  return (
    <span className="t-caption text-muted">
      {count != null ? plural(count, 'joueur') : '…'}
      {me ? ` · tu es #${me.rank}` : ''}
      {primary ? ' · principale' : ''}
    </span>
  );
}
