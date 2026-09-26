import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { currentPrime, useCandidates, useGeneralLeaderboard, usePrimes, useSeason } from '@/lib/queries';
import { competitionRanks } from '@/lib/game';
import { explainError } from '@/lib/errors';
import { fmtDateAt, fmtDayDateTime, fmtNum } from '@/lib/format';
import type { AdminLog, ScoreTransaction } from '@/lib/types';
import { Avatar, Badge, Button, Input, Overline, StatTile } from '@/components/ui/core';
import { Icon } from '@/components/ui/Icon';
import { CandidateCard } from '@/components/ui/game';
import { ConfirmDialog, useToast } from '@/components/ui/feedback';
import { useAdminQuestions, useAdminRefresh, useProfiles } from './data';
import { effectiveStatus } from './AdminDashboard';

type Step = 'edit' | 'preview' | 'published';
interface PreviewRow { user_id: string; pseudo: string; option_ids: string[]; number_value: number | null; base: number; bonus: number; correct: number }
const COLS = 'minmax(130px,1.3fr) minmax(90px,1fr) 100px 64px 110px 90px';

export function AdminResults() {
  const season = useSeason();
  const sid = season.data?.id;
  const primes = usePrimes(sid);
  const qs = useAdminQuestions(sid);
  const cands = useCandidates(sid);
  const lb = useGeneralLeaderboard(sid);
  const profiles = useProfiles();
  const toast = useToast();
  const refresh = useAdminRefresh();
  const cur = currentPrime(primes.data);
  const [scope, setScope] = useState<string | null>(null);
  const primeId = scope ?? cur?.id ?? 'grand';
  const prime = primes.data?.find((p) => p.id === primeId);
  const queue = (qs.data ?? []).filter((q) => q.status !== 'draft' && (primeId === 'grand' ? q.category === 'grand' : q.prime_id === primeId));
  const [selId, setSelId] = useState<string | null>(null);
  const q = queue.find((x) => x.id === selId) ?? queue.find((x) => effectiveStatus(x) === 'closed') ?? queue[0];

  const [pick, setPick] = useState<string[]>([]);
  const [num, setNum] = useState('');
  const [step, setStep] = useState<Step>('edit');
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [closing, setClosing] = useState(false);

  const result = useQuery({
    queryKey: ['admin-result', q?.id],
    enabled: !!q,
    queryFn: async () => (await supabase.from('official_results').select('*').eq('question_id', q!.id).maybeSingle()).data as { correct_option_ids: string[]; number_value: number | null; version: number } | null,
  });
  const existingTx = useQuery({
    queryKey: ['admin-tx', q?.id],
    enabled: !!q,
    queryFn: async () => ((await supabase.from('score_transactions').select('*').eq('question_id', q!.id)).data ?? []) as ScoreTransaction[],
  });
  const logs = useQuery({
    queryKey: ['admin-logs-q', q?.id],
    enabled: !!q,
    queryFn: async () => ((await supabase.from('admin_logs').select('*').eq('entity_id', q!.id).like('action', 'result.%').order('created_at', { ascending: false })).data ?? []) as AdminLog[],
  });
  const nomCounts = useQuery({
    queryKey: ['admin-nom-counts', sid],
    enabled: !!sid && (q?.key === 'most_nominated' || q?.key === 'least_nominated'),
    queryFn: async () => ((await supabase.from('v_candidate_nomination_counts').select('*').eq('season_id', sid!)).data ?? []) as { candidate_id: string; first_name: string; nominations: number; eligible_weeks: number }[],
  });

  useEffect(() => {
    setPreview(null);
    setStep(q?.status === 'published' ? 'published' : 'edit');
    setPick(result.data?.correct_option_ids ?? []);
    setNum(result.data?.number_value != null ? String(result.data.number_value) : '');
  }, [q?.id, q?.status, result.data]);

  const candById = useMemo(() => new Map((cands.data ?? []).map((c) => [c.id, c])), [cands.data]);
  const players = (lb.data ?? []).length;

  // Tableau de prévisualisation : totaux et rangs avant → après (affichage uniquement, le calcul réel est fait par publish_result)
  const rows = useMemo(() => {
    if (!preview || !q) return [];
    const before = lb.data ?? [];
    const prevPts = (uid: string) => (existingTx.data ?? []).filter((t) => t.user_id === uid).reduce((s, t) => s + t.points, 0);
    const after = before.map((r) => {
      const p = preview.find((x) => x.user_id === r.user_id);
      return { ...r, after: r.total - prevPts(r.user_id) + (p ? p.base + p.bonus : 0) };
    });
    const rankAfter = new Map(competitionRanks(after, (x) => x.after).map((x) => [x.user_id, x.rank]));
    return after.map((r) => {
      const p = preview.find((x) => x.user_id === r.user_id);
      const answer = p ? (q.type === 'exact_number' ? String(p.number_value) : p.option_ids.map((id) => q.options.find((o) => o.id === id)?.label ?? '?').join(', ')) : null;
      const pts = p ? p.base + p.bonus : 0;
      return { ...r, answer, pts, res: !p ? 'Aucune' : pts > 0 ? (p.correct < q.max_selections && q.max_selections > 1 && q.scoring !== 'all_or_nothing' ? 'Partiel' : 'Correct') : 'Incorrect', rankAfter: rankAfter.get(r.user_id) ?? r.rank };
    }).sort((a, b) => b.after - a.after);
  }, [preview, q, lb.data, existingTx.data]);

  if (!sid) return null;
  const correctCount = rows.filter((r) => r.pts > 0).length;
  const distributed = rows.reduce((s, r) => s + r.pts, 0);
  const noAnswer = rows.filter((r) => r.res === 'Aucune').length;
  const pickLabel = q ? (q.type === 'exact_number' ? num : pick.map((id) => q.options.find((o) => o.id === id)?.label).join(', ')) : '';
  const stillOpen = q && new Date(q.closes_at).getTime() > Date.now() && q.status === 'open';
  const allDone = queue.length > 0 && queue.every((x) => x.status === 'published' || x.status === 'cancelled');

  async function doPreview() {
    if (!q) return;
    setBusy(true);
    const { data, error } = await supabase.rpc('preview_result', { p_question: q.id, p_correct: q.type === 'exact_number' ? [] : pick, p_number: q.type === 'exact_number' ? Number(num) : null });
    setBusy(false);
    if (error) return toast({ tone: 'error', ...explainError(error) });
    setPreview(data as PreviewRow[]);
    setStep('preview');
  }
  async function publish() {
    if (!q) return;
    setBusy(true);
    const wasPublished = q.status === 'published';
    const { error } = await supabase.rpc('publish_result', { p_question: q.id, p_correct: q.type === 'exact_number' ? [] : pick, p_number: q.type === 'exact_number' ? Number(num) : null });
    setBusy(false);
    setConfirm(false);
    if (error) return toast({ tone: 'error', ...explainError(error) });
    toast({ tone: 'success', title: wasPublished ? 'Résultat corrigé' : 'Résultat publié', message: 'Classements de toutes les ligues actualisés. Enregistré dans le journal.' });
    setStep('published');
    refresh();
  }
  async function doCancel() {
    if (!q) return;
    const { error } = await supabase.rpc('cancel_question', { p_question: q.id, p_reason: reason });
    setCancel(false);
    if (error) return toast({ tone: 'error', ...explainError(error) });
    toast({ tone: 'success', title: 'Question annulée', message: 'Aucun point attribué.' });
    refresh();
  }
  async function closeWeek() {
    if (!prime) return;
    setClosing(true);
    const { error } = await supabase.rpc('close_prime', { p_prime: prime.id });
    setClosing(false);
    if (error) return toast({ tone: 'error', ...explainError(error) });
    toast({ tone: 'success', title: `Semaine ${prime.number} clôturée`, message: 'Rangs figés, badges et notifications de progression envoyés.' });
    refresh();
  }

  function toggle(id: string) {
    if (!q) return;
    setPick((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (q.type === 'ordered') return cur.length >= q.max_selections ? cur : [...cur, id];
      return [...cur, id]; // plusieurs réponses = égalité acceptée / liste officielle
    });
  }

  const stepIdx = { edit: 0, preview: 1, published: 2 }[step];

  return (
    <div className="flex h-full min-w-0">
      {/* File des questions */}
      <aside className="no-scrollbar flex w-[260px] flex-none flex-col gap-3.5 overflow-auto border-r border-subtle px-4 py-6">
        <select value={primeId} onChange={(e) => { setScope(e.target.value); setSelId(null); }} className="h-9 rounded-sm border-0 bg-card px-3 text-primary shadow-subtle" style={{ font: 'var(--text-body-s)' }}>
          {(primes.data ?? []).map((p) => <option key={p.id} value={p.id}>Prime {p.number}{p.id === cur?.id ? ' (en cours)' : ''}</option>)}
          <option value="grand">Grands pronos</option>
        </select>
        <div className="flex flex-col gap-0.5">
          <Overline>{prime ? `PRIME ${prime.number} · ${fmtDayDateTime(prime.airs_at).toUpperCase()}` : 'SAISON'}</Overline>
          <span className="t-h2">Résultats à saisir</span>
        </div>
        {queue.length === 0 && <span className="t-body-s text-muted">Aucune question publiée pour ce prime.</span>}
        {queue.map((x) => {
          const st = effectiveStatus(x);
          const lbl = { open: ['Ouvert', 'closed'], closed: ['Clôturé', 'magenta'], published: ['Publié', 'open'], cancelled: ['Annulé', 'closed'], draft: ['Brouillon', 'neutral'] }[st] as [string, 'open'];
          const on = x.id === q?.id;
          return (
            <button key={x.id} type="button" onClick={() => setSelId(x.id)} className="flex flex-col gap-2 rounded-md border-0 p-3.5 text-left"
              style={on ? { background: 'rgba(255,255,255,.08)', boxShadow: 'inset 0 0 0 1.5px var(--flare-400)' } : { background: 'var(--surface-card)', boxShadow: 'inset 0 0 0 1px var(--border-subtle)' }}>
              <div className="flex items-center justify-between"><Badge tone={lbl[1]}>{lbl[0]}</Badge><span className="t-caption text-muted">{x.answers} réponse{x.answers > 1 ? 's' : ''}</span></div>
              <span className="t-body font-bold">{x.title}</span>
              <span className="t-caption text-muted">{x.max_selections > 1 ? `${x.max_selections} sélections · ${x.points} pts / bonne réponse` : `Réponse unique · ${x.points} pts`}{st === 'open' ? ` · clôture ${fmtDayDateTime(x.closes_at)}` : ''}</span>
            </button>
          );
        })}
        {prime && allDone && !prime.closed_at && (
          <Button block icon="calendar-check" loading={closing} onClick={closeWeek}>Clôturer la semaine {prime.number}</Button>
        )}
        {prime?.closed_at && <span className="t-caption text-muted">Semaine clôturée : rangs figés pour le graphique d’évolution.</span>}
      </aside>

      {/* Stepper */}
      <main className="no-scrollbar relative flex min-w-0 flex-1 flex-col gap-[22px] overflow-auto px-7 py-6">
        {!q ? (
          <span className="t-body text-muted">Sélectionne une question.</span>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="t-h1">{q.title}</span>
                <span className="t-body-s text-muted">
                  {q.type === 'exact_number' ? 'Nombre exact' : q.max_selections > 1 ? `${q.max_selections} sélections` : 'Réponse unique'} · {q.points} pts{q.bonus_points ? ` + ${q.bonus_points} bonus` : ''} · {stillOpen ? 'clôture' : 'clôturée'} {fmtDayDateTime(q.closes_at)} · {q.answers} / {players} joueurs ont répondu
                </span>
                {q.validation_criteria && <span className="t-caption flex gap-2 text-muted"><Icon name="scale" size={13} style={{ marginTop: 1 }} />Validé si : {q.validation_criteria}</span>}
              </div>
              <div className="flex flex-none items-center gap-1.5">
                {['Saisir', 'Prévisualiser', 'Publier'].map((l, i) => (
                  <div key={l} className="flex items-center gap-1.5">
                    <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full" style={{ font: 'italic 800 12px var(--font-numeric)', ...(i <= stepIdx ? { background: 'var(--grad-cta)', color: '#fff' } : { background: 'rgba(255,255,255,.08)', color: 'var(--text-muted)' }) }}>
                      {i < stepIdx || step === 'published' ? <Icon name="check" size={12} /> : i + 1}
                    </span>
                    <span className="t-caption font-bold" style={{ color: i <= stepIdx ? 'var(--text-primary)' : 'var(--text-muted)' }}>{l}</span>
                    {i < 2 && <span className="h-px w-[18px] bg-white/20" />}
                  </div>
                ))}
              </div>
            </div>

            {q.status === 'cancelled' && (
              <div className="card-plain flex items-center gap-3 px-4 py-3.5"><Icon name="ban" size={18} className="text-muted" /><span className="t-body-s">Question annulée : {q.cancelled_reason}. Aucun point attribué.</span></div>
            )}

            {stillOpen && (
              <div className="card-plain flex items-center gap-3 px-4 py-3.5">
                <Icon name="clock" size={18} className="text-flare-400" />
                <span className="t-body-s">Question encore ouverte jusqu’au {fmtDateAt(q.closes_at)}. Le résultat se saisit après la clôture.</span>
              </div>
            )}

            {step === 'published' && q.status === 'published' && (
              <div className="flex items-center gap-3.5 rounded-md px-4 py-3.5" style={{ background: 'rgba(47,217,154,.1)', boxShadow: 'inset 0 0 0 1px rgba(47,217,154,.4)' }}>
                <Icon name="circle-check" size={20} style={{ color: 'var(--green-500)' }} />
                <div className="flex flex-1 flex-col">
                  <span className="t-body font-bold">Résultat publié : {q.type === 'exact_number' ? result.data?.number_value : (result.data?.correct_option_ids ?? []).map((id) => q.options.find((o) => o.id === id)?.label).join(', ')}{result.data && result.data.version > 1 ? ` · version ${result.data.version}` : ''}</span>
                  <span className="t-caption text-secondary">Points attribués, classements de toutes les ligues actualisés.</span>
                </div>
                <Button variant="secondary" size="sm" icon="pencil" onClick={() => setStep('edit')}>Corriger le résultat</Button>
              </div>
            )}

            {step === 'edit' && !stillOpen && q.status !== 'cancelled' && (
              <div className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-0.5">
                  <Overline>1 · RÉSULTAT OFFICIEL</Overline>
                  <span className="t-body-s text-muted">
                    {q.status === 'published' ? 'Correction : le recalcul remplace l’attribution précédente, sans doublon.' : q.type === 'ordered' ? 'Touche les candidats dans l’ordre officiel.' : q.max_selections > 1 ? 'Sélectionne la liste officielle complète.' : 'Sélectionne la bonne réponse. En cas d’égalité (ou de double élimination), sélectionne-les toutes.'}
                  </span>
                </div>
                {nomCounts.data && (
                  <div className="card-plain t-body-s flex flex-wrap gap-x-4 gap-y-1 px-4 py-3 text-secondary">
                    <span className="font-bold text-primary">Aide au calcul :</span>
                    {[...nomCounts.data].filter((c) => q.key === 'most_nominated' || c.eligible_weeks >= (season.data?.least_nominated_min_weeks ?? 4))
                      .sort((a, b) => (q.key === 'most_nominated' ? b.nominations - a.nominations : a.nominations - b.nominations)).slice(0, 6)
                      .map((c) => <span key={c.candidate_id}>{c.first_name} · {c.nominations} nomination{c.nominations > 1 ? 's' : ''}{q.key === 'least_nominated' ? ` (${c.eligible_weeks} sem. éligibles)` : ''}</span>)}
                  </div>
                )}
                {q.type === 'exact_number' ? (
                  <Input label="Nombre officiel" type="number" value={num} onChange={(e) => setNum(e.target.value)} className="max-w-[240px]" />
                ) : (
                  <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, 150px)' }}>
                    {q.options.map((o) => {
                      const c = o.candidate_id ? candById.get(o.candidate_id) : null;
                      const idx = pick.indexOf(o.id);
                      return (
                        <CandidateCard key={o.id} name={o.label} photo={c?.photo_url} size={o.candidate_id ? 56 : 40} selected={idx >= 0} onSelect={() => toggle(o.id)}
                          meta={idx >= 0 && q.type === 'ordered' ? `Position ${idx + 1}` : c ? { nominated: 'Nommé·e', eliminated: 'Éliminé·e', immune: 'Immunisé·e', finalist: 'Finaliste', winner: 'Vainqueur', competing: 'En compétition' }[c.status] : undefined} />
                      );
                    })}
                  </div>
                )}
                <div className="flex gap-2.5 pt-1.5">
                  <Button iconRight="arrow-right" loading={busy} disabled={q.type === 'exact_number' ? num === '' : pick.length === 0} onClick={doPreview}>Prévisualiser les points</Button>
                  {q.status !== 'published' && <Button variant="ghost" icon="ban" onClick={() => { setCancel(true); setReason(''); }}>Annuler la question</Button>}
                  {q.status === 'published' && <Button variant="ghost" onClick={() => setStep('published')}>Retour</Button>}
                </div>
              </div>
            )}

            {step === 'preview' && preview && (
              <div className="flex flex-col gap-3.5">
                <Overline>2 · PRÉVISUALISATION — RIEN N’EST ENCORE PUBLIÉ</Overline>
                <div className="grid grid-cols-3 gap-3">
                  <StatTile value={`${correctCount} / ${players}`} label="Bonnes réponses" />
                  <StatTile value={fmtNum(distributed)} accent="var(--gold-400)" label="Points distribués" />
                  <StatTile value={noAnswer} label="Sans réponse (0 pt)" />
                </div>
                <div className="flex flex-col rounded-md bg-card shadow-subtle">
                  <div className="t-overline grid items-center gap-3 px-4 py-2.5 text-muted" style={{ gridTemplateColumns: COLS, letterSpacing: '.1em' }}>
                    <span>JOUEUR</span><span>RÉPONSE</span><span>RÉSULTAT</span><span>POINTS</span><span>TOTAL</span><span>RANG</span>
                  </div>
                  {rows.map((r) => (
                    <div key={r.user_id} className="t-body-s grid min-h-12 items-center gap-3 border-t border-subtle px-4" style={{ gridTemplateColumns: COLS }}>
                      <span className="flex items-center gap-2.5 font-bold"><Avatar name={r.pseudo} src={r.avatar_url} size={28} /><span className="truncate">{r.pseudo}</span></span>
                      <span className="truncate text-secondary">{r.answer ?? 'Pas de réponse'}</span>
                      <span><Badge tone={r.res === 'Aucune' ? 'closed' : r.res === 'Incorrect' ? 'neutral' : r.res === 'Partiel' ? 'magenta' : 'open'}>{r.res}</Badge></span>
                      <span className="text-gold-400" style={{ font: 'italic 800 15px var(--font-numeric)' }}>{r.pts > 0 ? `+${r.pts}` : '0'}</span>
                      <span className="text-secondary" style={{ font: 'italic 700 14px var(--font-numeric)' }}>{fmtNum(r.total)} → {fmtNum(r.after)}</span>
                      <span className="text-secondary" style={{ font: 'italic 700 14px var(--font-numeric)' }}>#{r.rank} → #{r.rankAfter}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2.5">
                  <Button icon="send" onClick={() => setConfirm(true)}>{q.status === 'published' ? 'Publier la correction' : 'Publier les résultats'}</Button>
                  <Button variant="secondary" icon="arrow-left" onClick={() => setStep('edit')}>Modifier le résultat</Button>
                </div>
              </div>
            )}

            {(logs.data?.length ?? 0) > 0 && (
              <div className="flex flex-col gap-2">
                <Overline>JOURNAL DES MODIFICATIONS</Overline>
                {logs.data!.map((l) => {
                  const who = profiles.data?.find((p) => p.id === l.actor_id)?.pseudo ?? 'Système';
                  const oldC = (l.old_value?.correct as string[] | undefined)?.join(', ');
                  const newC = (l.new_value?.correct as string[] | undefined)?.join(', ') || String(l.new_value?.number_value ?? '');
                  return (
                    <div key={l.id} className="t-body-s flex items-center gap-3 text-secondary">
                      <Icon name="history" size={15} className="text-muted" />
                      <span className="flex-1">{l.action === 'result.correct' ? 'Résultat corrigé · scores recalculés' : 'Résultat publié'} : {oldC ? `${oldC} → ` : ''}{newC}</span>
                      <span className="t-caption text-muted">{who} · {fmtDayDateTime(l.created_at)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      <ConfirmDialog open={confirm} title={q?.status === 'published' ? 'Publier la correction ?' : 'Publier les résultats ?'} confirmLabel="Publier" loading={busy} onConfirm={publish} onCancel={() => setConfirm(false)}>
        Résultat : <b className="text-primary">{pickLabel}</b>. {fmtNum(distributed)} pts seront attribués à {correctCount} joueur{correctCount > 1 ? 's' : ''} et tous les classements seront recalculés.
      </ConfirmDialog>
      <ConfirmDialog open={cancel} danger title="Annuler la question ?" confirmLabel="Annuler la question" cancelLabel="Retour" onCancel={() => setCancel(false)} onConfirm={doCancel}>
        <div className="flex flex-col gap-3">
          <span>Aucun point ne sera attribué.</span>
          <Input label="Motif (obligatoire)" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex. Mécanique absente ce prime" />
        </div>
      </ConfirmDialog>
    </div>
  );
}

