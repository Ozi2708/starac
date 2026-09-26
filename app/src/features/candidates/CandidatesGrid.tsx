import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isDemoSeason, useCandidates, useSeason } from '@/lib/queries';
import { Badge, SegmentedControl, Skeleton } from '@/components/ui/core';
import { CandidateTile } from '@/components/ui/game';
import { EmptyState, ErrorState } from '@/components/ui/feedback';
import { Screen } from '@/app/MobileLayout';

type Filter = 'all' | 'in' | 'out';

export function CandidatesGrid() {
  const navigate = useNavigate();
  const season = useSeason();
  const cands = useCandidates(season.data?.id);
  const [filter, setFilter] = useState<Filter>('all');
  const list = (cands.data ?? []).filter((c) => filter === 'all' || (filter === 'out' ? c.status === 'eliminated' : c.status !== 'eliminated'));

  return (
    <Screen gap={20}>
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <span className="t-caption text-muted">Saison {season.data?.year ?? ''} · {cands.data?.length ?? 0} candidats</span>
          <h1 className="t-h1 m-0">Candidats</h1>
        </div>
        {isDemoSeason(season.data) && <Badge>Démo</Badge>}
      </div>
      <SegmentedControl<Filter> value={filter} onChange={setFilter} options={[{ value: 'all', label: 'Tous' }, { value: 'in', label: 'En lice' }, { value: 'out', label: 'Éliminés' }]} />
      {cands.isLoading ? (
        <div className="grid grid-cols-2 gap-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="aspect-[3/4]" h={0} style={{ height: 'auto' }} />)}</div>
      ) : cands.isError ? (
        <ErrorState onRetry={() => cands.refetch()} />
      ) : !cands.data?.length ? (
        <EmptyState icon="users" title="Les candidats ne sont pas encore connus" message="Ils apparaîtront ici dès leur révélation officielle." />
      ) : !list.length ? (
        <EmptyState icon="users" title={filter === 'out' ? 'Personne n’a encore quitté le château' : 'Aucun candidat'} />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {list.map((c) => <CandidateTile key={c.id} name={c.first_name} photo={c.photo_url} status={c.status} onClick={() => navigate(`/candidats/${c.id}`)} />)}
        </div>
      )}
      <p className="t-caption m-0 text-center text-muted">Photos officielles ajoutées depuis l’admin. Aucun candidat réel n’est inventé.</p>
    </Screen>
  );
}
