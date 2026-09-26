import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import {
  lastClosedPrime, useGeneralLeaderboard, useLeagueLeaderboard, useMyLeagues, usePrimaryLeague, usePrimeScores, usePrimes, useSeason, useSnapshots,
} from '@/lib/queries';
import { competitionRanks, moveOf } from '@/lib/game';
import { fmtNum, plural } from '@/lib/format';
import type { LeaderRow, Prime, RankSnapshot } from '@/lib/types';
import { Avatar, Button, IconCircle, Overline, PointsChip, SegmentedControl, Skeleton } from '@/components/ui/core';
import { LeaderboardRow } from '@/components/ui/game';
import { EmptyState, ErrorState } from '@/components/ui/feedback';
import { Screen } from '@/app/MobileLayout';

type View = 'general' | 'semaine' | 'evolution';

export function Leaderboard() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const view = (params.get('vue') as View) || 'general';
  const { primary } = usePrimaryLeague();
  const leagues = useMyLeagues();
  const scope = params.get('ligue') ?? primary?.league_id ?? 'all';
  const season = useSeason();
  const primes = usePrimes(season.data?.id);
  const general = useGeneralLeaderboard(scope === 'all' ? season.data?.id : undefined);
  const league = useLeagueLeaderboard(scope !== 'all' ? scope : null);
  const snaps = useSnapshots(season.data?.id, scope === 'all' ? null : scope);
  const primeScores = usePrimeScores(season.data?.id);
  const src = scope === 'all' ? general : league;
  const rows = src.data ?? [];
  const leagueName = scope === 'all' ? `Saison ${season.data?.year ?? ''} · tous les joueurs` : leagues.data?.find((l) => l.league_id === scope)?.leagues.name;

  const set = (k: string, v: string) => {
    const p = new URLSearchParams(params);
    p.set(k, v);
    setParams(p, { replace: true });
  };

  return (
    <Screen gap={22}>
      <div className="flex items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="t-caption truncate text-muted">{leagueName}{rows.length ? ` · ${plural(rows.length, 'joueur')}` : ''}</span>
          <h1 className="t-h1 m-0">Classement</h1>
        </div>
        <Button variant="secondary" size="sm" icon="users" onClick={() => navigate('/ligues')}>Mes ligues</Button>
      </div>
      {(leagues.data?.length ?? 0) > 0 && (
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          {[{ id: 'all', name: 'Tous les joueurs' }, ...(leagues.data ?? []).map((l) => ({ id: l.league_id, name: l.leagues.name }))].map((l) => (
            <button key={l.id} type="button" onClick={() => set('ligue', l.id)}
              className={'gp-seg__opt flex-none rounded-full' + (scope === l.id ? ' gp-seg__opt--on' : '')}
              style={scope === l.id ? { height: 34 } : { height: 34, background: 'rgba(255,255,255,.06)', boxShadow: 'inset 0 0 0 1px var(--border-subtle)' }}>
              {l.name}
            </button>
          ))}
        </div>
      )}
      <SegmentedControl<View> value={view} onChange={(v) => set('vue', v)} options={[{ value: 'general', label: 'Général' }, { value: 'semaine', label: 'Semaine' }, { value: 'evolution', label: 'Évolution' }]} />
      {src.isLoading ? (
        <div className="flex flex-col gap-2.5"><Skeleton h={96} /><Skeleton h={120} /><Skeleton h={60} /><Skeleton h={60} /></div>
      ) : src.isError ? (
        <ErrorState onRetry={() => src.refetch()} />
      ) : !rows.length ? (
        <EmptyState icon="trophy" title="Personne au classement pour l’instant" message="Le classement se remplit dès les premiers pronos." />
      ) : view === 'general' ? (
        <General rows={rows} />
      ) : view === 'semaine' ? (
        <Weekly rows={rows} primes={primes.data ?? []} scores={primeScores.data ?? []} snaps={snaps.data ?? []} />
      ) : (
        <Evolution rows={rows} primes={primes.data ?? []} snaps={snaps.data ?? []} />
      )}
    </Screen>
  );
}

function General({ rows }: { rows: LeaderRow[] }) {
  const { userId } = useAuth();
  const [first, ...others] = rows;
  const meRef = useRef<HTMLDivElement>(null);
  const [meVisible, setMeVisible] = useState(true);
  const me = rows.find((r) => r.user_id === userId);
  useEffect(() => {
    const el = meRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setMeVisible(e.isIntersecting), { rootMargin: '0px 0px -90px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [rows]);
  const sub = (r: LeaderRow) => plural(r.correct_answers, 'bon prono', 'bons pronos');

  return (
    <div className="flex flex-col gap-2.5">
      <div ref={first.user_id === userId ? meRef : undefined} className="relative flex items-center gap-4 rounded-lg bg-raised px-[18px] py-5"
        style={{ boxShadow: 'inset 0 0 0 1px rgba(255,203,92,.45), 0 0 32px -12px rgba(255,203,92,.45), var(--shadow-card)' }}>
        <span className="gp-gold-text w-[34px] pr-1" style={{ font: 'italic 900 44px/1 var(--font-numeric)' }}>{first.rank}</span>
        <Avatar name={first.pseudo} src={first.avatar_url} size={56} ring="gold" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Overline className="text-gold-200">EN TÊTE</Overline>
          <span className="t-h3 truncate">{first.pseudo}{first.user_id === userId ? ' (toi)' : ''}</span>
          <span className="t-caption text-muted">{sub(first)}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="gp-gold-text t-num pr-1" style={{ font: 'italic 900 30px/1 var(--font-numeric)' }}>{fmtNum(first.total)}</span>
          <span className="t-caption text-muted">pts</span>
        </div>
      </div>
      {others.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5">
          {others.slice(0, 2).map((p) => (
            <div key={p.user_id} ref={p.user_id === userId ? meRef : undefined} className="card-plain flex flex-col gap-3 p-4" style={p.user_id === userId ? { boxShadow: 'inset 0 0 0 1px rgba(255,166,74,.45)' } : undefined}>
              <div className="flex items-center justify-between">
                <span className="text-secondary" style={{ font: 'italic 900 26px/1 var(--font-numeric)' }}>{p.rank}</span>
                <Avatar name={p.pseudo} src={p.avatar_url} size={40} ring={p.user_id === userId ? 'magenta' : null} />
              </div>
              <div className="flex flex-col">
                <span className="t-body truncate font-bold">{p.pseudo}{p.user_id === userId ? ' (toi)' : ''}</span>
                <span style={{ font: 'italic 800 18px/1.2 var(--font-numeric)' }}>{fmtNum(p.total)} <span className="text-muted" style={{ font: '600 11px var(--font-body)' }}>pts</span></span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col pt-1.5">
        {others.slice(2).map((p) => (
          <div key={p.user_id} ref={p.user_id === userId ? meRef : undefined}>
            <LeaderboardRow rank={p.rank} name={p.pseudo} avatar={p.avatar_url} points={fmtNum(p.total)} move={moveOf(p)} me={p.user_id === userId} sub={sub(p)} />
          </div>
        ))}
      </div>
      <p className="t-caption m-0 text-muted">Flèches : évolution depuis le prime précédent. À égalité de points, les joueurs partagent le même rang.</p>
      {me && !meVisible && me.rank > 3 && (
        <div className="fixed inset-x-0 z-30 mx-auto max-w-app px-5" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 84px)' }}>
          <div className="rounded-md" style={{ background: 'rgba(26,8,80,.96)', backdropFilter: 'blur(18px)', boxShadow: 'var(--shadow-pop)' }}>
            <LeaderboardRow rank={me.rank} name={me.pseudo} avatar={me.avatar_url} points={fmtNum(me.total)} move={moveOf(me)} me sub={sub(me)} />
          </div>
        </div>
      )}
    </div>
  );
}

/** Points du dernier prime avec des points attribués + meilleure progression (snapshots). */
function Weekly({ rows, primes, scores, snaps }: { rows: LeaderRow[]; primes: Prime[]; scores: { user_id: string; prime_id: string; points: number; correct_answers: number }[]; snaps: RankSnapshot[] }) {
  const { userId } = useAuth();
  const withPoints = primes.filter((p) => scores.some((s) => s.prime_id === p.id));
  const prime = withPoints[withPoints.length - 1] ?? lastClosedPrime(primes);
  const members = new Set(rows.map((r) => r.user_id));
  const weekly = useMemo(() => competitionRanks(rows.map((r) => {
    const s = scores.find((x) => x.prime_id === prime?.id && x.user_id === r.user_id);
    return { ...r, week: s?.points ?? 0, good: s?.correct_answers ?? 0 };
  }), (x) => x.week), [rows, scores, prime]);

  // Meilleure progression entre les deux derniers snapshots
  const snapPrimes = primes.filter((p) => snaps.some((s) => s.prime_id === p.id));
  const [a, b] = snapPrimes.slice(-2);
  let best: { name: string; gain: number; pts: number } | null = null;
  if (a && b) {
    for (const s of snaps.filter((x) => x.prime_id === b.id && members.has(x.user_id))) {
      const prev = snaps.find((x) => x.prime_id === a.id && x.user_id === s.user_id);
      const gain = prev ? prev.rank - s.rank : 0;
      if (gain > 0 && (!best || gain > best.gain)) best = { name: rows.find((r) => r.user_id === s.user_id)?.pseudo ?? '', gain, pts: s.total - (prev?.total ?? 0) };
    }
  }

  if (!prime) return <EmptyState icon="calendar" title="Pas encore de résultats cette saison" message="Le classement de la semaine apparaît après le premier prime." />;
  return (
    <>
      {best && (
        <div className="card-edge flex items-center gap-3.5 p-4">
          <IconCircle icon="trending-up" tone="green" size={44} />
          <div className="flex flex-1 flex-col">
            <Overline>MEILLEURE PROGRESSION</Overline>
            <span className="t-body font-bold">{best.name} gagne {best.gain} place{best.gain > 1 ? 's' : ''}</span>
          </div>
          <PointsChip value={best.pts} />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <Overline className="px-1 pb-1.5">POINTS GAGNÉS AU PRIME {prime.number}</Overline>
        {weekly.map((p) => (
          <LeaderboardRow key={p.user_id} rank={p.rank} name={p.pseudo} avatar={p.avatar_url} points={fmtNum(p.week)} move={moveOf(p)} me={p.user_id === userId}
            sub={best && p.pseudo === best.name ? 'Meilleure progression' : plural(p.good, 'bon prono', 'bons pronos')} />
        ))}
      </div>
    </>
  );
}

const COLORS = ['#e679f2', '#b7a0ff', '#ffe8b3'];

/** Graphique d'évolution du rang (rank_snapshots) : ma courbe + 3 amis max. */
function Evolution({ rows, primes, snaps }: { rows: LeaderRow[]; primes: Prime[]; snaps: RankSnapshot[] }) {
  const { userId } = useAuth();
  const others = rows.filter((r) => r.user_id !== userId);
  const [compare, setCompare] = useState<string[]>(() => others.slice(0, 2).map((r) => r.user_id));
  const cols = primes.filter((p) => snaps.some((s) => s.prime_id === p.id));
  if (cols.length < 1) return <EmptyState icon="chart-line" title="Pas encore d’historique" message="La courbe démarre après la clôture du premier prime." />;

  const maxRank = Math.max(2, ...snaps.map((s) => s.rank));
  const W = 322, H = 220, X0 = 40, X1 = 306, Y0 = 12, Y1 = 188;
  const xAt = (i: number) => (cols.length === 1 ? (X0 + X1) / 2 : X0 + (i * (X1 - X0)) / (cols.length - 1));
  const yAt = (r: number) => Y0 + ((r - 1) * (Y1 - Y0)) / (maxRank - 1);
  const yTicks = maxRank <= 10 ? Array.from({ length: maxRank }, (_, i) => i + 1) : [1, ...[0.25, 0.5, 0.75].map((f) => Math.round(1 + f * (maxRank - 1))), maxRank];
  const xStep = Math.ceil(cols.length / 8);

  const series = [userId!, ...compare].map((uid, i) => {
    const pts = cols.map((p, j) => [j, snaps.find((s) => s.prime_id === p.id && s.user_id === uid)?.rank] as const).filter(([, r]) => r != null) as [number, number][];
    return { uid, color: i === 0 ? '#ffa64a' : COLORS[i - 1], w: i === 0 ? 3.5 : 2, pts };
  }).filter((s) => s.pts.length).reverse();

  const toggle = (id: string) => setCompare((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= 3 ? [...cur.slice(1), id] : [...cur, id]));

  return (
    <>
      <div className="card-plain flex flex-col gap-3.5 px-3.5 pb-3 pt-4">
        <div className="flex items-baseline justify-between px-1">
          <Overline>ÉVOLUTION DU RANG</Overline>
          <span className="t-caption text-muted">Primes {cols[0].number} à {cols[cols.length - 1].number}</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H + 4}`} width="100%" role="img" aria-label="Évolution du rang prime après prime" style={{ overflow: 'visible' }}>
          {yTicks.map((r) => (
            <g key={r}>
              <line x1={30} x2={312} y1={yAt(r)} y2={yAt(r)} stroke="rgba(255,255,255,.07)" />
              <text x={0} y={yAt(r) + 4} fill="#9486bf" style={{ font: 'italic 700 11px Kanit' }}>#{r}</text>
            </g>
          ))}
          {cols.map((p, i) => (i % xStep === 0 || i === cols.length - 1) && (
            <text key={p.id} x={xAt(i)} y={216} fill="#9486bf" textAnchor="middle" style={{ font: '600 11px "Plus Jakarta Sans"' }}>P{p.number}</text>
          ))}
          {series.map((s) => {
            const d = s.pts.map(([j, r], k) => `${k ? 'L' : 'M'}${xAt(j).toFixed(1)} ${yAt(r).toFixed(1)}`).join(' ');
            const [lj, lr] = s.pts[s.pts.length - 1];
            return (
              <g key={s.uid}>
                <path d={d} fill="none" stroke={s.color} strokeWidth={s.w} strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={xAt(lj)} cy={yAt(lr)} r={5} fill={s.color} stroke="#0d0322" strokeWidth={2} />
              </g>
            );
          })}
        </svg>
      </div>
      <div className="flex flex-col gap-2.5">
        <Overline>COMPARER AVEC (3 MAX)</Overline>
        <div className="flex flex-wrap gap-2">
          {others.map((p) => {
            const idx = compare.indexOf(p.user_id);
            const on = idx >= 0;
            return (
              <button key={p.user_id} type="button" onClick={() => toggle(p.user_id)} aria-pressed={on}
                className={'gp-seg__opt inline-flex flex-none items-center gap-2 rounded-full' + (on ? ' gp-seg__opt--on' : '')} style={{ height: 36, padding: '0 14px' }}>
                <span className="h-2 w-2 rounded-full" style={{ background: on ? COLORS[idx] : 'rgba(255,255,255,.3)' }} />
                {p.pseudo}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
