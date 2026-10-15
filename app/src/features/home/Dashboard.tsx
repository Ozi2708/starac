import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import {
  currentPrime, isDemoSeason, lastClosedPrime, useCandidates, useGame, useLeagueLeaderboard, useLeagueMemberCounts,
  useMyLeagueRanks, useMyLeagues, useNotifications, usePrimaryLeague, usePrimes,
} from '@/lib/queries';
import { answered, maxPoints, moveOf } from '@/lib/game';
import { fmtClose, fmtDayTime, fmtGain, fmtLong, fmtNum, plural } from '@/lib/format';
import type { Season } from '@/lib/types';
import { Avatar, Badge, Button, IconCircle, IconButton, LegalNote, PointsChip, ProgressBar, Section, Skeleton, Thumb } from '@/components/ui/core';
import { Icon } from '@/components/ui/Icon';
import { Countdown, LeaderboardRow } from '@/components/ui/game';
import { ErrorState } from '@/components/ui/feedback';
import { Screen } from '@/app/MobileLayout';
import { InviteCard } from '@/features/leagues/InviteCard';

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
  const leagues = useMyLeagues();
  const leagueIds = (leagues.data ?? []).map((l) => l.league_id);
  const counts = useLeagueMemberCounts(leagueIds);
  const ranks = useMyLeagueRanks(leagueIds);
  const notifs = useNotifications();

  const prime = currentPrime(primes.data);
  const lastPrime = lastClosedPrime(primes.data);
  const unread = (notifs.data ?? []).some((n) => !n.read_at);
  const live = prime && Date.now() >= new Date(prime.airs_at).getTime() && Date.now() < new Date(prime.airs_at).getTime() + 3.5 * 3600_000;

  // Pronos de la semaine (hebdo + pari improbable du prime en cours) : en tête d'accueil, impossible à rater
  const weekOpen = useMemo(
    () => (game.data?.questions ?? []).filter((q) => q.category !== 'grand' && q.prime_id === prime?.id && !q.locked)
      .sort((a, b) => Number(a.category === 'fun') - Number(b.category === 'fun') || a.sort_order - b.sort_order),
    [game.data, prime?.id],
  );
  const weekTodo = weekOpen.filter((q) => !answered(q));
  const weekClose = weekOpen.length ? weekOpen.reduce((m, q) => (q.closes_at < m ? q.closes_at : m), weekOpen[0].closes_at) : null;
  const weekPts = weekTodo.reduce((s, q) => s + maxPoints(q), 0);

  // Grands pronos encore ouverts : bannière d'accès directe en haut de l'accueil
  const grandOpen = (game.data?.questions ?? []).filter((q) => q.category === 'grand' && !q.locked);
  const grandDone = grandOpen.filter(answered).length;
  const grandNext = grandOpen.length ? grandOpen.reduce((m, q) => (new Date(q.closes_at) < new Date(m.closes_at) ? q : m)) : null;
  const grandSoon = grandNext ? grandOpen.filter((q) => q.closes_at === grandNext.closes_at) : [];
  // Un seul grand prono ferme à la prochaine échéance (ex. « Le premier éliminé ») : on le nomme
  const grandSingle = grandNext && (grandOpen.length === 1 || grandSoon.length === 1) ? grandNext : null;

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
        <button type="button" className="flex min-w-0 flex-1 flex-col border-0 bg-transparent p-0 text-left" onClick={() => navigate(primary ? `/classement?ligue=${primary.league_id}` : '/classement?ajouter=1')}>
          <span className="t-caption truncate text-muted">{primary?.leagues.name ?? 'Aucune ligue · rejoins tes amis'}</span>
          <span className="t-h3 truncate">Salut {profile?.pseudo}</span>
        </button>
        {isDemoSeason(season) && <Badge>Démo</Badge>}
        <IconButton icon="bell" label="Notifications" dot={unread} onClick={() => navigate('/notifications')} />
      </div>

      {weekOpen.length > 0 && prime && weekClose && (
        <div className="card-edge flex flex-col gap-3.5 p-4" style={weekTodo.length ? { boxShadow: 'var(--glow-flare)' } : undefined}>
          <div className="flex items-center justify-between gap-3">
            <span className="t-overline text-gold-200">CETTE SEMAINE · PRIME {prime.number}</span>
            {weekTodo.length > 0 ? <Badge tone="live">{weekTodo.length} à jouer</Badge> : <Badge tone="open" icon="check">Joués</Badge>}
          </div>
          <span className="t-h3 text-pretty">
            {weekTodo.length === 0 ? 'Tous tes pronos de la semaine sont joués' : weekTodo.length === weekOpen.length ? 'Les pronos du prime sont ouverts !' : `Encore ${plural(weekTodo.length, 'prono')} à jouer`}
          </span>
          <div className="card-plain row-sep flex flex-col">
            {weekOpen.map((q) => {
              const ok = answered(q);
              return (
                <button key={q.id} type="button" onClick={() => navigate(`/pronos/${q.id}`)} className="flex items-center gap-3 border-0 bg-transparent px-3.5 py-3 text-left">
                  <Icon name={ok ? 'circle-check' : q.icon || 'star'} size={18} style={{ color: ok ? 'var(--green-500)' : 'var(--flare-400)', flex: 'none' }} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="t-body-s font-bold">{q.title}</span>
                    <span className="t-caption text-muted">{ok ? 'Joué · modifiable' : q.category === 'fun' ? 'Pari improbable' : 'Pas encore joué'}</span>
                  </div>
                  <span className="whitespace-nowrap text-gold-400" style={{ font: 'italic 800 15px/1 var(--font-numeric)' }}>{maxPoints(q)} pts</span>
                  <Icon name="chevron-right" size={16} className="text-muted" />
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-2">
            <span className="t-overline text-gold-200">CLÔTURE DANS</span>
            <Countdown to={weekClose} onDone={() => game.refetch()} />
            <span className="t-caption text-pretty text-muted">{fmtLong(weekClose)} · tu peux encore jouer au début du prime.</span>
          </div>
          {weekTodo.length > 0 && (
            <Button size="lg" block iconRight="arrow-right" onClick={() => navigate(weekTodo.length === 1 ? `/pronos/${weekTodo[0].id}` : '/pronos?tab=semaine')}>
              {`Jouer mes pronos · ${fmtNum(weekPts)} pts en jeu`}
            </Button>
          )}
        </div>
      )}

      {grandOpen.length > 0 && (
        <button type="button" onClick={() => navigate('/pronos?tab=saison')} className="card-edge flex flex-col gap-3.5 p-4 text-left">
          <div className="flex items-center gap-3.5">
            <IconCircle icon="crown" tone="gold" />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="t-overline text-gold-200">GRANDS PRONOS DE LA SAISON</span>
              <span className="t-body font-bold">{grandDone === grandOpen.length ? 'Tous tes grands pronos sont joués' : grandDone === 0 ? 'Fais tes grands pronos !' : `Encore ${grandOpen.length - grandDone} grand${grandOpen.length - grandDone > 1 ? 's' : ''} prono${grandOpen.length - grandDone > 1 ? 's' : ''} à jouer`}</span>
              <span className="t-caption text-muted">{grandSingle ? `« ${grandSingle.title} » ferme ${fmtClose(grandSingle.closes_at)}` : `Vainqueur, finalistes, tournée… · ferme ${fmtClose(grandNext!.closes_at)}`}</span>
            </div>
            <Icon name="chevron-right" size={18} className="text-muted" />
          </div>
          <ProgressBar value={grandDone} max={grandOpen.length} tone="gold" label={`${grandDone} / ${grandOpen.length} joués`} />
          {grandDone < grandOpen.length && <span className="gp-btn gp-btn--primary gp-btn--md gp-btn--block pointer-events-none">Jouer mes grands pronos</span>}
        </button>
      )}

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

      {/* Pas encore de pronos pour le prime en cours */}
      {prime && weekOpen.length === 0 && !live && !game.isLoading && (
        game.isError ? <ErrorState onRetry={() => game.refetch()} /> : (
          <Section title="PRONOS DE LA SEMAINE">
            <div className="card-plain flex items-center gap-3.5 px-4 py-[18px]">
              <IconCircle icon="clock" tone="muted" />
              <div className="flex flex-col">
                <span className="t-body font-bold">Pas encore de pronos pour le prime {prime.number}</span>
                <span className="t-caption text-pretty text-muted">Ils arrivent avec les nominations et la battle du top 3. Tu seras prévenu.</span>
              </div>
            </div>
          </Section>
        )
      )}

      {/* Mes ligues : top 3 de la ligue principale, ou mon rang dans chacune si j'en ai plusieurs */}
      {primary && (leagues.data?.length ?? 0) > 1 ? (
        <Section title="MES LIGUES" aside={<a href="/classement" onClick={(e) => { e.preventDefault(); navigate('/classement'); }} className="t-body-s font-bold">Classements</a>}>
          <div className="card-plain row-sep flex flex-col">
            {[...(leagues.data ?? [])].sort((x, y) => Number(y.is_primary) - Number(x.is_primary)).map((l) => {
              const r = ranks.data?.[l.league_id];
              return (
                <button key={l.league_id} type="button" onClick={() => navigate(`/classement?ligue=${l.league_id}`)} className="flex items-center gap-3 border-0 bg-transparent px-4 py-3 text-left">
                  <Thumb name={l.leagues.name} src={l.leagues.image_url} size={38} radius={12} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="t-body truncate font-bold">{l.leagues.name}</span>
                    <span className="t-caption text-muted">{plural(counts.data?.[l.league_id] ?? 0, 'joueur')}{l.is_primary ? ' · principale' : ''}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span style={{ font: 'italic 900 22px/1 var(--font-numeric)' }}>{r ? `#${r.rank}` : '—'}</span>
                  </div>
                  <Icon name="chevron-right" size={16} className="text-muted" />
                </button>
              );
            })}
          </div>
        </Section>
      ) : primary && (
        <Section title="MA LIGUE" aside={<a href="/classement" onClick={(e) => { e.preventDefault(); navigate(`/classement?ligue=${primary.league_id}`); }} className="t-body-s font-bold">Classement complet</a>}>
          <div className="rounded-lg bg-card p-1.5" style={{ boxShadow: 'inset 0 0 0 1px var(--border-subtle), var(--shadow-card)' }}>
            {lb.isLoading ? <Skeleton h={180} /> : (lb.data ?? []).slice(0, 3).map((r) => (
              <LeaderboardRow key={r.user_id} rank={r.rank} name={r.pseudo} avatar={r.avatar_url} points={fmtNum(r.total)} move={moveOf(r)} me={r.user_id === userId} sub={plural(r.correct_answers, 'bon prono', 'bons pronos')} />
            ))}
          </div>
        </Section>
      )}

      <InviteCard />

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
