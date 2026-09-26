import { useNavigate, useParams } from 'react-router-dom';
import { useCandidates, useGame, usePickStats, usePrimes, useSeason } from '@/lib/queries';
import { fmtDayTime, fmtPct } from '@/lib/format';
import { Badge, Button, IconButton, Overline, ProgressBar, Skeleton, StatTile } from '@/components/ui/core';
import { Icon } from '@/components/ui/Icon';
import { PhotoFill, STATUS_LABEL } from '@/components/ui/game';
import { EmptyState } from '@/components/ui/feedback';

/** Fiche candidat : photo, présentation, nominations, résultats officiels, stats communautaires (questions verrouillées uniquement). */
export function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const season = useSeason();
  const cands = useCandidates(season.data?.id);
  const primes = usePrimes(season.data?.id);
  const stats = usePickStats(season.data?.id);
  const game = useGame(season.data?.id);
  const c = cands.data?.find((x) => x.id === id);

  if (cands.isLoading) return <main className="flex flex-col gap-4"><Skeleton h={400} style={{ borderRadius: 0 }} /><div className="px-5"><Skeleton h={120} /></div></main>;
  if (!c) return <main className="px-5 pt-16"><EmptyState icon="users" title="Candidat introuvable" action={<Button size="sm" variant="secondary" onClick={() => navigate('/candidats')}>Tous les candidats</Button>} /></main>;

  const [statusLbl, tone] = STATUS_LABEL[c.status] ?? STATUS_LABEL.competing;
  const out = c.status === 'eliminated';
  const outPrime = primes.data?.find((p) => p.id === c.eliminated_prime_id);
  // Semaines : primes auxquels le candidat a participé (jusqu'à son élimination)
  const weeks = (primes.data ?? []).filter((p) => new Date(p.airs_at).getTime() <= Date.now() + 7 * 86400_000 && (!outPrime || p.number <= outPrime.number));
  const weeksPlayed = c.eligible.length || weeks.filter((p) => new Date(p.airs_at).getTime() <= Date.now()).length;
  const meta = [c.age ? `${c.age} ans` : null, c.city, out && outPrime ? `éliminé·e au prime ${outPrime.number}` : null].filter(Boolean).join(' · ');

  const hist = (primes.data ?? []).filter((p) => p.number <= Math.max(weeks.length, 1)).map((p) => ({
    p,
    nominated: c.nominations.includes(p.id),
    gone: !!outPrime && p.number > outPrime.number,
  }));
  const results = hist.filter((h) => h.nominated).reverse().map((h) => ({
    t: `Semaine ${h.p.number}`,
    d: outPrime?.id === h.p.id ? 'Nommé·e, éliminé·e' : h.p.closed_at || new Date(h.p.airs_at).getTime() < Date.now() ? 'Nommé·e, sauvé·e' : `Nommé·e · verdict ${fmtDayTime(h.p.airs_at)}`,
  }));
  if (c.on_tour) results.unshift({ t: 'Tournée', d: 'Qualifié·e' });
  if (c.status === 'finalist' || c.status === 'winner') results.unshift({ t: 'Finale', d: c.status === 'winner' ? 'Vainqueur de la saison' : 'Finaliste' });

  const comm = (stats.data ?? []).filter((s) => s.candidate_id === c.id && s.answers > 0);
  const labelOf = (s: { key: string | null; title: string; category: string; prime_id: string | null }) => {
    const pn = primes.data?.find((p) => p.id === s.prime_id)?.number;
    if (s.key === 'winner') return 'Vainqueur · grands pronos';
    if (s.key === 'tour') return 'Tournée · grands pronos';
    if (s.category === 'grand') return `${s.title} · grands pronos`;
    return `${s.title.replace(/ \?$/, '')} · prime ${pn ?? ''}`;
  };
  // Questions encore ouvertes qui portent sur ce candidat : stats cachées jusqu'à la clôture
  const hidden = (game.data?.questions ?? []).filter((q) => !q.locked && q.options.some((o) => o.candidate_id === c.id)).sort((a, b) => +new Date(a.closes_at) - +new Date(b.closes_at));

  return (
    <>
      <div className="relative h-[400px]">
        <PhotoFill name={c.first_name} src={c.photo_url} out={out} />
        {!c.photo_url && <span className="absolute inset-x-0 top-[70px] text-center text-white/[.18]" style={{ font: 'italic 900 180px/1 var(--font-display)' }} aria-hidden="true">{c.first_name[0]}</span>}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(13,3,34,.35) 0%,rgba(13,3,34,0) 25%,rgba(13,3,34,.2) 50%,#0d0322 100%)' }} />
        <div className="relative px-5 pt-3">
          <IconButton icon="arrow-left" label="Retour" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/candidats'))} />
        </div>
        <div className="absolute inset-x-5 bottom-[18px] flex flex-col gap-2.5">
          <div className="flex gap-2">
            <Badge tone={tone}>{statusLbl}</Badge>
            {c.on_tour && <Badge tone="gold" icon="ticket">Tournée</Badge>}
          </div>
          <h1 className="m-0" style={{ font: 'italic 900 44px/1 var(--font-display)', letterSpacing: '-.015em' }}>{c.first_name}{c.last_name ? ` ${c.last_name}` : ''}</h1>
          {meta && <span className="t-body-s text-secondary">{meta}</span>}
        </div>
      </div>
      <main className="flex flex-col gap-[26px] px-5 pb-[60px] pt-2">
        {c.bio && <p className="t-body-l m-0 text-pretty text-secondary">{c.bio}</p>}
        <div className="grid grid-cols-3 gap-2.5">
          <StatTile value={c.nominations.length} label="Nominations" />
          <StatTile value={weeksPlayed} label="Semaines" />
          <StatTile value={c.on_tour ? 'Qualifié·e' : c.on_tour === false ? 'Non' : 'À venir'} label="Tournée" valueStyle={{ fontSize: 17, lineHeight: '28px' }} />
        </div>

        {hist.length > 0 && (
          <section className="flex flex-col gap-3">
            <Overline>HISTORIQUE DES NOMINATIONS</Overline>
            <div className="card-plain flex justify-between px-4 py-3.5">
              {hist.slice(0, 10).map((h) => (
                <div key={h.p.id} className="flex flex-col items-center gap-1.5">
                  <span className="h-7 w-7 rounded-full" style={{
                    background: h.nominated ? 'rgba(210,67,230,.3)' : 'rgba(255,255,255,.06)',
                    boxShadow: h.nominated ? 'inset 0 0 0 1.5px #e679f2' : 'inset 0 0 0 1px rgba(255,255,255,.1)',
                    opacity: h.gone ? 0.25 : 1,
                  }} aria-label={`Semaine ${h.p.number} : ${h.nominated ? 'nommé·e' : 'pas nommé·e'}`} />
                  <span className="t-caption text-muted">S{h.p.number}</span>
                </div>
              ))}
            </div>
            <span className="t-caption flex items-center gap-2 text-muted">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'rgba(210,67,230,.3)', boxShadow: 'inset 0 0 0 1.5px var(--magenta-400)' }} />
              Semaine nommé·e · une semaine = une nomination
            </span>
          </section>
        )}

        {results.length > 0 && (
          <section className="flex flex-col gap-3">
            <Overline>RÉSULTATS OFFICIELS</Overline>
            <div className="card-plain row-sep flex flex-col">
              {results.map((r, i) => (
                <div key={i} className="t-body-s flex justify-between gap-3 px-4 py-3">
                  <span className="font-bold">{r.t}</span>
                  <span className="text-secondary">{r.d}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="flex flex-col gap-3">
          <Overline>CE QU’EN PENSE LA COMMUNAUTÉ</Overline>
          <div className="card-plain flex flex-col gap-4 p-4">
            {comm.length === 0 && !hidden.length && <span className="t-body-s text-muted">Pas encore de statistiques.</span>}
            {comm.slice(0, 5).map((s) => <ProgressBar key={s.question_id} tone="cyan" value={s.pct} label={labelOf(s)} valueLabel={fmtPct(s.pct)} />)}
            {hidden.slice(0, 2).map((q) => (
              <div key={q.id} className="t-caption flex items-center gap-2.5 border-t border-subtle pt-3 text-muted first:border-t-0 first:pt-0">
                <Icon name="lock" size={14} />
                {q.title.replace(/ \?$/, '')} : visible après la clôture ({fmtDayTime(q.closes_at)}).
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
