import { useState } from 'react';
import { fmtDayDateTime } from '@/lib/format';
import { Input } from '@/components/ui/core';
import { AdminPage, Table, Tr } from './AdminApp';
import { useAdminLogs, useProfiles } from './data';

const COLS = '140px 90px minmax(0,1.2fr) minmax(0,1fr) minmax(0,1fr)';
const ENTITIES: Record<string, string> = {
  question: 'Question', questions: 'Question', candidates: 'Candidat', candidate_nominations: 'Nomination', seasons: 'Saison', primes: 'Prime', leagues: 'Ligue', prime: 'Semaine',
};
const ACTIONS: Record<string, string> = {
  insert: 'Création', update: 'Modification', delete: 'Suppression', 'result.publish': 'Résultat publié', 'result.correct': 'Résultat corrigé', 'prime.close': 'Semaine clôturée',
};
const FIELDS: Record<string, string> = {
  status: 'statut', points: 'points', bonus_points: 'bonus', closes_at: 'clôture', title: 'intitulé', first_name: 'prénom', on_tour: 'tournée', correct: 'réponse',
  number_value: 'nombre', first_prime_at: 'premier prime', grand_predictions_close_at: 'clôture grands pronos', name: 'nom', invite_code: 'code', cancelled_reason: 'motif',
  airs_at: 'date', is_final: 'finale', year: 'année', is_current: 'en cours', tour_count: 'tournée', finalists_count: 'finalistes', final_at: 'finale le', number: 'n°',
};

/** JSON du journal rendu lisible : « statut : open · points : 20 ». */
function readable(v: Record<string, unknown> | null): string {
  if (!v) return '—';
  const skip = new Set(['id', 'season_id', 'created_at', 'question_id', 'prime_id', 'candidate_id', 'eliminated_prime_id', 'version']);
  return Object.entries(v).filter(([k, x]) => !skip.has(k) && x !== null && x !== '').slice(0, 5)
    .map(([k, x]) => `${FIELDS[k] ?? k.replace(/_/g, ' ')} : ${Array.isArray(x) ? x.join(', ') : typeof x === 'string' && /^\d{4}-\d\d-\d\dT/.test(x) ? fmtDayDateTime(x) : typeof x === 'boolean' ? (x ? 'oui' : 'non') : String(x)}`).join(' · ') || '—';
}

export function AdminJournal() {
  const logs = useAdminLogs();
  const profiles = useProfiles();
  const [entity, setEntity] = useState('all');
  const [from, setFrom] = useState('');
  const list = (logs.data ?? []).filter((l) => (entity === 'all' || (ENTITIES[l.entity] ?? l.entity) === entity) && (!from || l.created_at >= from));
  const entities = [...new Set((logs.data ?? []).map((l) => ENTITIES[l.entity] ?? l.entity))];

  return (
    <AdminPage title="Journal" sub="Chaque modification importante : auteur, date, ancienne et nouvelle valeur.">
      <div className="flex items-end gap-3">
        <label className="gp-field">
          <span className="gp-field__label">Entité</span>
          <select value={entity} onChange={(e) => setEntity(e.target.value)} className="gp-field__control text-primary">
            <option value="all">Toutes</option>
            {entities.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </label>
        <Input label="Depuis le" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
      </div>
      <Table cols={COLS} head={['DATE', 'AUTEUR', 'ACTION', 'ANCIENNE VALEUR', 'NOUVELLE VALEUR']}>
        {list.length === 0 && <Tr cols="1fr"><span className="text-muted">Aucune entrée.</span></Tr>}
        {list.map((l) => (
          <Tr key={l.id} cols={COLS}>
            <span className="text-muted">{fmtDayDateTime(l.created_at)}</span>
            <span className="truncate text-secondary">{profiles.data?.find((p) => p.id === l.actor_id)?.pseudo ?? 'Système'}</span>
            <span className="font-bold">{ACTIONS[l.action] ?? l.action} · {ENTITIES[l.entity] ?? l.entity}{l.new_value?.question ? ` · ${String(l.new_value.question)}` : l.new_value?.first_name ? ` · ${String(l.new_value.first_name)}` : l.new_value?.title ? ` · ${String(l.new_value.title)}` : ''}</span>
            <span className="text-muted">{readable(l.old_value)}</span>
            <span className="text-primary">{readable(l.new_value)}</span>
          </Tr>
        ))}
      </Table>
    </AdminPage>
  );
}
