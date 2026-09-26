// Aides d'affichage uniquement : aucun score n'est calculé ici (tout vient de la base).
import type { BadgeTone } from '@/components/ui/core';
import type { PronoStatus } from '@/components/ui/game';
import type { GameQuestion } from './queries';
import type { Question, QuestionOption } from './types';

/** Points maximum accessibles sur une question (affichage « 95 pts en jeu »). */
export const maxPoints = (q: Pick<Question, 'points' | 'max_selections' | 'bonus_points' | 'scoring'>) =>
  q.scoring === 'per_correct' || q.scoring === 'ordered_positions' ? q.points * q.max_selections + q.bonus_points : q.points;

export const isMultiPerCorrect = (q: Pick<Question, 'max_selections' | 'scoring'>) => q.max_selections > 1 && q.scoring !== 'all_or_nothing';

/** Unité affichée à côté des points : « pts / candidat », « pts / nommé »… */
export function pointsSuffix(q: Pick<Question, 'max_selections' | 'scoring' | 'key' | 'title'>) {
  if (!isMultiPerCorrect(q)) return 'pts';
  if (q.key === 'finalists') return 'pts / finaliste';
  if (/nomm/i.test(q.title)) return 'pts / nommé';
  if (q.scoring === 'ordered_positions') return 'pts / position';
  return 'pts / candidat';
}

export function answered(q: GameQuestion) {
  return !!q.mine && (q.mine.option_ids.length > 0 || q.mine.number_value != null);
}

export function pronoStatus(q: GameQuestion): PronoStatus {
  if (q.status === 'cancelled') return 'cancelled';
  if (q.status === 'published') return (q.myPoints ?? 0) > 0 ? 'won' : 'closed';
  if (q.locked) return 'closed';
  return answered(q) ? 'done' : 'open';
}

export function optionLabels(q: { options: QuestionOption[] }, ids: string[]) {
  return ids.map((id) => q.options.find((o) => o.id === id)?.label ?? '?');
}

/** « Inès, Noah, Jade +5 » */
export function pickSummary(q: GameQuestion, max = 3): string | null {
  if (!answered(q)) return null;
  if (q.type === 'exact_number') return String(q.mine!.number_value);
  const l = optionLabels(q, q.mine!.option_ids);
  return l.length > max ? l.slice(0, max).join(', ') + ' +' + (l.length - max) : l.join(', ');
}

/** Statut d'une réponse dans « Mes pronostics » (visible seulement après publication). */
export function answerStatus(q: GameQuestion): { label: string; tone: BadgeTone } {
  if (q.status === 'cancelled') return { label: 'Annulé', tone: 'closed' };
  if (q.status !== 'published') {
    if (answered(q)) return { label: 'En attente', tone: 'neutral' };
    return q.locked ? { label: 'Aucune', tone: 'closed' } : { label: 'À faire', tone: 'magenta' };
  }
  if (!answered(q)) return { label: 'Aucune', tone: 'closed' };
  const pts = q.myPoints ?? 0;
  if (pts <= 0) return { label: 'Incorrect', tone: 'closed' };
  const full = maxPoints(q);
  return pts >= full || q.max_selections === 1 || q.scoring === 'all_or_nothing' ? { label: 'Correct', tone: 'open' } : { label: 'Partiel', tone: 'magenta' };
}

/** Évolution depuis le prime précédent : positif = gagne des places. */
export const moveOf = (r: { rank: number; prev_rank: number | null }) => (r.prev_rank == null ? 0 : r.prev_rank - r.rank);

/** Rangs partagés à égalité (1, 2, 2, 4) : utilisé pour classer des valeurs déjà calculées côté serveur. */
export function competitionRanks<T>(list: T[], score: (x: T) => number): (T & { rank: number })[] {
  const sorted = [...list].sort((a, b) => score(b) - score(a));
  return sorted.map((x) => ({ ...x, rank: 1 + sorted.filter((o) => score(o) > score(x)).length }));
}
