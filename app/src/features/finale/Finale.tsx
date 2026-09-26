import { forwardRef, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import {
  useBadges, useCandidates, useGame, useLeagueLeaderboard, useLeagueMemberCounts, useMyLeagues, usePrimaryLeague, usePrimeScores, usePrimes, useSeason, useSnapshots, useUserBadges,
} from '@/lib/queries';
import { fmtGain, fmtLong, fmtNum, fmtPct, ordinal } from '@/lib/format';
import type { Badge as BadgeT, LeagueMembership } from '@/lib/types';
import { Avatar, Badge, Button, IconButton, Overline, Skeleton, StatTile, Thumb } from '@/components/ui/core';
import { KeyArtHero } from '@/components/ui/game';
import { EmptyState, useToast } from '@/components/ui/feedback';
import { shareNode } from '@/lib/share';

interface Recap {
  pseudo: string; avatar: string | null; rank: number | null; of: number; league: string; total: number; rate: number | null;
  bestProno: { pts: number; title: string } | null; bestPrime: { pts: number; n: number } | null; ranks: number[]; badges: BadgeT[]; year: number;
}

/** Cérémonie de fin de saison : vainqueur, récap personnel exportable (1080×1920), champions des ligues. */
export function Finale() {
  const navigate = useNavigate();
  const toast = useToast();
  const { profile, userId } = useAuth();
  const season = useSeason();
  const sid = season.data?.id;
  const cands = useCandidates(sid);
  const primes = usePrimes(sid);
  const game = useGame(sid);
  const scores = usePrimeScores(sid);
  const leagues = useMyLeagues();
  const { primary } = usePrimaryLeague();
  const lb = useLeagueLeaderboard(primary?.league_id);
  const counts = useLeagueMemberCounts(primary ? [primary.league_id] : []);
  const snaps = useSnapshots(sid, primary?.league_id ?? null);
  const badges = useBadges();
  const mine = useUserBadges(sid, userId ? [userId] : []);
  const stats = useQuery({
    queryKey: ['my-score', sid, userId],
    enabled: !!sid && !!userId,
    queryFn: async () => (await supabase.from('v_season_scores').select('*').eq('season_id', sid!).eq('user_id', userId!).maybeSingle()).data as { total: number; correct_answers: number; scored_answers: number } | null,
  });
  const storyRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);

  if (season.isLoading || cands.isLoading) return <main className="flex flex-col gap-4 px-5 pt-16"><Skeleton h={300} /><Skeleton h={400} /></main>;
  if (season.data?.phase !== 'finished') {
    return <main className="px-5 pt-16"><EmptyState icon="crown" title="La grande finale n’a pas encore eu lieu" message="Ton récap de saison t’attendra ici après l’annonce du vainqueur." action={<Button size="sm" variant="secondary" onClick={() => navigate('/')}>Accueil</Button>} /></main>;
  }

  const winnerQ = game.data?.questions.find((q) => q.key === 'winner');
  const winnerIds = winnerQ?.result?.correct_option_ids ?? [];
  const winner = (cands.data ?? []).find((c) => c.status === 'winner') ?? (cands.data ?? []).find((c) => winnerQ?.options.some((o) => winnerIds.includes(o.id) && o.candidate_id === c.id));
  const finalPrime = (primes.data ?? []).find((p) => p.is_final);

  const me = lb.data?.find((r) => r.user_id === userId);
  const txByQ = new Map<string, number>();
  for (const t of game.data?.transactions ?? []) txByQ.set(t.question_id, (txByQ.get(t.question_id) ?? 0) + t.points);
  const bestQ = [...txByQ.entries()].sort((a, b) => b[1] - a[1])[0];
  const bestPrime = (scores.data ?? []).filter((s) => s.user_id === userId).sort((a, b) => b.points - a.points)[0];
  const orderedPrimes = (primes.data ?? []).filter((p) => (snaps.data ?? []).some((s) => s.prime_id === p.id));
  const recap: Recap = {
    pseudo: profile?.pseudo ?? '', avatar: profile?.avatar_url ?? null, rank: me?.rank ?? null, of: counts.data?.[primary?.league_id ?? ''] ?? lb.data?.length ?? 0,
    league: primary?.leagues.name ?? '', total: stats.data?.total ?? 0,
    rate: stats.data?.scored_answers ? (stats.data.correct_answers / stats.data.scored_answers) * 100 : null,
    bestProno: bestQ && bestQ[1] > 0 ? { pts: bestQ[1], title: game.data?.questions.find((q) => q.id === bestQ[0])?.title.toLowerCase() ?? '' } : null,
    bestPrime: bestPrime && bestPrime.points > 0 ? { pts: bestPrime.points, n: primes.data?.find((p) => p.id === bestPrime.prime_id)?.number ?? 0 } : null,
    ranks: orderedPrimes.map((p) => snaps.data!.find((s) => s.prime_id === p.id && s.user_id === userId)?.rank).filter((x): x is number => x != null),
    badges: (badges.data ?? []).filter((b) => mine.data?.some((m) => m.badge_code === b.code)),
    year: season.data.year,
  };

  async function share() {
    if (!storyRef.current) return;
    setSharing(true);
    try {
      const r = await shareNode(storyRef.current, `mon-recap-grand-prono-${recap.year}.png`, 'Mon récap Le Grand Prono');
      toast({ tone: 'success', title: 'Ton récap est prêt', message: r === 'shared' ? 'Partagé.' : 'Image au format story téléchargée.' });
    } catch {
      toast({ tone: 'error', title: 'Image non générée', message: 'On réessaie dans un instant.' });
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="relative flex flex-col">
      <KeyArtHero fadeAt="60%" />
      <div className="relative px-5 pt-3"><IconButton icon="arrow-left" label="Retour" onClick={() => navigate('/')} /></div>
      <main className="relative flex flex-col gap-[30px] px-5 pb-[50px] pt-[164px]">
        <div className="flex flex-col items-center gap-3.5 text-center">
          <div className="reveal flex gap-2" style={{ animationDelay: '0ms' }}><Badge tone="gold" icon="crown">Grande finale</Badge></div>
          <span className="t-body reveal text-secondary" style={{ animationDelay: '150ms' }}>Le vainqueur de la Star Academy {recap.year} est</span>
          {winner ? (
            <>
              <div className="reveal" style={{ animationDelay: '400ms' }}><Avatar name={winner.first_name} src={winner.photo_url} size={104} ring="gold" /></div>
              <span className="gp-gold-text reveal pr-2" style={{ font: 'italic 900 60px/1 var(--font-display)', animationDelay: '650ms' }}>{winner.first_name}</span>
            </>
          ) : <span className="t-h2">—</span>}
          {finalPrime && <span className="t-caption reveal text-muted" style={{ animationDelay: '800ms' }}>{fmtLong(finalPrime.airs_at).split(' · ')[0]} · résultat officiel</span>}
        </div>
        <div className="h-px bg-white/10" />

        <section className="reveal flex flex-col gap-3" style={{ animationDelay: '1000ms' }}>
          <Overline>TON RÉCAP DE SAISON</Overline>
          <RecapCard recap={recap} />
          <Button size="lg" block icon="share-2" loading={sharing} onClick={share}>Partager mon récap</Button>
          <Button size="lg" block variant="secondary" onClick={() => navigate('/classement')}>Voir le classement final</Button>
        </section>

        {(leagues.data?.length ?? 0) > 0 && (
          <section className="flex flex-col gap-2.5">
            <Overline>CHAMPIONS DES LIGUES</Overline>
            {leagues.data!.map((m) => <ChampionRow key={m.league_id} m={m} />)}
          </section>
        )}
      </main>
      <div style={{ position: 'fixed', left: -10000, top: 0 }} aria-hidden="true">
        <StoryCard ref={storyRef} recap={recap} />
      </div>
    </div>
  );
}

function RecapCard({ recap }: { recap: Recap }) {
  const max = Math.max(2, ...recap.ranks);
  const path = recap.ranks.map((r, i) => `${i ? 'L' : 'M'}${recap.ranks.length === 1 ? 150 : (i * 300) / (recap.ranks.length - 1)} ${8 + ((r - 1) / (max - 1)) * 40}`).join(' ');
  return (
    <div className="card-edge flex flex-col gap-[18px] p-5" style={{ boxShadow: 'var(--shadow-raised)' }}>
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <Overline className="text-gold-200">STAR ACADEMY {recap.year}</Overline>
          <span className="gp-glitter-text pr-1" style={{ font: 'italic 900 18px/1 var(--font-display)' }}>Le Grand Prono</span>
        </div>
        <Avatar name={recap.pseudo} src={recap.avatar} size={40} ring="magenta" />
      </div>
      <div className="flex items-center gap-3.5">
        <span className="gp-gold-text pr-2" style={{ font: 'italic 900 76px/1 var(--font-numeric)' }}>{recap.rank ? `#${recap.rank}` : '—'}</span>
        <div className="flex min-w-0 flex-col">
          <span className="t-h3 truncate">{recap.pseudo}</span>
          <span className="t-caption text-muted">{recap.rank ? `${ordinal(recap.rank)} sur ${recap.of} · ${recap.league}` : 'Pas de ligue'}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <StatTile value={fmtNum(recap.total)} label="Points" />
        <StatTile value={recap.rate != null ? fmtPct(recap.rate) : '—'} label="Réussite" />
        <StatTile value={recap.bestProno ? fmtGain(recap.bestProno.pts) : '—'} accent="var(--gold-400)" label={recap.bestProno ? `Meilleur prono · ${recap.bestProno.title}` : 'Meilleur prono'} />
        <StatTile value={recap.bestPrime ? fmtGain(recap.bestPrime.pts) : '—'} accent="var(--gold-400)" label={recap.bestPrime ? `Meilleur prime · prime ${recap.bestPrime.n}` : 'Meilleur prime'} />
      </div>
      {recap.ranks.length > 1 && (
        <div className="flex flex-col gap-2">
          <Overline className="text-muted">MON RANG, PRIME APRÈS PRIME</Overline>
          <svg width="100%" height="56" viewBox="0 0 300 56" preserveAspectRatio="none" style={{ overflow: 'visible' }} aria-hidden="true">
            <path d={path} fill="none" stroke="#ffa64a" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      )}
      {recap.badges.length > 0 && <div className="flex flex-wrap gap-2">{recap.badges.map((b) => <Badge key={b.code} tone="gold" icon={b.icon}>{b.name}</Badge>)}</div>}
      <span className="t-caption text-center text-muted">legrandprono.app · jeu entre amis, sans argent</span>
    </div>
  );
}

/** Format story 1080×1920 : la carte récap (360 px de large) agrandie ×3. */
const StoryCard = forwardRef<HTMLDivElement, { recap: Recap }>(function StoryCard({ recap }, ref) {
  return (
    <div ref={ref} style={{ width: 1080, height: 1920, background: 'var(--grad-stage)', overflow: 'hidden' }}>
      <div style={{ width: 360, height: 640, transform: 'scale(3)', transformOrigin: '0 0', padding: '48px 16px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <RecapCard recap={recap} />
      </div>
    </div>
  );
});

function ChampionRow({ m }: { m: LeagueMembership }) {
  const lb = useLeagueLeaderboard(m.league_id);
  const first = lb.data?.[0];
  return (
    <div className="card-plain flex items-center gap-3 px-3.5 py-3">
      <Thumb name={m.leagues.name} src={m.leagues.image_url} size={40} radius={10} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="t-caption truncate text-muted">{m.leagues.name}</span>
        <span className="t-body font-bold">{first?.pseudo ?? '…'}</span>
      </div>
      {first && <span className="text-gold-400" style={{ font: 'italic 800 16px var(--font-numeric)' }}>{fmtNum(first.total)} pts</span>}
    </div>
  );
}
