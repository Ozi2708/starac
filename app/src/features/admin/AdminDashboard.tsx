import { useNavigate } from 'react-router-dom';
import { currentPrime, usePrimes, useSeason } from '@/lib/queries';
import { fmtClose, fmtDayTime, fmtLong, fmtNum } from '@/lib/format';
import type { Question } from '@/lib/types';
import type { BadgeTone } from '@/components/ui/core';
import { Button, Overline, StatTile } from '@/components/ui/core';
import { AdminPage, Table, Tr } from './AdminApp';
import { useAdminLeagues, useAdminQuestions, useAppInstalls, usePredictionCount, useProfiles } from './data';

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
  const installs = useAppInstalls();
  const people = (profiles.data ?? []).filter((p) => p.id !== '00000000-0000-4000-8000-00000000c1a0'); // hors compte technique « Régie »
  const installed = new Map((installs.data ?? []).map((i) => [i.user_id, i]));

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
          <Button block variant="ghost" icon="download" onClick={() => navigate('/?installer=1')}>Voir le guide d’installation</Button>
          {pending.length > 0 && <span className="t-caption text-muted">{pending.length} question{pending.length > 1 ? 's' : ''} attend{pending.length > 1 ? 'ent' : ''} son résultat.</span>}

          <div className="mt-3 flex items-baseline justify-between">
            <Overline>APP INSTALLÉE</Overline>
            <span className="t-caption text-muted">{people.filter((p) => installed.has(p.id)).length} / {people.length} joueurs</span>
          </div>
          <Table cols="minmax(0,1fr) 140px" head={['JOUEUR', 'DERNIÈRE OUVERTURE']}>
            {[...people].sort((a, b) => Number(installed.has(b.id)) - Number(installed.has(a.id)) || a.pseudo.localeCompare(b.pseudo)).map((p) => {
              const i = installed.get(p.id);
              return (
                <Tr key={p.id} cols="minmax(0,1fr) 140px">
                  <span className={'truncate' + (i ? ' font-bold' : ' text-muted')}>{p.pseudo}{i?.platform ? ` · ${i.platform === 'ios' ? 'iPhone' : 'Android'}` : ''}</span>
                  <span className={i ? 'text-secondary' : 'text-muted'}>{i ? (i.last_open_at ? fmtClose(i.last_open_at) : 'installée') : 'pas encore'}</span>
                </Tr>
              );
            })}
          </Table>
        </div>
      </div>
    </AdminPage>
  );
}
