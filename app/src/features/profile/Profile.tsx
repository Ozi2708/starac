import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { isDemoSeason, useBadges, useGame, useLeagueLeaderboard, usePrimaryLeague, usePrimeScores, usePrimes, useSeason, useUserBadges, type GameQuestion } from '@/lib/queries';
import { answerStatus, optionLabels } from '@/lib/game';
import { fmtGain, fmtMonthYear, fmtNum, fmtPct, fmtShortDate } from '@/lib/format';
import { explainError } from '@/lib/errors';
import { Avatar, Badge, LegalNote, Overline, SegmentedControl, Skeleton, StatTile, Switch } from '@/components/ui/core';
import { Icon } from '@/components/ui/Icon';
import { ConfirmDialog, useToast } from '@/components/ui/feedback';
import { Screen } from '@/app/MobileLayout';

type Tab = 'week' | 'season';

export function Profile() {
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const { profile, userId, isAdmin, signOut } = useAuth();
  const season = useSeason();
  const sid = season.data?.id;
  const primes = usePrimes(sid);
  const game = useGame(sid);
  const { primary } = usePrimaryLeague();
  const lb = useLeagueLeaderboard(primary?.league_id);
  const scores = usePrimeScores(sid);
  const badges = useBadges();
  const mine = useUserBadges(sid, userId ? [userId] : []);
  const [tab, setTab] = useState<Tab>('week');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const stats = useQuery({
    queryKey: ['my-score', sid, userId],
    enabled: !!sid && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('v_season_scores').select('*').eq('season_id', sid!).eq('user_id', userId!).maybeSingle();
      if (error) throw error;
      return data as { total: number; correct_answers: number; scored_answers: number } | null;
    },
  });

  const me = lb.data?.find((r) => r.user_id === userId);
  const earned = new Map((mine.data ?? []).map((b) => [b.badge_code, b]));
  const myScores = (primes.data ?? []).map((p) => ({ p, pts: scores.data?.find((s) => s.prime_id === p.id && s.user_id === userId)?.points })).filter((x) => x.pts != null) as { p: { number: number; id: string }; pts: number }[];
  const maxBar = Math.max(1, ...myScores.map((x) => x.pts));

  const qs = game.data?.questions ?? [];
  const groups: { title: string; rows: GameQuestion[] }[] = tab === 'week'
    ? [...(primes.data ?? [])].reverse().map((p) => ({
        title: `PRIME ${p.number}${!p.closed_at && qs.some((q) => q.prime_id === p.id && !q.locked) ? ' · EN COURS' : ''}`,
        rows: qs.filter((q) => q.prime_id === p.id),
      })).filter((g) => g.rows.length)
    : [{ title: qs.some((q) => q.category === 'grand' && !q.locked) ? 'GRANDS PRONOS · OUVERTS' : 'GRANDS PRONOS · VERROUILLÉS', rows: qs.filter((q) => q.category === 'grand') }].filter((g) => g.rows.length);

  async function toggleNotif(v: boolean) {
    const { error } = await supabase.from('profiles').update({ notif_enabled: v }).eq('id', userId!);
    if (error) return toast({ tone: 'error', ...explainError(error) });
    qc.invalidateQueries({ queryKey: ['profile'] });
    toast({ tone: 'info', title: v ? 'Notifications activées' : 'Notifications désactivées', message: v ? 'Tu seras prévenu avant chaque clôture.' : 'Tu peux les réactiver à tout moment.' });
  }
  async function exportData() {
    const { data, error } = await supabase.rpc('export_my_data');
    if (error) return toast({ tone: 'error', ...explainError(error) });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `mes-donnees-grand-prono.json`;
    a.click();
    toast({ tone: 'success', title: 'Export prêt', message: 'Tes données ont été téléchargées.' });
  }
  async function deleteAccount() {
    const { error } = await supabase.rpc('delete_my_account');
    setConfirmDelete(false);
    if (error) return toast({ tone: 'error', ...explainError(error) });
    await signOut();
    navigate('/');
  }

  const good = stats.data?.correct_answers ?? 0;
  const scored = stats.data?.scored_answers ?? 0;

  return (
    <Screen gap={26}>
      <div className="flex items-center gap-4">
        <Avatar name={profile?.pseudo} src={profile?.avatar_url} size={64} ring="magenta" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="t-h2 truncate">{profile?.pseudo}</span>
          <span className="t-caption text-muted">{primary ? `${primary.leagues.name} · ` : ''}depuis {profile ? fmtMonthYear(profile.created_at) : ''}</span>
        </div>
        {isDemoSeason(season.data) && <Badge>Démo</Badge>}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <StatTile gold value={stats.isLoading ? '…' : fmtNum(stats.data?.total ?? 0)} label="Points au total" />
        <StatTile value={me ? `#${me.rank}` : '—'} label="Rang · ligue principale" />
        <StatTile value={`${good} / ${scored}`} label="Bonnes réponses" />
        <StatTile value={scored ? fmtPct((good / scored) * 100) : '—'} label="Taux de réussite" />
      </div>

      <section className="flex flex-col gap-3.5">
        <div className="flex items-baseline justify-between">
          <Overline>MES BADGES</Overline>
          <span className="t-caption text-muted">{earned.size} / {badges.data?.length ?? 7}</span>
        </div>
        <div className="grid grid-cols-4 gap-x-2 gap-y-4">
          {(badges.data ?? []).map((b) => {
            const e = earned.get(b.code);
            return (
              <button key={b.code} type="button" className="flex flex-col items-center gap-2 border-0 bg-transparent p-0"
                onClick={() => toast({ tone: e ? 'points' : 'info', title: b.name, message: e ? `${b.description} Obtenu le ${fmtShortDate(e.earned_at)}.` : `${b.description} Pas encore obtenu.` })}>
                <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full"
                  style={e ? { background: 'var(--grad-gold)', color: '#3a1a00', boxShadow: 'var(--glow-gold)' } : { background: 'rgba(255,255,255,.05)', color: 'var(--text-muted)', boxShadow: 'inset 0 0 0 1px var(--border-subtle)' }}>
                  <Icon name={b.icon} size={22} />
                </span>
                <span className="t-caption text-center font-bold leading-tight text-secondary">{b.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <Overline>HISTORIQUE DES POINTS</Overline>
        <div className="card-plain p-4">
          {myScores.length ? (
            <div className="flex h-[140px] items-end gap-2.5" role="img" aria-label="Points gagnés par prime">
              {myScores.map((x, i) => (
                <div key={x.p.id} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  <span className="text-secondary" style={{ font: 'italic 700 12px var(--font-numeric)' }}>{fmtGain(x.pts)}</span>
                  <div className="w-full max-w-9 rounded-[6px]" style={{ height: Math.round((x.pts / maxBar) * 90) + 4, background: i === myScores.length - 1 ? 'var(--grad-gold)' : 'rgba(255,255,255,.14)' }} />
                  <span className="t-caption text-muted">P{x.p.number}</span>
                </div>
              ))}
            </div>
          ) : <span className="t-body-s text-muted">Tes points apparaîtront après les premiers résultats.</span>}
        </div>
      </section>

      <section className="flex flex-col gap-3.5">
        <Overline>MES PRONOSTICS</Overline>
        <SegmentedControl<Tab> value={tab} onChange={setTab} options={[{ value: 'week', label: 'Par prime' }, { value: 'season', label: 'Grands pronos' }]} />
        {game.isLoading ? <Skeleton h={160} /> : groups.length === 0 ? <span className="t-body-s text-muted">Aucun prono pour l’instant.</span> : groups.map((g) => (
          <div key={g.title} className="flex flex-col gap-2">
            <Overline className="text-muted">{g.title}</Overline>
            <div className="card-plain row-sep flex flex-col">
              {g.rows.map((q) => {
                const st = answerStatus(q);
                const ans = q.mine ? (q.type === 'exact_number' ? String(q.mine.number_value) : optionLabels(q, q.mine.option_ids).join(', ')) : 'Pas de réponse';
                const extra = q.status === 'cancelled' ? ` · ${q.cancelled_reason ?? 'annulé'}` : q.status === 'published' && q.result && q.type !== 'exact_number' && (q.myPoints ?? 0) === 0 && q.mine ? ` · réponse : ${optionLabels(q, q.result.correct_option_ids).join(', ')}` : '';
                return (
                  <button key={q.id} type="button" onClick={() => navigate(`/pronos/${q.id}`)} className="flex items-center gap-2.5 border-0 bg-transparent px-3.5 py-3 text-left">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="t-body-s font-bold">{q.title}</span>
                      <span className="t-caption truncate text-muted">{ans}{extra}</span>
                    </div>
                    {q.status === 'published' && (q.myPoints ?? 0) > 0 && <span className="text-gold-400" style={{ font: 'italic 800 14px var(--font-numeric)' }}>+{q.myPoints}</span>}
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <span className="t-caption text-muted">Les bonnes réponses et les points apparaissent après la publication officielle des résultats.</span>
      </section>

      <section className="flex flex-col gap-3">
        <Overline>PARAMÈTRES</Overline>
        <div className="card-plain row-sep flex flex-col">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Icon name="bell" size={18} className="text-secondary" />
            <div className="flex flex-1 flex-col"><span className="t-body font-bold">Notifications</span><span className="t-caption text-muted">Ouvertures, clôtures, résultats, badges</span></div>
            <Switch checked={!!profile?.notif_enabled} onChange={toggleNotif} ariaLabel="Notifications" />
          </div>
          <Row icon="users" label="Mes ligues" onClick={() => navigate('/ligues')} />
          <Row icon="download" label="Exporter mes données" sub="Pronos, points, ligues, badges (JSON)" onClick={exportData} />
          <Row icon="trash" label="Supprimer mon compte" sub="Définitif : pronos et points effacés" onClick={() => setConfirmDelete(true)} />
          {isAdmin && <Row icon="layout-dashboard" label="Administration" onClick={() => navigate('/admin')} />}
          <Row icon="log-out" label="Me déconnecter" onClick={async () => { await signOut(); navigate('/'); }} />
        </div>
      </section>
      <LegalNote />
      <ConfirmDialog open={confirmDelete} danger title="Supprimer ton compte ?" confirmLabel="Supprimer définitivement" onConfirm={deleteAccount} onCancel={() => setConfirmDelete(false)}>
        Ton profil, tes pronos, tes points et tes badges seront effacés. Cette action est irréversible.
      </ConfirmDialog>
    </Screen>
  );
}

function Row({ icon, label, sub, onClick }: { icon: string; label: string; sub?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-3 border-0 bg-transparent px-4 py-3.5 text-left">
      <Icon name={icon} size={18} className="text-secondary" />
      <div className="flex flex-1 flex-col">
        <span className="t-body font-bold">{label}</span>
        {sub && <span className="t-caption text-muted">{sub}</span>}
      </div>
      <Icon name="chevron-right" size={18} className="text-muted" />
    </button>
  );
}
