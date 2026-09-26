import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import {
  currentPrime, isDemoSeason, lastClosedPrime, useCandidates, useGame, useLeagueLeaderboard, useLeagueMemberCounts,
  useNotifications, usePrimaryLeague, usePrimes,
} from '@/lib/queries';
import { answered, maxPoints, moveOf, pointsSuffix, pronoStatus } from '@/lib/game';
import { fmtClose, fmtDayTime, fmtGain, fmtNum, plural } from '@/lib/format';
import type { Season } from '@/lib/types';
import { Avatar, Badge, Button, IconCircle, IconButton, LegalNote, PointsChip, Section, Skeleton } from '@/components/ui/core';
import { Icon } from '@/components/ui/Icon';
import { Countdown, LeaderboardRow, PronoCard } from '@/components/ui/game';
import { ErrorState } from '@/components/ui/feedback';
import { Screen } from '@/app/MobileLayout';

/** Tableau de bord (variante 1a) : héros, mon classement, prochains pronos, ma ligue, derniers résultats. */
export function Dashboard({ season }: { season: Season }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { profile, userId } = useAuth();
  const primes = usePrimes(season.id);
  const game = useGame(season.id);
  const cands = useCandidates(season.id);
  const { primary, isLoading: leaguesLoading } = usePrimaryLeague();
  const lb = useLeagueLeaderboard(primary?.league_id);
  const counts = useLeagueMemberCounts(primary ? [primary.league_id] : []);
  const notifs = useNotifications();

  const prime = currentPrime(primes.data);
  const lastPrime = lastClosedPrime(primes.data);
  const unread = (notifs.data ?? []).some((n) => !n.read_at);
  const live = prime && Date.now() >= new Date(prime.airs_at).getTime() && Date.now() < new Date(prime.airs_at).getTime() + 3.5 * 3600_000;

  const todo = useMemo(() => {
    const qs = (game.data?.questions ?? []).filter((q) => !q.locked && !answered(q));
    // Pendant la phase « open », les grands pronos passent en premier.
    return qs.sort((a, b) => (season.phase === 'open' ? Number(b.category === 'grand') - Number(a.category === 'grand') : 0) || +new Date(a.closes_at) - +new Date(b.closes_at));
  }, [game.data, season.phase]);
  const openCount = (game.data?.questions ?? []).filter((q) => !q.locked).length;
  const nextClose = todo.length ? todo.reduce((m, q) => (q.closes_at < m ? q.closes_at : m), todo[0].closes_at) : null;
  const todoPts = todo.reduce((s, q) => s + maxPoints(q), 0);

  const me = lb.data?.find((r) => r.user_id === userId);
  const myTotal = me?.total ?? 0;
  const gainPrime = [...(primes.data ?? [])].reverse().find((p) => game.data?.transactions.some((t) => t.prime_id === p.id));
  const gain = gainPrime ? game.data!.transactions.filter((t) => t.prime_id === gainPrime.id).reduce((s, t) => s + t.points, 0) : null;

  // Derniers résultats officiels
  const resultPrime = lastPrime;
  const eliminated = (cands.data ?? []).filter((c) => c.status === 'eliminated').sort((a, b) => +new Date(b.eliminated_at ?? 0) - +new Date(a.eliminated_at ?? 0))[0];
  const nominated = (cands.data ?? []).filter((c) => prime && c.nominations.includes(prime.id));
  const lastQs = (game.data?.questions ?? []).filter((q) => resultPrime && q.prime_id === resultPrime.id && q.status === 'published');
  const lastGood = lastQs.filter((q) => (q.myPoints ?? 0) > 0).length;
  const lastAnswered = lastQs.filter(answered).length;
  const lastPts = lastQs.reduce((s, q) => s + (q.myPoints ?? 0), 0);

  return (
    <Screen gap={28} top={12}>
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <Avatar name={profile?.pseudo} src={profile?.avatar_url} size={44} ring="magenta" />
        <button type="button" className="flex min-w-0 flex-1 flex-col border-0 bg-transparent p-0 text-left" onClick={() => navigate(primary ? `/ligues/${primary.league_id}` : '/ligues')}>
          <span className="t-caption truncate text-muted">{primary?.leagues.name ?? 'Aucune ligue · rejoins tes amis'}</span>
          <span className="t-h3 truncate">Salut {profile?.pseudo}</span>
        </button>
        {isDemoSeason(season) && <Badge>Démo</Badge>}
        <IconButton icon="bell" label="Notifications" dot={unread} onClick={() => navigate('/notifications')} />
      </div>

      {season.phase === 'finished' && (
        <button type="button" onClick={() => navigate('/finale')} className="card-edge flex items-center gap-3.5 p-4 text-left">
          <IconCircle icon="crown" tone="gold" />
          <div className="flex flex-1 flex-col">
            <span className="t-overline text-gold-200">GRANDE FINALE</span>
            <span className="t-body font-bold">La saison est terminée. Découvre ton récap.</span>
          </div>
          <Icon name="chevron-right" size={18} className="text-muted" />
        </button>
      )}

      {/* Héros */}
      {prime && (
        <div className="card-stage">
          <div className="absolute inset-0" style={{ background: 'url(/key-art.jpg) 42% -12px / 470px auto no-repeat' }} aria-hidden="true" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(23,6,67,0) 30%,rgba(23,6,67,.94) 62%)' }} />
          <div className="relative flex flex-col gap-4 px-[18px] pb-[18px] pt-[22px]">
            <div className="h-[150px]" />
            <div className="flex flex-wrap gap-2">
              <Badge tone="gold">Semaine {prime.number}</Badge>
              {live ? <Badge tone="live">En direct</Badge> : <Badge>{`Prime ${prime.number} · ${fmtDayTime(prime.airs_at)}`}</Badge>}
            </div>
            {live ? (
              <div className="t-h2">Le prime {prime.number} est en cours</div>
            ) : (
              <>
                <div className="t-h2">{prime.is_final ? 'Grande finale dans' : 'Prochain prime dans'}</div>
                <Countdown to={prime.airs_at} onDone={() => qc.invalidateQueries()} />
              </>
            )}
          </div>
        </div>
      )}

      {/* Mon classement */}
      <Section title="MON CLASSEMENT">
        {leaguesLoading || (primary && lb.isLoading) ? (
          <Skeleton h={150} />
        ) : (
          <button type="button" onClick={() => navigate('/classement')} className="card-edge flex flex-col gap-[18px] p-[18px] text-left">
            <div className="flex items-center gap-3">
              <Avatar name={profile?.pseudo} src={profile?.avatar_url} size={48} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="t-body truncate font-bold">{profile?.pseudo}</span>
                <span className="t-caption text-muted">{primary ? `Ligue principale · ${plural(counts.data?.[primary.league_id] ?? lb.data?.length ?? 0, 'joueur')}` : 'Pas encore de ligue'}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="gp-gold-text t-num pr-1.5" style={{ font: 'italic 900 48px/1 var(--font-numeric)' }}>{fmtNum(myTotal)}</span>
                <span className="text-muted" style={{ font: '600 13px var(--font-body)' }}>pts</span>
              </div>
            </div>
            <div className="grid grid-cols-3 border-t border-subtle pt-3.5">
              <Stat value={me ? `#${me.rank}` : '—'} label="Rang ligue" />
              <Stat value={<MoveValue move={me ? moveOf(me) : 0} />} label="Cette semaine" border />
              <Stat value={gain != null ? fmtGain(gain) : '—'} label={gainPrime ? `Pts prime ${gainPrime.number}` : 'Pts ce prime'} border />
            </div>
          </button>
        )}
      </Section>

      {/* Mes prochains pronostics */}
      <Section title={season.phase === 'open' ? 'MES GRANDS PRONOS' : 'MES PROCHAINS PRONOSTICS'} aside={todo.length > 0 && <span className="t-caption text-muted">{todo.length} à faire</span>}>
        {game.isLoading ? (
          <><Skeleton h={68} /><Skeleton h={112} /><Skeleton h={112} /></>
        ) : game.isError ? (
          <ErrorState onRetry={() => game.refetch()} />
        ) : todo.length > 0 ? (
          <>
            <div className="flex items-center gap-3.5 rounded-md bg-card px-4 py-3.5 shadow-subtle">
              <Icon name="clock" size={18} className="text-flare-400" />
              <div className="flex flex-1 flex-col">
                <span className="t-body-s font-bold">Prochaine clôture</span>
                <span className="t-caption text-muted">Heure de Paris</span>
              </div>
              {nextClose && <Countdown to={nextClose} size="sm" showDays={false} onDone={() => game.refetch()} />}
            </div>
            {todo.slice(0, 2).map((q) => (
              <PronoCard key={q.id} question={q.title} points={q.points} pointsSuffix={pointsSuffix(q)} status={pronoStatus(q)} icon={q.icon} deadline={'Ferme ' + fmtClose(q.closes_at)} onClick={() => navigate(`/pronos/${q.id}`)} />
            ))}
            <Button size="lg" block iconRight="arrow-right" onClick={() => navigate(todo[0].category === 'grand' ? '/pronos?tab=saison' : todo[0].category === 'fun' && todo.every((q) => q.category === 'fun') ? '/pronos?tab=improbables' : '/pronos')}>
              {`Faire mes pronostics · ${fmtNum(todoPts)} pts en jeu`}
            </Button>
          </>
        ) : openCount > 0 ? (
          <div className="flex items-center gap-3.5 rounded-lg bg-card px-4 py-[18px]" style={{ boxShadow: 'inset 0 0 0 1px rgba(47,217,154,.35)' }}>
            <IconCircle icon="circle-check" tone="green" />
            <div className="flex flex-col">
              <span className="t-body font-bold">Tous tes pronos sont validés</span>
              <span className="t-caption text-muted">Modifiables jusqu’à leur clôture.{prime ? ` Rendez-vous ${fmtDayTime(prime.airs_at)}.` : ''}</span>
            </div>
          </div>
        ) : (
          <div className="card-plain flex items-center gap-3.5 px-4 py-[18px]">
            <IconCircle icon="clock" tone="muted" />
            <div className="flex flex-col">
              <span className="t-body font-bold">Pas de pronos ouverts pour l’instant</span>
              <span className="t-caption text-pretty text-muted">{prime ? `Les questions du prime ${prime.number} arrivent après les nominations.` : 'Les prochaines questions arrivent bientôt.'}</span>
            </div>
          </div>
        )}
      </Section>

      {/* Ma ligue */}
      {primary && (
        <Section title="MA LIGUE" aside={<a href="/classement" onClick={(e) => { e.preventDefault(); navigate(`/ligues/${primary.league_id}`); }} className="t-body-s font-bold">Classement complet</a>}>
          <div className="rounded-lg bg-card p-1.5" style={{ boxShadow: 'inset 0 0 0 1px var(--border-subtle), var(--shadow-card)' }}>
            {lb.isLoading ? <Skeleton h={180} /> : (lb.data ?? []).slice(0, 3).map((r) => (
              <LeaderboardRow key={r.user_id} rank={r.rank} name={r.pseudo} avatar={r.avatar_url} points={fmtNum(r.total)} move={moveOf(r)} me={r.user_id === userId} sub={plural(r.correct_answers, 'bon prono', 'bons pronos')} />
            ))}
          </div>
        </Section>
      )}

      {/* Derniers résultats */}
      {resultPrime && (eliminated || lastQs.length > 0) && (
        <Section title={`DERNIERS RÉSULTATS · PRIME ${resultPrime.number}`}>
          <div className="card-plain row-sep flex flex-col">
            {eliminated && (
              <div className="flex items-center gap-3 px-4 py-3.5">
                <Avatar name={eliminated.first_name} src={eliminated.photo_url} size={40} style={{ filter: 'grayscale(1)', opacity: 0.5 }} />
                <div className="flex flex-1 flex-col">
                  <span className="t-caption text-muted">Dernier éliminé</span>
                  <span className="t-body font-bold">{eliminated.first_name}</span>
                </div>
                <Badge tone="closed">Éliminé·e</Badge>
              </div>
            )}
            {nominated.length > 0 && (
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="flex">
                  {nominated.slice(0, 4).map((c, i) => (
                    <Avatar key={c.id} name={c.first_name} src={c.photo_url} size={32} style={i ? { marginLeft: -10, boxShadow: '0 0 0 2px var(--surface-page)' } : undefined} />
                  ))}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="t-caption text-muted">Nommés de la semaine</span>
                  <span className="t-body truncate font-bold">{nominated.map((c) => c.first_name).join(', ')}</span>
                </div>
              </div>
            )}
            {lastQs.length > 0 && (
              <div className="flex items-center gap-3 px-4 py-3.5">
                <IconCircle icon="star" tone="gold" />
                <div className="flex flex-1 flex-col">
                  <span className="t-caption text-muted">Tes points au prime {resultPrime.number}</span>
                  <span className="t-body font-bold">{lastAnswered ? `${lastGood} bon${lastGood > 1 ? 's' : ''} prono${lastGood > 1 ? 's' : ''} sur ${lastAnswered}` : 'Aucun prono joué'}</span>
                </div>
                <PointsChip value={lastPts} />
              </div>
            )}
          </div>
        </Section>
      )}
      <LegalNote />
    </Screen>
  );
}

function Stat({ value, label, border }: { value: React.ReactNode; label: string; border?: boolean }) {
  return (
    <div className={'flex flex-col gap-0.5' + (border ? ' border-l border-subtle pl-3.5' : '')}>
      <span style={{ font: 'italic 800 22px/1 var(--font-numeric)' }}>{value}</span>
      <span className="t-caption text-muted">{label}</span>
    </div>
  );
}

export function MoveValue({ move }: { move: number }) {
  if (!move) return <span className="inline-flex items-center gap-0.5 text-muted"><Icon name="minus" size={18} />0</span>;
  return (
    <span className="inline-flex items-center gap-0.5" style={{ color: move > 0 ? 'var(--green-500)' : 'var(--red-500)' }}>
      <Icon name={move > 0 ? 'chevron-up' : 'chevron-down'} size={18} />
      {Math.abs(move)}
    </span>
  );
}
