import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { usePrimes, useSeason } from '@/lib/queries';
import { explainError } from '@/lib/errors';
import { fmtLong, fromParisInput, toParisInput } from '@/lib/format';
import { Badge, Button, Input, Overline, Switch } from '@/components/ui/core';
import { ConfirmDialog, useToast } from '@/components/ui/feedback';
import { AdminPage, Table, Tr } from './AdminApp';
import { useAdminQuestions, useAdminRefresh } from './data';
import { Q_STATUS, effectiveStatus } from './AdminDashboard';

const card = 'flex flex-col gap-3.5 rounded-lg bg-card p-5 shadow-subtle';

export function AdminSeason() {
  const season = useSeason();
  const toast = useToast();
  const refresh = useAdminRefresh();
  const s = season.data;
  const primes = usePrimes(s?.id);
  const qs = useAdminQuestions(s?.id);
  const grand = (qs.data ?? []).filter((q) => q.category === 'grand').sort((a, b) => a.sort_order - b.sort_order);

  const [f, setF] = useState({ name: 'Star Academy 2026', year: '2026', first: '', close: '', final: '', finalists: '2', tour: '8', least: '4' });
  const [pts, setPts] = useState<Record<string, { points: string; bonus: string }>>({});
  const [busy, setBusy] = useState(false);
  const [archive, setArchive] = useState(false);
  const [newPrime, setNewPrime] = useState({ at: '', final: false });

  useEffect(() => {
    if (!s) return;
    setF({ name: s.name, year: String(s.year), first: toParisInput(s.first_prime_at), close: toParisInput(s.grand_predictions_close_at), final: s.final_at ? toParisInput(s.final_at) : '', finalists: String(s.finalists_count), tour: String(s.tour_count), least: String(s.least_nominated_min_weeks) });
  }, [s]);
  useEffect(() => {
    setPts(Object.fromEntries(grand.map((q) => [q.id, { points: String(q.points), bonus: String(q.bonus_points) }])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs.data]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function run(fn: () => PromiseLike<{ error: unknown }>, ok: string) {
    setBusy(true);
    const { error } = await fn();
    setBusy(false);
    if (error) {
      toast({ tone: 'error', ...explainError(error) });
      return false;
    }
    toast({ tone: 'success', title: ok, message: 'Enregistré dans le journal.' });
    refresh();
    return true;
  }

  const payload = () => ({
    name: f.name.trim(), year: Number(f.year), first_prime_at: fromParisInput(f.first), grand_predictions_close_at: fromParisInput(f.close),
    final_at: f.final ? fromParisInput(f.final) : null, finalists_count: Number(f.finalists), tour_count: Number(f.tour), least_nominated_min_weeks: Number(f.least),
  });

  async function save() {
    if (!f.first || !f.close) return toast({ tone: 'error', title: 'Dates manquantes', message: 'Premier prime et clôture des grands pronos sont obligatoires.' });
    if (!s) {
      await run(() => supabase.from('seasons').insert({ ...payload(), is_current: true }), 'Saison créée');
      return;
    }
    const ok = await run(() => supabase.from('seasons').update(payload()).eq('id', s.id), 'Paramètres de saison enregistrés');
    if (!ok) return;
    // Barème des grands pronos encore en brouillon ; la clôture suit la date de la saison
    for (const q of grand.filter((x) => x.status === 'draft')) {
      const p = pts[q.id];
      const n = q.key === 'finalists' ? Number(f.finalists) : q.key === 'tour' ? Number(f.tour) : null;
      const sizing = n ? { min_selections: n, max_selections: n, title: q.key === 'finalists' ? `Les ${n} finalistes` : `Les ${n} de la tournée` } : {};
      const { error } = await supabase.from('questions').update({ points: Number(p.points), bonus_points: Number(p.bonus || 0), closes_at: fromParisInput(f.close), ...sizing }).eq('id', q.id);
      if (error) toast({ tone: 'error', ...explainError(error) });
    }
    refresh();
  }

  if (!s && !season.isLoading) {
    return (
      <AdminPage title="Créer la saison" sub="Commence par les dates : l’accueil passe automatiquement du mode avant-saison au mode saison.">
        <div className={card + ' max-w-[560px]'}>
          <Input label="Nom" value={f.name} onChange={set('name')} />
          <Input label="Année" type="number" value={f.year} onChange={set('year')} />
          <Input label="Premier prime (heure de Paris)" type="datetime-local" value={f.first} onChange={set('first')} />
          <Input label="Clôture des grands pronos (heure de Paris)" type="datetime-local" value={f.close} onChange={set('close')} />
          <Input label="Grande finale (heure de Paris)" type="datetime-local" value={f.final} onChange={set('final')} />
          <Button icon="check" onClick={save} loading={busy}>Créer la saison</Button>
        </div>
      </AdminPage>
    );
  }
  if (!s) return null;

  return (
    <AdminPage
      title={s.name}
      sub="Les saisons passées restent consultables. Leurs données ne sont jamais mélangées."
      actions={<>
        <Button variant="ghost" icon="archive" onClick={() => setArchive(true)}>Archiver la saison</Button>
        <Button icon="check" onClick={save} loading={busy}>Enregistrer</Button>
      </>}
    >
      <div className="grid grid-cols-2 items-start gap-5">
        <div className={card}>
          <Overline>DATES · HEURE DE PARIS</Overline>
          <Input label="Premier prime" type="datetime-local" value={f.first} onChange={set('first')} hint="L’accueil passe automatiquement du mode avant-saison au mode saison." />
          <Input label="Clôture des grands pronos" type="datetime-local" value={f.close} onChange={set('close')} hint="S’applique aux grands pronos encore en brouillon." />
          <Input label="Grande finale" type="datetime-local" value={f.final} onChange={set('final')} />
        </div>
        <div className={card}>
          <Overline>RÈGLES</Overline>
          <Input label="Nombre de finalistes" type="number" min={1} max={6} value={f.finalists} onChange={set('finalists')} />
          <Input label="Participants à la tournée" type="number" min={1} max={20} value={f.tour} onChange={set('tour')} />
          <Input label="Seuil « moins nommé » (semaines éligibles)" type="number" min={0} value={f.least} onChange={set('least')} />
          <span className="t-caption text-muted">À régler avant de générer les grands pronos : leur nombre de sélections en dépend.</span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <Overline>BARÈME DES GRANDS PRONOS</Overline>
          <div className="flex gap-2">
            {grand.length === 0 && <Button size="sm" icon="plus" onClick={() => run(() => supabase.rpc('admin_create_grand_questions', { p_season: s.id }), 'Grands pronos créés')}>Générer les 9 grands pronos</Button>}
            {grand.some((q) => q.status === 'draft') && (
              <Button size="sm" variant="secondary" icon="send" onClick={async () => {
                for (const q of grand.filter((x) => x.status === 'draft')) {
                  const { error } = await supabase.rpc('open_question', { p_question: q.id });
                  if (error) { toast({ tone: 'error', ...explainError(error) }); return; }
                }
                toast({ tone: 'success', title: 'Grands pronos ouverts', message: 'Les joueurs sont notifiés.' });
                refresh();
              }}>Ouvrir les grands pronos</Button>
            )}
          </div>
        </div>
        {grand.length === 0 ? (
          <span className="t-body-s text-muted">Ajoute d’abord les candidats, puis génère les grands pronos (barème initial modifiable tant qu’ils sont en brouillon).</span>
        ) : (
          <Table cols="minmax(0,1fr) 140px 110px 110px 130px" head={['QUESTION', 'STATUT', 'POINTS', 'BONUS', 'UNITÉ']}>
            {grand.map((q) => {
              const st = Q_STATUS[effectiveStatus(q)];
              const frozen = q.status !== 'draft';
              return (
                <Tr key={q.id} cols="minmax(0,1fr) 140px 110px 110px 130px">
                  <span className="font-bold">{q.title}</span>
                  <span><Badge tone={st[1]}>{st[0]}</Badge></span>
                  <NumInput value={pts[q.id]?.points ?? ''} disabled={frozen} onChange={(v) => setPts({ ...pts, [q.id]: { ...pts[q.id], points: v } })} />
                  <NumInput value={pts[q.id]?.bonus ?? ''} disabled={frozen || q.key !== 'tour'} onChange={(v) => setPts({ ...pts, [q.id]: { ...pts[q.id], bonus: v } })} />
                  <span className="text-muted">{q.max_selections > 1 && q.scoring === 'per_correct' ? 'pts / candidat' : 'pts'}</span>
                </Tr>
              );
            })}
          </Table>
        )}
        {grand.some((q) => q.status !== 'draft') && <span className="t-caption text-muted">Une fois ouverte, une question garde son barème : seule l’annulation reste possible.</span>}
      </div>

      <div className="flex flex-col gap-2.5">
        <Overline>PRIMES</Overline>
        <Table cols="90px minmax(0,1fr) 120px 160px" head={['N°', 'DATE (HEURE DE PARIS)', 'FINALE', 'SEMAINE']}>
          {(primes.data ?? []).map((p) => (
            <Tr key={p.id} cols="90px minmax(0,1fr) 120px 160px">
              <span className="t-num font-bold">Prime {p.number}</span>
              <span className="text-secondary">{fmtLong(p.airs_at)}</span>
              <span>{p.is_final ? <Badge tone="gold" icon="crown">Finale</Badge> : '—'}</span>
              <span>{p.closed_at ? <Badge tone="closed">Clôturée</Badge> : <Badge tone="open">En cours</Badge>}</span>
            </Tr>
          ))}
          <div className="flex items-end gap-3 border-t border-subtle px-4 py-3">
            <Input className="flex-1" label={`Ajouter le prime ${(primes.data?.length ?? 0) + 1}`} type="datetime-local" value={newPrime.at} onChange={(e) => setNewPrime({ ...newPrime, at: e.target.value })} />
            <div className="flex h-[52px] items-center"><Switch checked={newPrime.final} onChange={(v) => setNewPrime({ ...newPrime, final: v })} label="Grande finale" /></div>
            <Button icon="plus" disabled={!newPrime.at} onClick={async () => {
              const ok = await run(() => supabase.from('primes').insert({ season_id: s.id, number: (primes.data?.length ?? 0) + 1, airs_at: fromParisInput(newPrime.at), is_final: newPrime.final }), 'Prime ajouté');
              if (ok) setNewPrime({ at: '', final: false });
            }}>Ajouter</Button>
          </div>
        </Table>
      </div>

      <ConfirmDialog open={archive} danger title="Archiver la saison ?" confirmLabel="Archiver" onCancel={() => setArchive(false)}
        onConfirm={async () => { setArchive(false); await run(() => supabase.from('seasons').update({ archived_at: new Date().toISOString(), is_current: false }).eq('id', s.id), 'Saison archivée'); }}>
        Elle reste consultable en lecture seule. Tu pourras ensuite créer la saison suivante sans toucher à ses données.
      </ConfirmDialog>
    </AdminPage>
  );
}

function NumInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <input type="number" min={0} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full rounded-sm border-0 bg-white/[.06] px-3 text-primary shadow-subtle outline-none focus:shadow-glow-cyan disabled:opacity-50"
      style={{ font: 'italic 800 15px var(--font-numeric)' }} />
  );
}
