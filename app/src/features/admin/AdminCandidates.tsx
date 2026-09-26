import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { currentPrime, useCandidates, usePrimes, useSeason, type CandidateFull } from '@/lib/queries';
import { explainError } from '@/lib/errors';
import type { CandidateStatus } from '@/lib/types';
import { Avatar, Badge, Button, Input, Overline, Switch, TextArea } from '@/components/ui/core';
import { STATUS_LABEL } from '@/components/ui/game';
import { Dialog, useToast } from '@/components/ui/feedback';
import { AdminPage, Table, Tr } from './AdminApp';
import { useAdminRefresh } from './data';

const COLS = 'minmax(0,1fr) 140px 110px 80px 330px';
const EMPTY = { id: '', first_name: '', last_name: '', age: '', city: '', bio: '', entered_at: '', photo_url: '' };

export function AdminCandidates() {
  const season = useSeason();
  const sid = season.data?.id;
  const cands = useCandidates(sid);
  const primes = usePrimes(sid);
  const toast = useToast();
  const refresh = useAdminRefresh();
  const cur = currentPrime(primes.data);
  const [primeId, setPrimeId] = useState<string | null>(null);
  const week = primes.data?.find((p) => p.id === primeId) ?? cur;
  const [edit, setEdit] = useState<typeof EMPTY | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function setStatus(c: CandidateFull, status: CandidateStatus) {
    const { error } = await supabase.rpc('admin_set_candidate_status', { p_candidate: c.id, p_status: status, p_prime: week?.id ?? null });
    if (error) return toast({ tone: 'error', ...explainError(error) });
    toast({ tone: 'success', title: `${c.first_name} : ${STATUS_LABEL[status][0]}`, message: 'Enregistré dans le journal.' });
    refresh();
  }
  async function setTour(c: CandidateFull, on: boolean) {
    const { error } = await supabase.rpc('admin_set_tour', { p_candidate: c.id, p_on: on });
    if (error) return toast({ tone: 'error', ...explainError(error) });
    toast({ tone: 'success', title: on ? `${c.first_name} qualifié·e pour la tournée` : `${c.first_name} retiré·e de la tournée`, message: 'Enregistré dans le journal.' });
    refresh();
  }
  async function toggleEligible(c: CandidateFull) {
    if (!week) return;
    const on = c.eligible.includes(week.id);
    const { error } = on
      ? await supabase.from('candidate_eligible_weeks').delete().eq('candidate_id', c.id).eq('prime_id', week.id)
      : await supabase.from('candidate_eligible_weeks').insert({ candidate_id: c.id, prime_id: week.id });
    if (error) return toast({ tone: 'error', ...explainError(error) });
    refresh();
  }
  async function markAllEligible() {
    if (!week) return;
    const rows = (cands.data ?? []).filter((c) => c.status !== 'eliminated' && c.status !== 'immune' && !c.eligible.includes(week.id)).map((c) => ({ candidate_id: c.id, prime_id: week.id }));
    if (!rows.length) return;
    const { error } = await supabase.from('candidate_eligible_weeks').insert(rows);
    if (error) return toast({ tone: 'error', ...explainError(error) });
    toast({ tone: 'success', title: `Semaine ${week.number} : éligibilité enregistrée`, message: `${rows.length} candidats éligibles aux nominations.` });
    refresh();
  }

  async function saveCandidate() {
    if (!edit || !sid) return;
    if (!edit.first_name.trim()) return toast({ tone: 'error', title: 'Prénom obligatoire' });
    setBusy(true);
    try {
      let photo_url = edit.photo_url || null;
      if (file) {
        const path = `${sid}/${Date.now()}-${file.name.replace(/[^\w.]+/g, '-')}`;
        const up = await supabase.storage.from('candidates').upload(path, file, { contentType: file.type });
        if (up.error) throw up.error;
        photo_url = supabase.storage.from('candidates').getPublicUrl(path).data.publicUrl;
      }
      const row = {
        first_name: edit.first_name.trim(), last_name: edit.last_name.trim() || null, age: edit.age ? Number(edit.age) : null, city: edit.city.trim() || null,
        bio: edit.bio.trim() || null, entered_at: edit.entered_at || null, photo_url,
      };
      const { error } = edit.id ? await supabase.from('candidates').update(row).eq('id', edit.id) : await supabase.from('candidates').insert({ ...row, season_id: sid });
      if (error) throw error;
      toast({ tone: 'success', title: edit.id ? 'Fiche mise à jour' : 'Candidat ajouté', message: 'Visible immédiatement dans l’app.' });
      setEdit(null);
      setFile(null);
      refresh();
    } catch (e) {
      toast({ tone: 'error', ...explainError(e) });
    } finally {
      setBusy(false);
    }
  }

  const list = cands.data ?? [];
  const nominatedThisWeek = list.filter((c) => week && c.nominations.includes(week.id));

  return (
    <AdminPage
      title="Candidats"
      sub="Les changements sont visibles immédiatement dans l’app. Le statut tournée est indépendant du statut en compétition."
      actions={<Button icon="plus" onClick={() => { setEdit({ ...EMPTY }); setFile(null); }}>Ajouter un candidat</Button>}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Overline>SEMAINE DE NOMINATION</Overline>
        <select value={week?.id ?? ''} onChange={(e) => setPrimeId(e.target.value)} className="h-9 rounded-sm border-0 bg-card px-3 text-primary shadow-subtle" style={{ font: 'var(--text-body-s)' }}>
          {(primes.data ?? []).map((p) => <option key={p.id} value={p.id}>Prime {p.number}{p.id === cur?.id ? ' (en cours)' : ''}</option>)}
        </select>
        <span className="t-body-s text-muted">{nominatedThisWeek.length ? `Nommés : ${nominatedThisWeek.map((c) => c.first_name).join(', ')}` : 'Aucun nommé enregistré'}</span>
        <span className="flex-1" />
        {week && <Button size="sm" variant="secondary" icon="calendar-check" onClick={markAllEligible}>Marquer les candidats en lice éligibles</Button>}
      </div>
      {!primes.data?.length && <span className="t-body-s text-muted">Ajoute d’abord les primes dans Saison pour enregistrer des nominations.</span>}

      <Table cols={COLS} head={['CANDIDAT', 'STATUT', 'NOMINATIONS', 'TOURNÉE', 'ACTIONS']}>
        {list.length === 0 && <Tr cols="1fr"><span className="text-muted">Aucun candidat. Ajoute-les dès leur révélation officielle.</span></Tr>}
        {list.map((c) => {
          const [lbl, tone] = STATUS_LABEL[c.status];
          const nominated = !!week && c.nominations.includes(week.id);
          const out = c.status === 'eliminated';
          return (
            <Tr key={c.id} cols={COLS}>
              <button type="button" className="flex items-center gap-2.5 border-0 bg-transparent p-0 text-left font-bold" onClick={() => {
                setEdit({ id: c.id, first_name: c.first_name, last_name: c.last_name ?? '', age: c.age ? String(c.age) : '', city: c.city ?? '', bio: c.bio ?? '', entered_at: c.entered_at ?? '', photo_url: c.photo_url ?? '' });
                setFile(null);
              }}>
                <Avatar name={c.first_name} src={c.photo_url} size={30} style={out ? { filter: 'grayscale(1)', opacity: 0.6 } : undefined} />
                <span className="truncate">{c.first_name}{c.last_name ? ` ${c.last_name}` : ''}</span>
                {week && c.eligible.includes(week.id) && <span className="t-caption text-muted" title="Éligible aux nominations cette semaine">· éligible</span>}
              </button>
              <span><Badge tone={tone}>{lbl}</Badge></span>
              <span className="t-num" style={{ font: 'italic 800 16px var(--font-numeric)' }}>{c.nominations.length}</span>
              <span><Switch checked={!!c.on_tour} onChange={(v) => setTour(c, v)} ariaLabel={`Tournée : ${c.first_name}`} /></span>
              <span className="flex flex-wrap gap-1.5">
                <Button variant="secondary" size="sm" disabled={out || !week} onClick={() => setStatus(c, nominated ? 'competing' : 'nominated')}>{nominated ? 'Retirer nomination' : 'Nommer'}</Button>
                <Button variant="ghost" size="sm" onClick={() => setStatus(c, out ? 'competing' : 'eliminated')}>{out ? 'Réintégrer' : 'Éliminer'}</Button>
                <select aria-label={`Autre statut pour ${c.first_name}`} value="" onChange={(e) => e.target.value && setStatus(c, e.target.value as CandidateStatus)}
                  className="h-9 rounded-full border-0 bg-transparent px-2 text-secondary" style={{ font: 'var(--text-body-s)', fontWeight: 700 }}>
                  <option value="">Autre…</option>
                  <option value="immune">Immunisé·e</option>
                  <option value="competing">En compétition</option>
                  <option value="finalist">Finaliste</option>
                  <option value="winner">Vainqueur</option>
                </select>
                {week && !out && <Button variant="ghost" size="sm" onClick={() => toggleEligible(c)}>{c.eligible.includes(week.id) ? 'Non éligible' : 'Éligible'}</Button>}
              </span>
            </Tr>
          );
        })}
      </Table>
      <span className="t-caption text-muted">
        « Nommer » enregistre la nomination de la semaine choisie (une semaine = une nomination). L’éligibilité par semaine sert à la règle du « moins nommé ». Finalistes et vainqueur alimentent l’écran de fin de saison ; les points, eux, viennent des résultats publiés.
      </span>

      <Dialog open={!!edit} title={edit?.id ? 'Modifier la fiche' : 'Ajouter un candidat'} onClose={busy ? undefined : () => setEdit(null)} width={520}
        actions={<>
          <Button block onClick={saveCandidate} loading={busy}>Enregistrer</Button>
          <Button block variant="ghost" onClick={() => setEdit(null)} disabled={busy}>Annuler</Button>
        </>}>
        {edit && (
          <div className="flex max-h-[60vh] flex-col gap-3 overflow-auto pr-1">
            <div className="flex items-center gap-3">
              <Avatar name={edit.first_name || '?'} src={file ? URL.createObjectURL(file) : edit.photo_url || null} size={56} />
              <Button size="sm" variant="secondary" icon="camera" onClick={() => fileRef.current?.click()}>Photo officielle</Button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <span className="t-caption text-muted">Format portrait 3:4 recommandé. Uniquement des visuels officiels autorisés.</span>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Prénom" value={edit.first_name} onChange={(e) => setEdit({ ...edit, first_name: e.target.value })} />
              <Input label="Nom" value={edit.last_name} onChange={(e) => setEdit({ ...edit, last_name: e.target.value })} />
              <Input label="Âge" type="number" value={edit.age} onChange={(e) => setEdit({ ...edit, age: e.target.value })} />
              <Input label="Ville ou région" value={edit.city} onChange={(e) => setEdit({ ...edit, city: e.target.value })} />
            </div>
            <Input label="Date d’entrée" type="date" value={edit.entered_at} onChange={(e) => setEdit({ ...edit, entered_at: e.target.value })} />
            <TextArea label="Présentation" value={edit.bio} onChange={(e) => setEdit({ ...edit, bio: e.target.value })} />
          </div>
        )}
      </Dialog>
    </AdminPage>
  );
}
