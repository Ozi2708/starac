import { useNavigate } from 'react-router-dom';
import { currentPrime, usePrimes, useSeason } from '@/lib/queries';
import { fmtDayTime, fmtLong, fmtNum } from '@/lib/format';
import type { Question } from '@/lib/types';
import type { BadgeTone } from '@/components/ui/core';
import { Button, Overline, StatTile } from '@/components/ui/core';
import { AdminPage, Table, Tr } from './AdminApp';
import { useAdminLeagues, useAdminQuestions, usePredictionCount, useProfiles } from './data';

export function effectiveStatus(q: Pick<Question, 'status' | 'closes_at'>): Question['status'] {
  return q.status === 'open' && new Date(q.closes_at).getTime() <= Date.now() ? 'closed' : q.status;
}
export const Q_STATUS: Record<Question['status'], [string, BadgeTone]> = {
  draft: ['Brouillon', 'neutral'], open: ['Ouvert', 'open'], closed: ['Clôturé', 'magenta'], published: ['Résultat publié', 'gold'], cancelled: ['Annulé', 'closed'],
};

export function AdminDashboard() {
  const navigate = useNavigate();
  const season = useSeason();
  const sid = season.data?.id;
  const primes = usePrimes(sid);
  const qs = useAdminQuestions(sid);
  const profiles = useProfiles();
  const leagues = useAdminLeagues(sid);
  const preds = usePredictionCount(sid);
  const prime = currentPrime(primes.data);
  const list = qs.data ?? [];
  const open = list.filter((q) => effectiveStatus(q) === 'open');
  const pending = list.filter((q) => effectiveStatus(q) === 'closed');
  const players = (profiles.data ?? []).filter((p) => p.role === 'player').length;

  return (
    <AdminPage title="Tableau de bord" sub={season.data ? `${season.data.name}${prime ? ` · semaine ${prime.number} · prime ${fmtLong(prime.airs_at).toLowerCase()} (heure de Paris)` : ''}` : ''}>
      <div className="grid grid-cols-3 gap-3.5">
        <StatTile value={fmtNum(players)} label="Joueurs inscrits" />
        <StatTile value={fmtNum(leagues.data?.length ?? 0)} label="Ligues" />
        <StatTile value={fmtNum(preds.data ?? 0)} label="Pronostics enregistrés" />
        <StatTile value={open.length} label="Questions ouvertes" />
        <StatTile value={pending.length} label="En attente de résultats" accent={pending.length ? 'var(--flare-400)' : undefined} />
        <StatTile value={prime ? fmtDayTime(prime.airs_at) : '—'} label={prime ? `Prime ${prime.number}` : 'Prochain prime'} />
      </div>
      <div className="grid items-start gap-6" style={{ gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)' }}>
        <div className="flex flex-col gap-2.5">
          <Overline>PROCHAINES CLÔTURES</Overline>
          <Table cols="minmax(0,1fr) 120px 90px" head={['QUESTION', 'CLÔTURE', 'RÉPONSES']}>
            {open.length === 0 && <Tr cols="1fr"><span className="text-muted">Aucune question ouverte.</span></Tr>}
            {open.slice(0, 8).map((q) => (
              <Tr key={q.id} cols="minmax(0,1fr) 120px 90px" onClick={() => navigate('/admin/questions')}>
                <span className="truncate font-bold">{q.title}</span>
                <span className="text-secondary">{fmtDayTime(q.closes_at)}</span>
                <span className="text-right text-muted">{q.answers} / {players}</span>
              </Tr>
            ))}
          </Table>
        </div>
        <div className="flex flex-col gap-2.5">
          <Overline>ACTIONS RAPIDES</Overline>
          <Button block icon="flag" onClick={() => navigate('/admin/resultats')}>{prime ? `Saisir les résultats du prime ${prime.number}` : 'Saisir les résultats'}</Button>
          <Button block variant="secondary" icon="users" onClick={() => navigate('/admin/candidats')}>Enregistrer une nomination</Button>
          <Button block variant="secondary" icon="plus" onClick={() => navigate('/admin/questions?nouvelle=1')}>Créer une question</Button>
          {pending.length > 0 && <span className="t-caption text-muted">{pending.length} question{pending.length > 1 ? 's' : ''} attend{pending.length > 1 ? 'ent' : ''} son résultat.</span>}
        </div>
      </div>
    </AdminPage>
  );
}
