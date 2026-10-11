import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useMyLeagues, type GameQuestion } from '@/lib/queries';
import { optionLabels } from '@/lib/game';
import { plural } from '@/lib/format';
import { Avatar, Overline, Skeleton } from '@/components/ui/core';
import { Icon } from '@/components/ui/Icon';
import type { Profile, UserPrediction } from '@/lib/types';
import type { CandidateFull } from '@/lib/queries';

interface Pick_ { user: Pick<Profile, 'id' | 'pseudo' | 'avatar_url'>; pred: UserPrediction }

/**
 * Pronos des autres joueurs, visibles uniquement après la clôture (la RLS de user_predictions
 * ne les renvoie pas avant). Regroupés par réponse, filtrables par ligue.
 */
export function LeaguePicks({ q, candById }: { q: GameQuestion; candById: Map<string, CandidateFull> }) {
  const { userId } = useAuth();
  const leagues = useMyLeagues();
  const primaryId = leagues.data?.find((m) => m.is_primary)?.league_id ?? leagues.data?.[0]?.league_id;
  const [scopeSel, setScope] = useState<string | null>(null);
  const scope = scopeSel ?? primaryId ?? 'all';

  const picks = useQuery({
    queryKey: ['question-picks', q.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_predictions').select('*').eq('question_id', q.id);
      if (error) throw error;
      const preds = (data ?? []) as UserPrediction[];
      const ids = [...new Set(preds.map((p) => p.user_id))];
      if (!ids.length) return [] as Pick_[];
      const prof = await supabase.from('profiles').select('id, pseudo, avatar_url').in('id', ids);
      if (prof.error) throw prof.error;
      const byId = new Map((prof.data ?? []).map((p) => [p.id as string, p as Pick_['user']]));
      return preds.filter((p) => byId.has(p.user_id)).map((pred) => ({ user: byId.get(pred.user_id)!, pred }));
    },
  });

  const members = useQuery({
    queryKey: ['league-member-ids', scope],
    enabled: scope !== 'all',
    queryFn: async () => {
      const { data, error } = await supabase.from('league_members').select('user_id').eq('league_id', scope);
      if (error) throw error;
      return new Set((data ?? []).map((m) => m.user_id as string));
    },
  });

  const correct = q.status === 'published' ? q.result?.correct_option_ids ?? [] : [];
  const groups = useMemo(() => {
    const list = (picks.data ?? []).filter((p) => scope === 'all' || members.data?.has(p.user.id));
    const map = new Map<string, { key: string; label: string; optionId?: string; users: Pick_['user'][] }>();
    const add = (key: string, label: string, u: Pick_['user'], optionId?: string) => {
      const g = map.get(key) ?? { key, label, optionId, users: [] };
      g.users.push(u);
      map.set(key, g);
    };
    for (const { user, pred } of list) {
      if (q.type === 'exact_number') {
        if (pred.number_value != null) add(`n:${pred.number_value}`, String(pred.number_value), user);
      } else if (q.type === 'ordered') {
        add(`o:${pred.option_ids.join(',')}`, optionLabels(q, pred.option_ids).join(' › '), user);
      } else {
        for (const oid of pred.option_ids) add(oid, optionLabels(q, [oid])[0] ?? '?', user, oid);
      }
    }
    const total = list.length;
    return { total, rows: [...map.values()].sort((a, b) => b.users.length - a.users.length || a.label.localeCompare(b.label)) };
  }, [picks.data, members.data, scope, q]);

  const isRight = (g: { key: string; optionId?: string }) =>
    q.status === 'published' && (g.optionId ? correct.includes(g.optionId) : q.type === 'exact_number' && g.key === `n:${q.result?.number_value}`);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <Overline>LES PRONOS DES AUTRES</Overline>
        {!picks.isLoading && <span className="t-caption text-muted">{plural(groups.total, 'joueur')}</span>}
      </div>
      {(leagues.data?.length ?? 0) > 0 && (
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          {[...(leagues.data ?? []).map((l) => ({ id: l.league_id, name: l.leagues.name })), { id: 'all', name: 'Tous les joueurs' }].map((l) => (
            <button key={l.id} type="button" onClick={() => setScope(l.id)}
              className={'gp-seg__opt flex-none rounded-full' + (scope === l.id ? ' gp-seg__opt--on' : '')}
              style={scope === l.id ? { height: 32 } : { height: 32, background: 'rgba(255,255,255,.06)', boxShadow: 'inset 0 0 0 1px var(--border-subtle)' }}>
              {l.name}
            </button>
          ))}
        </div>
      )}
      {picks.isLoading || (scope !== 'all' && members.isLoading) ? (
        <Skeleton h={120} />
      ) : !groups.rows.length ? (
        <div className="card-plain t-body-s p-4 text-muted">Personne n’a joué ce prono{scope !== 'all' ? ' dans cette ligue' : ''}.</div>
      ) : (
        <div className="card-plain row-sep flex flex-col">
          {groups.rows.map((g) => {
            const opt = g.optionId ? q.options.find((o) => o.id === g.optionId) : null;
            const cand = opt?.candidate_id ? candById.get(opt.candidate_id) : null;
            const right = isRight(g);
            return (
              <div key={g.key} className="flex flex-col gap-2.5 px-4 py-3.5" style={right ? { background: 'rgba(47,217,154,.08)' } : undefined}>
                <div className="flex items-center gap-3">
                  {opt?.candidate_id && <Avatar name={g.label} src={cand?.photo_url} size={32} />}
                  <span className="t-body flex-1 truncate font-bold">{g.label}</span>
                  {right && <Icon name="circle-check" size={18} style={{ color: 'var(--green-500)' }} />}
                  <span className="t-caption text-secondary">{g.users.length} · {Math.round((g.users.length / Math.max(groups.total, 1)) * 100)} %</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {g.users.map((u) => (
                    <span key={u.id} className="t-caption inline-flex items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2.5"
                      style={{ background: u.id === userId ? 'rgba(210,67,230,.22)' : 'rgba(255,255,255,.06)', boxShadow: 'inset 0 0 0 1px var(--border-subtle)' }}>
                      <Avatar name={u.pseudo} src={u.avatar_url} size={20} />
                      {u.id === userId ? 'Toi' : u.pseudo}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
