import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isDemoSeason, currentPrime, useGame, usePrimes, useSeason, useSubmitPrediction, type GameQuestion } from '@/lib/queries';
import { answered, maxPoints, needsAction, optionLabels, pickSummary, pointsSuffix, pronoStatus, staleNames } from '@/lib/game';
import { fmtClose, fmtDayDateTime, fmtLong, fmtNum, fmtShortDate } from '@/lib/format';
import { explainError } from '@/lib/errors';
import { Badge, IconCircle, PointsChip, ProgressBar, SegmentedControl, Skeleton } from '@/components/ui/core';
import { Icon } from '@/components/ui/Icon';
import { Countdown, PronoCard } from '@/components/ui/game';
import { EmptyState, ErrorState, useToast } from '@/components/ui/feedback';
import { Screen } from '@/app/MobileLayout';

type Tab = 'semaine' | 'saison';

export function PronosHub() {
  const [params, setParams] = useSearchParams();
  const season = useSeason();
  const primes = usePrimes(season.data?.id);
  const game = useGame(season.data?.id);
  const prime = currentPrime(primes.data);

  const all = game.data?.questions ?? [];
  const weekly = all.filter((q) => q.category === 'weekly' && q.prime_id === prime?.id);
  const grand = all.filter((q) => q.category === 'grand');
  const grandTodo = grand.filter(needsAction).length;
  const fun = all.filter((q) => q.category === 'fun' && q.prime_id === prime?.id);
  const weekTodo = [...weekly, ...fun].filter(needsAction).length;
  // Les pronos de la semaine d'abord ; sinon les grands pronos qui restent à jouer.
  // (L'ancien onglet « Improbables » est fusionné dans « Semaine ».)
  const asked = params.get('tab');
  const tab: Tab = asked === 'saison' ? 'saison' : asked ? 'semaine' : weekTodo === 0 && grandTodo > 0 ? 'saison' : 'semaine';

  return (
    <Screen gap={22}>
      <div className="flex items-center justify-between">
        <h1 className="t-h1 m-0">Pronostics</h1>
        {isDemoSeason(season.data) && <Badge>Démo</Badge>}
      </div>
      <SegmentedControl<Tab>
        value={tab}
        onChange={(v) => setParams({ tab: v }, { replace: true })}
        options={[{ value: 'semaine', label: <TabLabel label="Pronos de la semaine" n={weekTodo} /> }, { value: 'saison', label: <TabLabel label="Grands pronos" n={grandTodo} /> }]}
      />
      {game.isLoading || season.isLoading ? (
        <div className="flex flex-col gap-2.5"><Skeleton h={170} /><Skeleton h={112} /><Skeleton h={112} /></div>
      ) : game.isError ? (
        <ErrorState onRetry={() => game.refetch()} />
      ) : tab === 'semaine' ? (
        <WeekTab questions={weekly} fun={fun} primeNumber={prime?.number} airsAt={prime?.airs_at} onExpire={() => game.refetch()} />
      ) : (
        <SeasonTab questions={grand} closeAt={season.data?.grand_predictions_close_at} onExpire={() => game.refetch()} />
      )}
    </Screen>
  );
}

function TabLabel({ label, n }: { label: string; n: number }) {
  if (!n) return <>{label}</>;
  return (
    <span className="inline-flex items-center gap-1.5">
      {label}
      <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1" style={{ background: 'var(--grad-cta)', color: '#fff', font: '700 11px var(--font-body)' }}>{n}</span>
    </span>
  );
}

function WeekTab({ questions, fun, primeNumber, airsAt, onExpire }: { questions: GameQuestion[]; fun: GameQuestion[]; primeNumber?: number; airsAt?: string; onExpire: () => void }) {
  const navigate = useNavigate();
  if (!questions.length && !fun.length) {
    return <EmptyState icon="clock" title="Pas de pronos ouverts pour l’instant." message={primeNumber ? `Les questions du prime ${primeNumber} arrivent avec les nominations et la battle du top 3.` : 'Les prochaines questions arrivent bientôt.'} />;
  }
  const every = [...questions, ...fun];
  const open = every.filter((q) => !q.locked);
  const todo = open.filter(needsAction);
  const done = every.filter((q) => answered(q) && !q.stale).length;
  const nextClose = open.length ? open.reduce((m, q) => (q.closes_at < m ? q.closes_at : m), open[0].closes_at) : null;
  return (
    <>
      <div className="card-stage">
        <div className="absolute inset-0 opacity-30" style={{ background: 'url(/key-art.jpg) 70% 40% / cover' }} aria-hidden="true" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg,rgba(23,6,67,.95),rgba(23,6,67,.6))' }} />
        <div className="relative flex flex-col gap-3.5 p-[18px]">
          <div className="flex items-center justify-between">
            <Badge tone="gold">Prime {primeNumber}</Badge>
            {airsAt && <span className="t-caption text-secondary">{fmtLong(airsAt)}</span>}
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="t-body-s text-secondary">{nextClose ? 'Prochaine clôture dans' : 'Tous les pronos sont clôturés'}</span>
              {nextClose && <Countdown to={nextClose} size="sm" onDone={onExpire} />}
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="t-caption text-muted">En jeu</span>
              <span className="text-gold-400" style={{ font: 'italic 800 22px/1 var(--font-numeric)' }}>{fmtNum(todo.reduce((s, q) => s + maxPoints(q), 0))} pts</span>
            </div>
          </div>
          <ProgressBar value={done} max={every.length} label="Mes pronos validés" valueLabel={`${done} / ${every.length}`} />
        </div>
      </div>
      {questions.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {questions.map((q) => <QuestionCard key={q.id} q={q} onClick={() => navigate(`/pronos/${q.id}`)} />)}
        </div>
      )}
      {fun.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1 px-0.5 pt-2">
            <span className="gp-glitter-text pr-1" style={{ font: 'italic 900 24px/1.1 var(--font-display)' }}>{fun.length > 1 ? 'Les paris improbables' : 'Le pari improbable'}</span>
            <span className="t-body-s text-pretty text-secondary">Pour le fun, mais chaque critère est fixé avant l’ouverture. Pas de débat possible.</span>
          </div>
          {fun.map((q) => <FunCard key={q.id} q={q} />)}
        </div>
      )}
      <p className="t-caption m-0 text-pretty text-muted">Chaque question a sa propre heure de clôture, affichée à l’heure de Paris. Une fois clôturée, plus aucune modification n’est possible.</p>
    </>
  );
}

export function QuestionCard({ q, onClick, max = 3 }: { q: GameQuestion; onClick: () => void; max?: number }) {
  const st = pronoStatus(q);
  const pick = q.stale ? `${staleNames(q)} n’est plus en lice · à modifier` : pickSummary(q, max);
  return (
    <PronoCard
      question={q.title}
      status={st}
      icon={q.icon}
      points={st === 'won' ? q.myPoints : q.points}
      pointsSuffix={st === 'won' ? 'pts' : pointsSuffix(q)}
      pick={pick ?? (q.locked ? 'Aucune réponse' : null)}
      deadline={q.locked ? null : 'Ferme ' + fmtClose(q.closes_at)}
      onClick={onClick}
    />
  );
}

function SeasonTab({ questions, closeAt, onExpire }: { questions: GameQuestion[]; closeAt?: string; onExpire: () => void }) {
  const navigate = useNavigate();
  if (!questions.length) {
    return <EmptyState icon="crown" title="Les grands pronos arrivent bientôt" message="Ils ouvrent dès la révélation officielle des candidats." />;
  }
  const done = questions.filter((q) => answered(q) && !q.stale).length;
  const open = questions.filter((q) => !q.locked);
  const anyOpen = open.length > 0;
  const t = (q: GameQuestion) => new Date(q.closes_at).getTime();
  // Les grands pronos n'ont pas tous la même clôture (ex. « Le premier éliminé », fermé plus tôt ou relancé)
  const nextClose = anyOpen ? open.reduce((m, q) => (t(q) < t(m) ? q : m)).closes_at : closeAt;
  const lastClose = anyOpen ? open.reduce((m, q) => (t(q) > t(m) ? q : m)).closes_at : closeAt;
  const nextT = nextClose ? new Date(nextClose).getTime() : 0;
  const soon = open.filter((q) => t(q) === nextT);
  const late = open.filter((q) => t(q) > nextT);
  const titles = (qs: GameQuestion[]) => qs.map((q) => `« ${q.title} »`).join(', ');
  const sorted = [...questions].sort((a, b) => Number(a.locked) - Number(b.locked) || t(a) - t(b) || a.sort_order - b.sort_order);
  return (
    <>
      {anyOpen && nextClose ? (
        <div className="card-edge flex flex-col gap-3 p-[18px]">
          <span className="t-overline text-gold-200">{late.length ? 'PROCHAINE CLÔTURE DANS' : 'LES GRANDS PRONOS · CLÔTURE DANS'}</span>
          <Countdown to={nextClose} size="sm" onDone={onExpire} />
          {late.length > 0 ? (
            <span className="t-body-s text-pretty text-secondary">
              {soon.length <= late.length ? (
                <><b className="text-primary">{titles(soon)}</b> ferme{soon.length > 1 ? 'nt' : ''} le {fmtDayDateTime(nextClose)}. Les autres restent modifiables jusqu’au {fmtDayDateTime(lastClose!)}.</>
              ) : (
                <>{soon.length} grands pronos ferment le {fmtDayDateTime(nextClose)}. <b className="text-primary">{titles(late)}</b> reste{late.length > 1 ? 'nt' : ''} ouvert{late.length > 1 ? 's' : ''} jusqu’au {fmtDayDateTime(lastClose!)}.</>
              )}
              {' '}{done} / {questions.length} complétés.
            </span>
          ) : (
            <span className="t-body-s text-secondary">{done} / {questions.length} complétés · modifiables jusqu’au {fmtDayDateTime(nextClose)}.</span>
          )}
        </div>
      ) : (
        <div className="card-plain flex items-center gap-3.5 p-4">
          <IconCircle icon="lock" tone="muted" />
          <div className="flex flex-col">
            <span className="t-body font-bold">Verrouillés depuis le {fmtShortDate(closeAt ?? questions[0].closes_at)}</span>
            <span className="t-caption text-muted">{done} / {questions.length} complétés · points attribués au fil des résultats officiels.</span>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-2.5">
        {sorted.map((q) => <QuestionCard key={q.id} q={q} onClick={() => navigate(`/pronos/${q.id}`)} />)}
      </div>
    </>
  );
}

function FunCard({ q }: { q: GameQuestion }) {
  const toast = useToast();
  const submit = useSubmitPrediction();
  const [pending, setPending] = useState<string | null>(null);
  const st = pronoStatus(q);
  const labels: Record<string, [string, 'open' | 'magenta' | 'closed' | 'gold']> = {
    open: ['Ouvert', 'open'], done: ['Joué', 'magenta'], closed: ['Fermé', 'closed'], won: ['Gagné', 'gold'], cancelled: ['Annulé', 'closed'], pending: ['En attente', 'closed'], live: ['En direct', 'closed'],
  };
  const current = q.mine?.option_ids[0] ?? null;
  const correct = q.result?.correct_option_ids ?? [];

  async function pick(optionId: string) {
    if (q.locked || optionId === current || submit.isPending) return;
    setPending(optionId);
    try {
      await submit.mutateAsync({ questionId: q.id, optionIds: [optionId] });
      toast({ tone: 'success', title: 'Pari enregistré', message: `${q.title} · ${optionLabels(q, [optionId])[0]}` });
    } catch (e) {
      const ex = explainError(e);
      toast({ tone: 'error', title: ex.title === 'Oups' ? 'Ton prono n’est pas enregistré' : ex.title, message: ex.title === 'Oups' ? 'On réessaie ?' : ex.message, action: { label: 'Réessayer', onClick: () => pick(optionId) } });
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="card-plain flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <Badge tone={labels[st][1]}>{labels[st][0]}</Badge>
        <PointsChip value={st === 'won' ? q.myPoints ?? q.points : String(q.points)} tone={st === 'won' ? 'gain' : 'gold'} icon="sparkles" />
      </div>
      <span className="t-h3" style={{ fontSize: 17 }}>{q.title}</span>
      {q.validation_criteria && (
        <span className="t-caption flex gap-2 text-muted">
          <Icon name="scale" size={13} style={{ marginTop: 1 }} />
          <span>Validé si : {q.validation_criteria}</span>
        </span>
      )}
      <div className="gp-seg gp-seg--block" role="radiogroup" aria-label={q.title}>
        {q.options.map((o) => {
          const on = (pending ?? current) === o.id;
          const good = q.status === 'published' && correct.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={q.locked}
              className={'gp-seg__opt' + (on ? ' gp-seg__opt--on' : '')}
              style={{ ...(q.locked && !on ? { opacity: 0.55, cursor: 'default' } : null), ...(good ? { boxShadow: 'inset 0 0 0 1.5px var(--green-500)' } : null) }}
              onClick={() => pick(o.id)}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <span className="t-caption flex items-center gap-1.5 text-muted">
        <Icon name={q.locked ? 'lock' : 'clock'} size={13} />
        {q.status === 'cancelled' ? `Annulé · ${q.cancelled_reason ?? ''}` : q.locked ? (q.status === 'published' ? `Résultat : ${optionLabels(q, correct).join(', ')}` : 'Clôturé · résultat à venir') : 'Ferme ' + fmtClose(q.closes_at)}
      </span>
    </div>
  );
}
