import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { lastClosedPrime, useBadges, useLeagueLeaderboard, useMyLeagues, usePrimeScores, usePrimes, useSeason, useUserBadges } from '@/lib/queries';
import { competitionRanks, moveOf } from '@/lib/game';
import { explainError } from '@/lib/errors';
import { fmtNum, fmtShortDate, plural } from '@/lib/format';
import type { League } from '@/lib/types';
import { Button, IconButton, IconCircle, Overline, Skeleton, Thumb } from '@/components/ui/core';
import { Icon } from '@/components/ui/Icon';
import { LeaderboardRow } from '@/components/ui/game';
import { ConfirmDialog, EmptyState, useToast } from '@/components/ui/feedback';
import { shareNode } from '@/lib/share';
import { ShareLeaderboardCard } from './ShareLeaderboardCard';

export function LeaguePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const { userId } = useAuth();
  const season = useSeason();
  const primes = usePrimes(season.data?.id);
  const my = useMyLeagues();
  const membership = my.data?.find((m) => m.league_id === id);
  const league = useQuery({
    queryKey: ['league', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('leagues').select('*').eq('id', id!).maybeSingle();
      if (error) throw error;
      return data as League | null;
    },
  });
  const lb = useLeagueLeaderboard(id);
  const scores = usePrimeScores(season.data?.id);
  const memberIds = (lb.data ?? []).map((r) => r.user_id);
  const ub = useUserBadges(season.data?.id, memberIds);
  const badges = useBadges();
  const shareRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [removing, setRemoving] = useState<{ id: string; name: string } | null>(null);
  const [leaving, setLeaving] = useState(false);

  if (league.isLoading || my.isLoading) return <main className="flex flex-col gap-4 px-5 pt-16"><Skeleton h={72} /><Skeleton h={120} /><Skeleton h={240} /></main>;
  const L = league.data;
  if (!L || !membership) {
    return <main className="px-5 pt-16"><EmptyState icon="users" title="Ligue introuvable" message="Tu n’en fais peut-être pas partie." action={<Button size="sm" variant="secondary" onClick={() => navigate('/ligues')}>Mes ligues</Button>} /></main>;
  }

  const manager = membership.role === 'owner' || membership.role === 'admin';
  const link = `${window.location.origin}/rejoindre/${L.invite_code}`;
  const rows = lb.data ?? [];

  const prime = [...(primes.data ?? [])].reverse().find((p) => (scores.data ?? []).some((s) => s.prime_id === p.id && memberIds.includes(s.user_id))) ?? lastClosedPrime(primes.data);
  const weekly = competitionRanks(rows.map((r) => ({ ...r, week: scores.data?.find((s) => s.prime_id === prime?.id && s.user_id === r.user_id)?.points ?? 0 })), (x) => x.week);
  const best = weekly[0] && weekly[0].week > 0 ? weekly[0] : null;
  const rewards = (ub.data ?? []).slice(0, 5).map((b) => ({ ...b, who: rows.find((r) => r.user_id === b.user_id)?.pseudo ?? '', badge: badges.data?.find((x) => x.code === b.badge_code) }));

  async function copy(text: string, title: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast({ tone: 'success', title, message: text });
    } catch {
      toast({ tone: 'info', title: 'Copie impossible', message: text });
    }
  }
  async function shareLink() {
    const data = { title: `Rejoins ${L!.name} sur Le Grand Prono`, text: `Code : ${L!.invite_code}`, url: link };
    if (navigator.share) {
      try { await navigator.share(data); } catch { /* partage annulé */ }
    } else copy(link, 'Lien d’invitation copié');
  }
  async function shareImage() {
    if (!shareRef.current) return;
    setSharing(true);
    try {
      const r = await shareNode(shareRef.current, `classement-${L!.name}.png`, `Classement · ${L!.name}`);
      toast({ tone: 'success', title: 'Image du classement générée', message: r === 'shared' ? 'Partagée.' : 'Téléchargée, prête à partager dans tes messageries.' });
    } catch {
      toast({ tone: 'error', title: 'Image non générée', message: 'On réessaie dans un instant.' });
    } finally {
      setSharing(false);
    }
  }
  async function removeMember() {
    if (!removing) return;
    const { error } = await supabase.from('league_members').delete().eq('league_id', L!.id).eq('user_id', removing.id);
    if (error) toast({ tone: 'error', ...explainErr(error) });
    else toast({ tone: 'success', title: `${removing.name} a quitté la ligue` });
    setRemoving(null);
    qc.invalidateQueries({ queryKey: ['lb-league', id] });
  }
  async function leave() {
    const { error } = await supabase.from('league_members').delete().eq('league_id', L!.id).eq('user_id', userId!);
    setLeaving(false);
    if (error) return toast({ tone: 'error', ...explainErr(error) });
    toast({ tone: 'success', title: 'Tu as quitté la ligue', message: 'Tes points restent acquis dans tes autres ligues.' });
    await qc.invalidateQueries();
    navigate('/ligues');
  }
  async function makePrimary() {
    const { error } = await supabase.rpc('set_primary_league', { p_league: L!.id });
    if (error) return toast({ tone: 'error', ...explainErr(error) });
    toast({ tone: 'success', title: 'Ligue principale', message: 'Elle s’affiche désormais sur ton accueil.' });
    qc.invalidateQueries({ queryKey: ['my-leagues'] });
  }
  async function regenerate() {
    const { error } = await supabase.rpc('regenerate_invite_code', { p_league: L!.id });
    if (error) return toast({ tone: 'error', ...explainErr(error) });
    toast({ tone: 'success', title: 'Nouveau code généré', message: 'L’ancien code ne fonctionne plus.' });
    qc.invalidateQueries({ queryKey: ['league', id] });
  }

  return (
    <>
      <div className="flex items-center justify-between px-5 pt-3">
        <IconButton icon="arrow-left" label="Retour" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/ligues'))} />
        <IconButton icon="share-2" label="Partager" onClick={shareLink} />
      </div>
      <main className="flex flex-col gap-[22px] px-5 pb-[60px] pt-2.5">
        <div className="flex items-center gap-4">
          <Thumb name={L.name} src={L.image_url} size={72} radius={20} />
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="t-h1 m-0 text-pretty" style={{ fontSize: 28 }}>{L.name}</h1>
            <span className="t-body-s text-muted">{plural(rows.length, 'joueur')}{manager ? ' · tu es admin' : ''}{membership.is_primary ? ' · ligue principale' : ''}</span>
          </div>
        </div>

        <div className="card-edge flex flex-col gap-3 p-4">
          <Overline className="text-gold-200">CODE D’INVITATION</Overline>
          <span style={{ font: 'italic 800 28px/1 var(--font-numeric)', letterSpacing: '.06em' }}>{L.invite_code}</span>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" icon="copy" onClick={() => copy(L.invite_code, 'Code copié')}>Copier</Button>
            <Button variant="secondary" size="sm" icon="link" onClick={shareLink}>Partager le lien</Button>
            {manager && <Button variant="ghost" size="sm" icon="refresh-cw" onClick={regenerate}>Nouveau code</Button>}
          </div>
        </div>

        <div className="card-plain flex items-center gap-3.5 px-4 py-3.5">
          <IconCircle icon="trending-up" tone="green" />
          <div className="flex flex-col">
            <Overline>JOUEUR DE LA SEMAINE</Overline>
            <span className="t-body font-bold">{best ? `${best.pseudo} · +${best.week} pts au prime ${prime?.number}` : 'Premier verdict au prochain prime'}</span>
          </div>
        </div>

        <section className="flex flex-col gap-1.5">
          <Overline>CLASSEMENT</Overline>
          {lb.isLoading ? <Skeleton h={240} /> : rows.map((r) => (
            <div key={r.user_id} className="group relative">
              <LeaderboardRow rank={r.rank} name={r.pseudo} avatar={r.avatar_url} points={fmtNum(r.total)} move={moveOf(r)} me={r.user_id === userId}
                sub={r.role === 'owner' ? 'Créateur de la ligue' : r.role === 'admin' ? 'Admin de la ligue' : plural(r.correct_answers, 'bon prono', 'bons pronos')} />
              {manager && r.user_id !== userId && r.role !== 'owner' && (
                <button type="button" aria-label={`Retirer ${r.pseudo}`} onClick={() => setRemoving({ id: r.user_id, name: r.pseudo })}
                  className="absolute right-[-6px] top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-transparent text-muted opacity-60 hover:bg-card hover:opacity-100">
                  <Icon name="x" size={14} />
                </button>
              )}
            </div>
          ))}
        </section>

        {rewards.length > 0 && (
          <section className="flex flex-col gap-3">
            <Overline>DERNIÈRES RÉCOMPENSES</Overline>
            <div className="card-plain row-sep flex flex-col">
              {rewards.map((r) => (
                <div key={r.user_id + r.badge_code} className="flex items-center gap-3 px-3.5 py-3">
                  <IconCircle icon={r.badge?.icon ?? 'medal'} tone="gold" size={32} />
                  <span className="t-body-s flex-1"><b>{r.who}</b> · badge {r.badge?.name}</span>
                  <span className="t-caption text-muted">{fmtShortDate(r.earned_at)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <Button variant="secondary" size="lg" block icon="image" loading={sharing} onClick={shareImage}>Partager le classement en image</Button>
        {!membership.is_primary && <Button variant="ghost" icon="star" onClick={makePrimary}>En faire ma ligue principale</Button>}
        {membership.role !== 'owner' && <Button variant="ghost" icon="log-out" onClick={() => setLeaving(true)}>Quitter la ligue</Button>}
        {manager && <p className="t-caption m-0 text-pretty text-center text-muted">Tu es admin de cette ligue : tu gères membres et invitations, jamais les résultats ni les scores.</p>}
      </main>

      {/* Carte 1080×1350 rendue hors écran pour l'export image */}
      <div style={{ position: 'fixed', left: -10000, top: 0 }} aria-hidden="true">
        <ShareLeaderboardCard ref={shareRef} league={L} rows={rows} season={season.data ?? null} />
      </div>

      <ConfirmDialog open={!!removing} title={`Retirer ${removing?.name} ?`} confirmLabel="Retirer de la ligue" danger onConfirm={removeMember} onCancel={() => setRemoving(null)}>
        Ses pronos et ses points restent intacts. Il pourra revenir avec le code d’invitation.
      </ConfirmDialog>
      <ConfirmDialog open={leaving} title="Quitter la ligue ?" confirmLabel="Quitter" danger onConfirm={leave} onCancel={() => setLeaving(false)}>
        Tes pronos et tes points sont conservés. Tu pourras revenir avec le code.
      </ConfirmDialog>
    </>
  );
}

const explainErr = (e: unknown) => {
  const x = explainError(e);
  return { title: x.title, message: x.message };
};
