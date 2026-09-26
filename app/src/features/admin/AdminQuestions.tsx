import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { currentPrime, usePrimes, useSeason } from '@/lib/queries';
import { explainError } from '@/lib/errors';
import { fmtDayTime, fromParisInput, toParisInput } from '@/lib/format';
import type { OptionsSource, QuestionCategory, QuestionType } from '@/lib/types';
import { Badge, Button, Input, Overline, SegmentedControl, TextArea } from '@/components/ui/core';
import { Icon } from '@/components/ui/Icon';
import { ConfirmDialog, Dialog, useToast } from '@/components/ui/feedback';
import { AdminPage } from './AdminApp';
import { useAdminQuestions, useAdminRefresh, type AdminQuestion } from './data';
import { Q_STATUS, effectiveStatus } from './AdminDashboard';

const TYPES: { value: QuestionType; label: string }[] = [
  { value: 'single', label: 'Réponse unique' }, { value: 'multiple', label: 'Réponses multiples' }, { value: 'yes_no', label: 'Oui / Non' },
  { value: 'exact_number', label: 'Nombre exact' }, { value: 'ordered', label: 'Sélection ordonnée' },
];
const SOURCES: { value: OptionsSource; label: string }[] = [
  { value: 'candidates_competing', label: 'Candidats en compétition' }, { value: 'candidates_nominated', label: 'Nommés' },
  { value: 'candidates_all', label: 'Tous les candidats' }, { value: 'custom', label: 'Liste libre' },
];
const ICONS = ['flame', 'users', 'medal', 'shield', 'star', 'sparkles', 'heart', 'crown', 'zap', 'ticket', 'flag'];

interface Form {
  id?: string; status?: string; type: QuestionType; title: string; description: string; prime_id: string; category: QuestionCategory; points: string; bonus: string;
  min: string; max: string; closes: string; source: OptionsSource; options: string; criteria: string; icon: string; none: boolean;
}

const blank = (primeId: string, closes: string): Form => ({
  type: 'single', title: '', description: '', prime_id: primeId, category: 'weekly', points: '20', bonus: '0', min: '1', max: '1', closes,
  source: 'candidates_competing', options: '', criteria: '', icon: 'sparkles', none: false,
});

export function AdminQuestions() {
  const [params, setParams] = useSearchParams();
  const season = useSeason();
  const sid = season.data?.id;
  const primes = usePrimes(sid);
  const qs = useAdminQuestions(sid);
  const toast = useToast();
  const refresh = useAdminRefresh();
  const cur = currentPrime(primes.data);
  const [filter, setFilter] = useState<string>('current');
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);
  const [cancel, setCancel] = useState<AdminQuestion | null>(null);
  const [reason, setReason] = useState('');

  const defaultClose = cur ? toParisInput(new Date(new Date(cur.airs_at).getTime() - 70 * 60_000)) : '';
  useEffect(() => {
    if (params.get('nouvelle') && cur && !form) {
      setForm(blank(cur.id, defaultClose));
      setParams({}, { replace: true });
    }
  }, [params, cur, form, defaultClose, setParams]);

  const list = (qs.data ?? []).filter((q) => filter === 'all' || (filter === 'grand' ? q.category === 'grand' : q.prime_id === (filter === 'current' ? cur?.id : filter)));

  function fromQuestion(q: AdminQuestion, duplicate = false): Form {
    const nextPrime = duplicate ? primes.data?.find((p) => p.number === (primes.data?.find((x) => x.id === q.prime_id)?.number ?? 0) + 1) ?? cur : null;
    return {
      id: duplicate ? undefined : q.id, status: duplicate ? undefined : q.status, type: q.type, title: q.title, description: q.description ?? '',
      prime_id: (duplicate ? nextPrime?.id : q.prime_id) ?? '', category: q.category, points: String(q.points), bonus: String(q.bonus_points),
      min: String(q.min_selections), max: String(q.max_selections),
      closes: duplicate && nextPrime ? toParisInput(new Date(new Date(nextPrime.airs_at).getTime() - 70 * 60_000)) : toParisInput(q.closes_at),
      source: q.options_source === 'yes_no' ? 'custom' : q.options_source, options: q.options.filter((o) => !o.candidate_id && !o.is_none_option).map((o) => o.label).join('\n'),
      criteria: q.validation_criteria ?? '', icon: q.icon, none: q.options.some((o) => o.is_none_option),
    };
  }

  async function save(status: 'draft' | 'open') {
    if (!form || !sid) return;
    const draftLike = !form.id || form.status === 'draft';
    const type = form.type;
    const payload: Record<string, unknown> = {
      id: form.id, season_id: sid, prime_id: form.category === 'grand' ? null : form.prime_id, category: form.category, type, title: form.title,
      description: form.description, validation_criteria: form.criteria, icon: form.icon,
      options_source: type === 'yes_no' ? 'yes_no' : type === 'exact_number' ? 'custom' : form.source,
      min_selections: type === 'multiple' || type === 'ordered' ? Number(form.min) : 1,
      max_selections: type === 'multiple' || type === 'ordered' ? Number(form.max) : 1,
      points: Number(form.points), bonus_points: Number(form.bonus || 0),
      scoring: type === 'exact_number' ? 'exact_number' : type === 'ordered' ? 'ordered_positions' : 'per_correct',
      closes_at: form.closes ? fromParisInput(form.closes) : null, status: draftLike ? status : undefined, with_none_option: form.none,
    };
    if (form.source === 'custom' && type !== 'yes_no' && type !== 'exact_number') payload.options = form.options.split('\n').map((s) => s.trim()).filter(Boolean);
    if (!form.closes) return toast({ tone: 'error', title: 'Clôture manquante', message: 'Choisis une date de clôture (heure de Paris).' });
    setBusy(true);
    const { error } = await supabase.rpc('admin_save_question', { p: payload });
    setBusy(false);
    if (error) return toast({ tone: 'error', ...explainError(error) });
    toast({ tone: 'success', title: status === 'open' && draftLike ? 'Question publiée' : form.id ? 'Question mise à jour' : 'Brouillon enregistré', message: 'Enregistré dans le journal.' });
    setForm(null);
    refresh();
  }

  async function doCancel() {
    if (!cancel) return;
    const { error } = await supabase.rpc('cancel_question', { p_question: cancel.id, p_reason: reason });
    if (error) return toast({ tone: 'error', ...explainError(error) });
    toast({ tone: 'success', title: 'Question annulée', message: 'Aucun point n’est attribué. Enregistré dans le journal.' });
    setCancel(null);
    setReason('');
    refresh();
  }

  const frozen = !!form?.id && form.status !== 'draft';
  const f = form;

  return (
    <AdminPage
      title="Questions"
      sub="Chaque règle est fixée avant l’ouverture. Une question annulée n’attribue aucun point."
      actions={<Button icon="plus" onClick={() => setForm(blank(cur?.id ?? '', defaultClose))}>Nouvelle question</Button>}
    >
      <div className="flex flex-wrap gap-2">
        {[{ v: 'current', l: cur ? `Prime ${cur.number} (en cours)` : 'Prime en cours' }, ...(primes.data ?? []).filter((p) => p.id !== cur?.id).map((p) => ({ v: p.id, l: `Prime ${p.number}` })), { v: 'grand', l: 'Grands pronos' }, { v: 'all', l: 'Toutes' }].map((o) => (
          <button key={o.v} type="button" onClick={() => setFilter(o.v)} className={'gp-seg__opt flex-none rounded-full' + (filter === o.v ? ' gp-seg__opt--on' : '')}
            style={filter === o.v ? { height: 34 } : { height: 34, background: 'rgba(255,255,255,.06)', boxShadow: 'inset 0 0 0 1px var(--border-subtle)' }}>{o.l}</button>
        ))}
      </div>

      <div className="flex flex-col rounded-md bg-card shadow-subtle">
        {list.length === 0 && <div className="t-body-s px-4 py-4 text-muted">Aucune question ici. Crée-la, ou duplique celles du prime précédent.</div>}
        {list.map((q) => {
          const st = Q_STATUS[effectiveStatus(q)];
          const pn = primes.data?.find((p) => p.id === q.prime_id)?.number;
          return (
            <div key={q.id} className="flex min-h-14 items-center gap-3.5 border-b border-subtle px-4 py-2 last:border-b-0">
              <Icon name={q.icon} size={16} className="text-muted" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="t-body-s font-bold">{q.title}</span>
                <span className="t-caption text-muted">
                  {q.category === 'grand' ? 'Grand prono' : q.category === 'fun' ? `Pari improbable · prime ${pn}` : `Prime ${pn}`} · {TYPES.find((t) => t.value === q.type)?.label} · {q.points} pts{q.max_selections > 1 && q.scoring !== 'all_or_nothing' ? ' / bonne réponse' : ''}{q.bonus_points ? ` + ${q.bonus_points} bonus` : ''} · clôture {fmtDayTime(q.closes_at)} · {q.answers} réponse{q.answers > 1 ? 's' : ''}
                  {q.status === 'cancelled' && q.cancelled_reason ? ` · ${q.cancelled_reason}` : ''}
                </span>
              </div>
              <Badge tone={st[1]}>{st[0]}</Badge>
              <div className="flex flex-none gap-1">
                {q.status === 'draft' && <Button size="sm" variant="secondary" icon="send" onClick={async () => {
                  const { error } = await supabase.rpc('open_question', { p_question: q.id });
                  if (error) return toast({ tone: 'error', ...explainError(error) });
                  toast({ tone: 'success', title: 'Question publiée', message: 'Les joueurs sont notifiés.' });
                  refresh();
                }}>Ouvrir</Button>}
                {q.status !== 'cancelled' && q.status !== 'published' && <Button size="sm" variant="ghost" icon="pencil" onClick={() => setForm(fromQuestion(q))}>{q.status === 'draft' ? 'Modifier' : 'Clôture'}</Button>}
                {q.category !== 'grand' && <Button size="sm" variant="ghost" icon="copy" onClick={() => setForm(fromQuestion(q, true))}>Dupliquer</Button>}
                {q.status !== 'cancelled' && <Button size="sm" variant="ghost" icon="ban" onClick={() => { setCancel(q); setReason(''); }}>Annuler</Button>}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!f} title={f?.id ? (frozen ? 'Question ouverte' : 'Modifier la question') : 'Nouvelle question'} onClose={busy ? undefined : () => setForm(null)} width={500}
        actions={f && (frozen ? <>
          <Button block icon="check" loading={busy} onClick={() => save('open')}>Enregistrer</Button>
          <Button block variant="ghost" onClick={() => setForm(null)}>Fermer</Button>
        </> : <>
          <Button block icon="send" disabled={!f.title.trim()} loading={busy} onClick={() => save('open')}>Publier la question</Button>
          <Button block variant="secondary" disabled={!f.title.trim()} loading={busy} onClick={() => save('draft')}>Brouillon</Button>
        </>)}>
        {f && (
          <div className="flex max-h-[62vh] w-full flex-col gap-4 overflow-auto pr-1">
            {frozen && <span className="t-caption text-muted">Question ouverte : barème, type et règle sont figés. Seuls l’intitulé, la description et la clôture restent modifiables. Pour le reste, annule-la.</span>}
            {!frozen && (
              <div className="flex flex-col gap-1.5">
                <span className="gp-field__label">Type</span>
                <div className="gp-seg flex-wrap" style={{ borderRadius: 20 }}>
                  {TYPES.map((t) => (
                    <button key={t.value} type="button" className={'gp-seg__opt' + (f.type === t.value ? ' gp-seg__opt--on' : '')} style={{ flex: 'none', height: 34, padding: '0 12px' }}
                      onClick={() => setForm({ ...f, type: t.value, max: t.value === 'multiple' ? '3' : t.value === 'ordered' ? '3' : '1', min: t.value === 'multiple' ? '3' : t.value === 'ordered' ? '3' : '1' })}>{t.label}</button>
                  ))}
                </div>
              </div>
            )}
            <Input label="Intitulé" value={f.title} onChange={(e) => setForm({ ...f, title: e.target.value })} placeholder="Ex. Qui sera éliminé au prime 7 ?" />
            <Input label="Description (facultatif)" value={f.description} onChange={(e) => setForm({ ...f, description: e.target.value })} />
            {!frozen && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <label className="gp-field">
                    <span className="gp-field__label">Prime</span>
                    <select className="gp-field__control text-primary" value={f.category === 'grand' ? 'grand' : f.prime_id} onChange={(e) => setForm(e.target.value === 'grand' ? { ...f, category: 'grand' } : { ...f, prime_id: e.target.value, category: f.category === 'grand' ? 'weekly' : f.category })}>
                      {(primes.data ?? []).map((p) => <option key={p.id} value={p.id}>Prime {p.number}</option>)}
                      <option value="grand">Grand prono (saison)</option>
                    </select>
                  </label>
                  <div className="flex flex-col gap-1.5">
                    <span className="gp-field__label">Catégorie</span>
                    <SegmentedControl<QuestionCategory> value={f.category === 'grand' ? 'weekly' : f.category} onChange={(v) => f.category !== 'grand' && setForm({ ...f, category: v })}
                      options={[{ value: 'weekly', label: 'Hebdo' }, { value: 'fun', label: 'Improbable' }]} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label={f.type === 'multiple' || f.type === 'ordered' ? 'Points par bonne réponse' : 'Points'} type="number" min={0} value={f.points} onChange={(e) => setForm({ ...f, points: e.target.value })} />
                  <Input label="Bonus (tout trouvé)" type="number" min={0} value={f.bonus} disabled={f.type !== 'multiple'} onChange={(e) => setForm({ ...f, bonus: e.target.value })} />
                </div>
                {(f.type === 'multiple' || f.type === 'ordered') && (
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Sélections min." type="number" min={1} value={f.min} onChange={(e) => setForm({ ...f, min: e.target.value })} />
                    <Input label="Sélections max." type="number" min={1} value={f.max} onChange={(e) => setForm({ ...f, max: e.target.value })} />
                  </div>
                )}
              </>
            )}
            <Input label="Clôture" type="datetime-local" value={f.closes} onChange={(e) => setForm({ ...f, closes: e.target.value })} hint="Heure de Paris. Chaque question a sa propre clôture." />
            {!frozen && f.type !== 'yes_no' && f.type !== 'exact_number' && (
              <div className="flex flex-col gap-1.5">
                <span className="gp-field__label">Réponses possibles</span>
                <div className="flex flex-wrap gap-1.5">
                  {SOURCES.map((s) => (
                    <button key={s.value} type="button" onClick={() => setForm({ ...f, source: s.value })} className="border-0 bg-transparent p-0">
                      <Badge tone={f.source === s.value ? 'magenta' : 'neutral'}>{s.label}</Badge>
                    </button>
                  ))}
                </div>
                {f.source === 'custom' && <TextArea value={f.options} onChange={(e) => setForm({ ...f, options: e.target.value })} placeholder={'Une réponse par ligne\n1 – 2\n3 – 4\n5 et +'} />}
                {f.source !== 'custom' && f.max === '2' && f.type === 'multiple' && (
                  <label className="t-body-s flex items-center gap-2 text-secondary"><input type="checkbox" checked={f.none} onChange={(e) => setForm({ ...f, none: e.target.checked })} /> Ajouter l’option « Aucun couple confirmé »</label>
                )}
              </div>
            )}
            {!frozen && (
              <>
                <TextArea label="Règle de validation" value={f.criteria} onChange={(e) => setForm({ ...f, criteria: e.target.value })} hint="Obligatoire pour publier : critère objectif, fixé avant l’ouverture." placeholder="Ex. Le candidat nommé qui quitte officiellement le château à l’issue du prime. Égalités acceptées." />
                <div className="flex flex-col gap-1.5">
                  <span className="gp-field__label">Icône</span>
                  <div className="flex flex-wrap gap-1.5">
                    {ICONS.map((i) => (
                      <button key={i} type="button" aria-label={i} onClick={() => setForm({ ...f, icon: i })} className="flex h-9 w-9 items-center justify-center rounded-full border-0"
                        style={{ background: f.icon === i ? 'var(--grad-glitter)' : 'rgba(255,255,255,.06)', color: f.icon === i ? 'var(--text-inverse)' : 'var(--text-secondary)' }}>
                        <Icon name={i} size={16} />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <Overline className="text-muted">{f.type === 'multiple' ? 'Points par candidat trouvé ; bonus seulement si toute la liste officielle est trouvée.' : f.type === 'ordered' ? 'Points par position exacte.' : f.type === 'exact_number' ? 'Points si le nombre est exactement égal.' : 'Égalités officielles : toutes les bonnes réponses comptent.'}</Overline>
          </div>
        )}
      </Dialog>

      <ConfirmDialog open={!!cancel} danger title="Annuler la question ?" confirmLabel="Annuler la question" cancelLabel="Retour" onCancel={() => setCancel(null)} onConfirm={doCancel}>
        <div className="flex flex-col gap-3">
          <span>« {cancel?.title} » n’attribuera aucun point, et les points déjà attribués seront retirés.</span>
          <Input label="Motif (obligatoire)" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex. Mécanique absente ce prime" />
        </div>
      </ConfirmDialog>
    </AdminPage>
  );
}
