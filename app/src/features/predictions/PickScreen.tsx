import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCandidates, useGame, usePrimes, useSeason, useSubmitPrediction } from '@/lib/queries';
import { answered, isMultiPerCorrect, optionLabels, pointsSuffix } from '@/lib/game';
import { fmtDateAt, fmtDayDateTime } from '@/lib/format';
import { errorCode, explainError } from '@/lib/errors';
import { Avatar, Badge, Button, IconButton, Input, Overline, PointsChip, ProgressBar, Skeleton } from '@/components/ui/core';
import { Icon } from '@/components/ui/Icon';
import { CandidateCard, STATUS_LABEL } from '@/components/ui/game';
import { ConfirmDialog, EmptyState, useToast } from '@/components/ui/feedback';
import type { QuestionOption } from '@/lib/types';

/** Écran de sélection / consultation verrouillée d'une question (`/pronos/:id`). */
export function PickScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const season = useSeason();
  const primes = usePrimes(season.data?.id);
  const game = useGame(season.data?.id);
  const cands = useCandidates(season.data?.id);
  const submit = useSubmitPrediction();
  const q = game.data?.questions.find((x) => x.id === id);

  const [draft, setDraft] = useState<string[]>([]);
  const [num, setNum] = useState('');
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    if (!q) return;
    setDraft(q.mine?.option_ids ?? []);
    setNum(q.mine?.number_value != null ? String(q.mine.number_value) : '');
    // on ne réinitialise qu'au changement de question ou de réponse enregistrée
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q?.id, q?.mine?.updated_at]);

  const candById = useMemo(() => new Map((cands.data ?? []).map((c) => [c.id, c])), [cands.data]);
  const tab = q?.category === 'grand' ? 'saison' : q?.category === 'fun' ? 'improbables' : 'semaine';
  const back = () => (window.history.length > 1 ? navigate(-1) : navigate(`/pronos?tab=${tab}`));

  if (game.isLoading || cands.isLoading) {
    return <main className="flex flex-col gap-4 px-5 pt-16"><Skeleton h={120} /><Skeleton h={300} /></main>;
  }
  if (!q) {
    return <main className="px-5 pt-16"><EmptyState icon="x" title="Question introuvable" action={<Button size="sm" variant="secondary" onClick={() => navigate('/pronos')}>Retour aux pronos</Button>} /></main>;
  }

  const locked = q.locked;
  const saved = q.mine?.option_ids ?? [];
  const prime = primes.data?.find((p) => p.id === q.prime_id);
  const isNumber = q.type === 'exact_number';
  const isOrdered = q.type === 'ordered';
  const candidateOpts = q.options.filter((o) => o.candidate_id);
  const noneOpt = q.options.find((o) => o.is_none_option);
  const textOpts = q.options.filter((o) => !o.candidate_id && !o.is_none_option);
  const multi = q.max_selections > 1;
  const tray = multi && candidateOpts.length > 0;
  const noneChosen = !!noneOpt && draft.includes(noneOpt.id);

  const correct = q.result?.correct_option_ids ?? [];
  const published = q.status === 'published';

  function toggle(o: QuestionOption) {
    if (locked) return;
    setDraft((cur) => {
      if (cur.includes(o.id)) return cur.filter((x) => x !== o.id);
      if (o.is_none_option) return [o.id];
      const base = noneOpt ? cur.filter((x) => x !== noneOpt.id) : cur;
      if (q!.max_selections === 1) return [o.id];
      if (base.length >= q!.max_selections) {
        toast({ tone: 'info', title: 'Sélection complète', message: 'Retire un candidat pour en choisir un autre.' });
        return cur;
      }
      return [...base, o.id];
    });
  }

  const count = draft.length;
  const valid = isNumber ? num.trim() !== '' && !Number.isNaN(Number(num)) : noneChosen || (count >= Math.max(1, q.min_selections) && count <= q.max_selections);
  const unchanged = isNumber
    ? q.mine?.number_value != null && Number(num) === Number(q.mine.number_value)
    : saved.length === draft.length && saved.every((x, i) => (isOrdered ? draft[i] === x : draft.includes(x)));
  const names = isNumber ? num : optionLabels(q, draft).join(', ');
  const closeTxt = fmtDayDateTime(q.closes_at);

  async function doSubmit() {
    try {
      await submit.mutateAsync({ questionId: q!.id, optionIds: isNumber ? [] : draft, number: isNumber ? Number(num) : null });
      setConfirm(false);
      toast({ tone: 'success', title: 'Prono enregistré', message: `${q!.title} · ${names}` });
      navigate(`/pronos?tab=${tab}`);
    } catch (e) {
      setConfirm(false);
      const code = errorCode(e);
      const ex = explainError(e);
      if (code === 'QUESTION_LOCKED') {
        toast({ tone: 'error', title: 'Prono verrouillé', message: 'La clôture est passée : ta réponse précédente est conservée.' });
        game.refetch();
      } else if (!code) {
        toast({ tone: 'error', title: 'Ton prono n’est pas enregistré', message: 'On réessaie ?', action: { label: 'Réessayer', onClick: () => doSubmit() } });
      } else {
        toast({ tone: 'error', title: ex.title, message: ex.message });
      }
    }
  }

  const metaOf = (o: QuestionOption) => {
    if (published && correct.includes(o.id)) return 'Bonne réponse';
    if (draft.includes(o.id)) return isOrdered ? `Mon choix · ${draft.indexOf(o.id) + 1}` : 'Mon choix';
    const c = o.candidate_id ? candById.get(o.candidate_id) : null;
    return c ? STATUS_LABEL[c.status]?.[0] : undefined;
  };
  const badge = locked
    ? { label: q.status === 'cancelled' ? 'Annulé' : published ? 'Résultat publié' : 'Verrouillé', tone: published ? 'gold' : 'closed', icon: 'lock' }
    : { label: answered(q) ? 'Joué' : 'Ouvert', tone: answered(q) ? 'magenta' : 'open', icon: null };
  const trayLabel = q.key === 'tour' ? 'MA SÉLECTION POUR LA TOURNÉE' : q.key === 'finalists' ? 'MES FINALISTES' : q.key === 'couple' ? 'MON COUPLE' : /nomm/i.test(q.title) ? `MES ${q.max_selections} NOMMÉS` : isOrdered ? 'MON CLASSEMENT' : 'MA SÉLECTION';
  const bottomPad = locked ? 150 : 190;

  return (
    <>
      <div className="flex items-center justify-between px-5 py-1 pt-3">
        <IconButton icon="arrow-left" label="Retour" onClick={back} />
        <Badge tone={badge.tone as 'open'} icon={badge.icon}>{badge.label}</Badge>
      </div>
      <main className="flex flex-col gap-5 px-5 pt-2.5" style={{ paddingBottom: bottomPad }}>
        <div className="flex flex-col gap-2.5">
          <Overline>{q.category === 'grand' ? 'GRAND PRONO DE LA SAISON' : q.category === 'fun' ? `PRIME ${prime?.number ?? ''} · PARI IMPROBABLE` : `PRIME ${prime?.number ?? ''} · PRONO DE LA SEMAINE`}</Overline>
          <h1 className="t-h1 m-0 text-pretty">{q.title}</h1>
          {q.description && <span className="t-body-s text-pretty text-secondary">{q.description}</span>}
          <div className="flex flex-wrap items-center gap-3">
            <PointsChip value={String(q.points)} suffix={pointsSuffix(q)} tone="gold" icon="star" />
            {q.bonus_points > 0 && <PointsChip value={`+${q.bonus_points}`} suffix="bonus" tone="gold" icon="sparkles" />}
            <span className="t-caption inline-flex items-center gap-1.5 text-muted">
              <Icon name="clock" size={13} />
              {locked ? 'Clôturé' : `Clôture ${closeTxt} (heure de Paris)`}
            </span>
          </div>
          {q.validation_criteria && (
            <span className="t-caption flex gap-2 text-muted"><Icon name="scale" size={13} style={{ marginTop: 1 }} /><span>Validé si : {q.validation_criteria}</span></span>
          )}
        </div>

        {published && (
          <div className="flex items-center gap-3 rounded-md px-4 py-3.5" style={{ background: (q.myPoints ?? 0) > 0 ? 'rgba(47,217,154,.1)' : 'var(--surface-card)', boxShadow: `inset 0 0 0 1px ${(q.myPoints ?? 0) > 0 ? 'rgba(47,217,154,.4)' : 'var(--border-subtle)'}` }}>
            <Icon name={(q.myPoints ?? 0) > 0 ? 'circle-check' : 'flag'} size={20} style={{ color: (q.myPoints ?? 0) > 0 ? 'var(--green-500)' : 'var(--text-secondary)' }} />
            <div className="flex flex-1 flex-col">
              <span className="t-body font-bold">{isNumber ? `Résultat officiel : ${q.result?.number_value}` : `Résultat officiel : ${optionLabels(q, correct).join(', ')}`}</span>
              <span className="t-caption text-secondary">{(q.myPoints ?? 0) > 0 ? 'Bien vu !' : answered(q) ? 'Pas de points cette fois.' : 'Tu n’avais pas répondu.'}</span>
            </div>
            <PointsChip value={q.myPoints ?? 0} />
          </div>
        )}
        {q.status === 'cancelled' && <EmptyState icon="ban" title="Question annulée" message={`${q.cancelled_reason ?? ''} Aucun point n’est attribué.`} />}

        {tray && (
          <div className="card-plain flex flex-col gap-3.5 p-4">
            <div className="flex items-baseline justify-between">
              <Overline>{trayLabel}</Overline>
              <span style={{ font: 'italic 800 17px var(--font-numeric)' }}>{noneChosen ? '—' : `${count} / ${q.max_selections}`}</span>
            </div>
            {noneChosen ? (
              <span className="t-body-s text-secondary">Aucun couple confirmé</span>
            ) : (
              <div className="grid grid-cols-4 justify-items-center gap-x-2 gap-y-3">
                {Array.from({ length: q.max_selections }, (_, i) => {
                  const o = q.options.find((x) => x.id === draft[i]);
                  const c = o?.candidate_id ? candById.get(o.candidate_id) : null;
                  return (
                    <div key={i} className="flex w-16 flex-col items-center gap-1">
                      {o ? <Avatar name={o.label} src={c?.photo_url} size={44} /> : (
                        <span className="flex h-11 w-11 items-center justify-center rounded-full text-muted" style={{ boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.22)', font: 'italic 700 14px var(--font-numeric)' }}>{i + 1}</span>
                      )}
                      <span className="t-caption max-w-16 truncate text-secondary">{o?.label ?? '—'}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <ProgressBar value={noneChosen ? q.max_selections : count} max={q.max_selections} />
          </div>
        )}

        {isNumber ? (
          <Input label="Ta réponse" type="number" inputMode="numeric" value={num} disabled={locked} onChange={(e) => setNum(e.target.value)} placeholder="Ex. 4" />
        ) : (
          <>
            {candidateOpts.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5">
                {candidateOpts.map((o) => {
                  const c = o.candidate_id ? candById.get(o.candidate_id) : null;
                  const out = !locked && c?.status === 'eliminated' && q.options_source !== 'candidates_all';
                  return (
                    <CandidateCard key={o.id} name={o.label} photo={c?.photo_url} meta={metaOf(o)} selected={draft.includes(o.id)} eliminated={out} disabled={locked} onSelect={() => toggle(o)} size={candidateOpts.length > 6 ? 56 : 72} />
                  );
                })}
              </div>
            )}
            {(textOpts.length > 0 || noneOpt) && (
              <div className="flex flex-col gap-2">
                {[...textOpts, ...(noneOpt ? [noneOpt] : [])].map((o) => {
                  const on = draft.includes(o.id);
                  return (
                    <button key={o.id} type="button" disabled={locked} onClick={() => toggle(o)} aria-pressed={on}
                      className={'gp-cand flex-row justify-between px-4 py-3.5 text-left' + (on ? ' gp-cand--on' : '')} style={{ alignItems: 'center', cursor: locked ? 'default' : 'pointer' }}>
                      <span className="gp-cand__name">{o.label}</span>
                      {published && correct.includes(o.id) ? <Badge tone="open">Bonne réponse</Badge> : on ? <Icon name="circle-check" size={18} className="text-flare-400" /> : null}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Barre collante */}
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-app flex-col gap-2.5 px-5 pt-8" style={{ background: 'var(--grad-protect)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 34px)' }}>
        {!locked ? (
          <>
            <span className="t-body-s text-center text-secondary">
              {isNumber ? (num ? `Ta réponse : ${num}` : 'Saisis un nombre') : noneChosen ? 'Ton choix : aucun couple confirmé' : isMultiPerCorrect(q) || multi ? `${count} / ${q.max_selections} ${candidateOpts.length ? 'candidats sélectionnés' : 'choix'}` : count ? `Ton choix : ${names}` : 'Touche un candidat pour le choisir'}
            </span>
            <Button size="lg" block disabled={!valid || unchanged} onClick={() => setConfirm(true)}>{answered(q) ? 'Enregistrer mes modifications' : 'Valider mon prono'}</Button>
          </>
        ) : (
          <div className="flex items-center gap-3 rounded-md px-4 py-3.5" style={{ background: 'rgba(32,11,92,.92)', boxShadow: 'inset 0 0 0 1px var(--border-strong)' }}>
            <Icon name="lock" size={18} className="text-secondary" />
            <div className="flex flex-col">
              <span className="t-body-s font-bold">Prono verrouillé</span>
              <span className="t-caption text-muted">Clôturé le {fmtDateAt(q.closes_at)}. {answered(q) ? 'Ta réponse est conservée.' : 'Tu n’avais pas répondu.'}</span>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog open={confirm} title="Valider ton prono ?" confirmLabel="Je valide" cancelLabel="Modifier" loading={submit.isPending} onConfirm={doSubmit} onCancel={() => setConfirm(false)}>
        Tu choisis <b className="text-primary">{names}</b>. Tu pourras changer d’avis jusqu’à la clôture ({closeTxt}).
      </ConfirmDialog>
    </>
  );
}

