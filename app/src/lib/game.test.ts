import { describe, expect, it } from 'vitest';
import { answerStatus, competitionRanks, maxPoints, moveOf, pickSummary, pointsSuffix, pronoStatus } from './game';
import type { GameQuestion } from './queries';

const base = (over: Partial<GameQuestion> = {}): GameQuestion => ({
  id: 'q', season_id: 's', prime_id: 'p', category: 'weekly', key: null, type: 'multiple', title: 'Les 8 de la tournée', description: null,
  icon: 'ticket', validation_criteria: 'x', options_source: 'candidates_all', min_selections: 8, max_selections: 8, points: 20, bonus_points: 50,
  scoring: 'per_correct', closes_at: new Date(Date.now() + 3600_000).toISOString(), status: 'open', sort_order: 0, cancelled_reason: null,
  created_at: '', answers: 0, locked: false, result: null, myPoints: null, mine: null,
  options: 'ABCDEFGHIJ'.split('').map((l, i) => ({ id: 'o' + i, question_id: 'q', label: l, candidate_id: 'c' + i, is_none_option: false, sort_order: i })),
  ...over,
});
const mine = (ids: string[]) => ({ id: 'm', question_id: 'q', user_id: 'u', option_ids: ids, number_value: null, submitted_at: '', updated_at: '' });

describe('affichage des pronos', () => {
  it('points en jeu et unité', () => {
    expect(maxPoints(base())).toBe(210);
    expect(pointsSuffix(base())).toBe('pts / candidat');
    expect(pointsSuffix(base({ max_selections: 1 }))).toBe('pts');
    expect(maxPoints(base({ scoring: 'all_or_nothing', max_selections: 2, points: 30, bonus_points: 0 }))).toBe(30);
  });
  it('statut de carte selon réponse, verrou et publication', () => {
    expect(pronoStatus(base())).toBe('open');
    expect(pronoStatus(base({ mine: mine(['o1']) }))).toBe('done');
    expect(pronoStatus(base({ locked: true }))).toBe('closed');
    expect(pronoStatus(base({ status: 'published', locked: true, myPoints: 20, mine: mine(['o1']) }))).toBe('won');
    expect(pronoStatus(base({ status: 'cancelled' }))).toBe('cancelled');
  });
  it('résume la sélection', () => {
    expect(pickSummary(base({ mine: mine(['o0', 'o1', 'o2', 'o3', 'o4']) }))).toBe('A, B, C +2');
  });
  it('ne révèle correct / incorrect qu’après publication', () => {
    expect(answerStatus(base({ mine: mine(['o0']) })).label).toBe('En attente');
    expect(answerStatus(base({ status: 'published', mine: mine(['o0']), myPoints: 40 })).label).toBe('Partiel');
    expect(answerStatus(base({ status: 'published', mine: mine(['o0']), myPoints: 210 })).label).toBe('Correct');
    expect(answerStatus(base({ status: 'published', mine: mine(['o0']), myPoints: 0 })).label).toBe('Incorrect');
    expect(answerStatus(base()).label).toBe('À faire');
  });
  it('rangs partagés et évolution', () => {
    expect(competitionRanks([{ s: 10 }, { s: 30 }, { s: 10 }, { s: 5 }], (x) => x.s).map((x) => x.rank)).toEqual([1, 2, 2, 4]);
    expect(moveOf({ rank: 2, prev_rank: 5 })).toBe(3);
    expect(moveOf({ rank: 2, prev_rank: null })).toBe(0);
  });
});
