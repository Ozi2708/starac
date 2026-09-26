import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useAuth } from './auth';
import type {
  Badge, Candidate, LeaderRow, LeagueLeaderRow, LeagueMembership, Notification, OfficialResult, PickStat, Prime, PrimeScore,
  Question, QuestionOption, RankSnapshot, ScoreTransaction, Season, UserBadge, UserPrediction,
} from './types';

async function rows<T>(p: PromiseLike<{ data: unknown; error: unknown }>): Promise<T[]> {
  const { data, error } = await p;
  if (error) throw error;
  return (data ?? []) as T[];
}

// ---------- Saison ----------
export function useSeason() {
  return useQuery({
    queryKey: ['season'],
    queryFn: async () => {
      const { data, error } = await supabase.from('v_seasons').select('*').eq('is_current', true).maybeSingle();
      if (error) throw error;
      return data as Season | null;
    },
    refetchInterval: 60_000,
  });
}
export const isDemoSeason = (s?: Season | null) => !!s && /DÉMO|DEMO/i.test(s.name);

export function usePrimes(seasonId?: string) {
  return useQuery({
    queryKey: ['primes', seasonId],
    enabled: !!seasonId,
    queryFn: () => rows<Prime>(supabase.from('primes').select('*').eq('season_id', seasonId!).order('number')),
  });
}

/** Prime « en cours » : premier non clôturé, sinon le dernier (même règle que current_prime_id() en SQL). */
export function currentPrime(primes?: Prime[]) {
  if (!primes?.length) return null;
  return primes.find((p) => !p.closed_at) ?? primes[primes.length - 1];
}
export function lastClosedPrime(primes?: Prime[]) {
  return [...(primes ?? [])].reverse().find((p) => p.closed_at) ?? null;
}

// ---------- Candidats ----------
export interface CandidateFull extends Candidate {
  nominations: string[]; // prime_ids
  eligible: string[];
}
export function useCandidates(seasonId?: string) {
  return useQuery({
    queryKey: ['candidates', seasonId],
    enabled: !!seasonId,
    queryFn: async () => {
      const [cands, noms, elig] = await Promise.all([
        rows<Candidate>(supabase.from('candidates').select('*').eq('season_id', seasonId!).order('first_name')),
        rows<{ candidate_id: string; prime_id: string }>(supabase.from('candidate_nominations').select('candidate_id, prime_id, candidates!inner(season_id)').eq('candidates.season_id', seasonId!)),
        rows<{ candidate_id: string; prime_id: string }>(supabase.from('candidate_eligible_weeks').select('candidate_id, prime_id, candidates!inner(season_id)').eq('candidates.season_id', seasonId!)),
      ]);
      return cands.map<CandidateFull>((c) => ({
        ...c,
        nominations: noms.filter((n) => n.candidate_id === c.id).map((n) => n.prime_id),
        eligible: elig.filter((n) => n.candidate_id === c.id).map((n) => n.prime_id),
      }));
    },
  });
}

// ---------- Questions et pronos ----------
export interface GameQuestion extends Question {
  options: QuestionOption[];
  mine: UserPrediction | null;
  result: OfficialResult | null;
  myPoints: number | null; // null tant que non publié
  answers: number;
  locked: boolean;
}

export function useGame(seasonId?: string) {
  const { userId } = useAuth();
  const q = useQuery({
    queryKey: ['game', seasonId, userId],
    enabled: !!seasonId && !!userId,
    queryFn: async () => {
      const questions = await rows<Question>(supabase.from('questions').select('*').eq('season_id', seasonId!).neq('status', 'draft').order('sort_order'));
      const ids = questions.map((x) => x.id);
      if (!ids.length) return { questions: [] as Question[], options: [], mine: [], results: [], tx: [], counts: [] };
      const [options, mine, results, tx, counts] = await Promise.all([
        rows<QuestionOption>(supabase.from('question_options').select('*').in('question_id', ids).order('sort_order')),
        rows<UserPrediction>(supabase.from('user_predictions').select('*').eq('user_id', userId!).in('question_id', ids)),
        rows<OfficialResult>(supabase.from('official_results').select('question_id, correct_option_ids, number_value, version, recorded_at').in('question_id', ids)),
        rows<ScoreTransaction>(supabase.from('score_transactions').select('*').eq('user_id', userId!).eq('season_id', seasonId!)),
        rows<{ question_id: string; answers: number }>(supabase.from('v_question_answer_counts').select('*').in('question_id', ids)),
      ]);
      return { questions, options, mine, results, tx, counts };
    },
  });
  const data = useMemo(() => {
    if (!q.data) return undefined;
    const now = Date.now();
    const list: GameQuestion[] = q.data.questions.map((x) => {
      const tx = q.data!.tx.filter((t) => t.question_id === x.id);
      return {
        ...x,
        options: q.data!.options.filter((o) => o.question_id === x.id),
        mine: q.data!.mine.find((m) => m.question_id === x.id) ?? null,
        result: x.status === 'published' ? q.data!.results.find((r) => r.question_id === x.id) ?? null : null,
        myPoints: x.status === 'published' ? tx.reduce((s, t) => s + t.points, 0) : null,
        answers: q.data!.counts.find((c) => c.question_id === x.id)?.answers ?? 0,
        locked: x.status !== 'open' || new Date(x.closes_at).getTime() <= now,
      };
    });
    return { questions: list, transactions: q.data.tx };
  }, [q.data]);
  return { ...q, data };
}

export function useSubmitPrediction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { questionId: string; optionIds?: string[]; number?: number | null }) => {
      const { data, error } = await supabase.rpc('submit_prediction', { p_question: v.questionId, p_option_ids: v.optionIds ?? [], p_number: v.number ?? null });
      if (error) throw error;
      return data as UserPrediction;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['game'] }),
  });
}

// ---------- Classements ----------
export function useGeneralLeaderboard(seasonId?: string) {
  return useQuery({
    queryKey: ['lb-general', seasonId],
    enabled: !!seasonId,
    queryFn: () => rows<LeaderRow>(supabase.from('v_general_leaderboard').select('*').eq('season_id', seasonId!).order('rank').order('pseudo')),
  });
}
export function useLeagueLeaderboard(leagueId?: string | null) {
  return useQuery({
    queryKey: ['lb-league', leagueId],
    enabled: !!leagueId,
    queryFn: () => rows<LeagueLeaderRow>(supabase.from('v_league_leaderboard').select('*').eq('league_id', leagueId!).order('rank').order('pseudo')),
  });
}
export function usePrimeScores(seasonId?: string) {
  return useQuery({
    queryKey: ['prime-scores', seasonId],
    enabled: !!seasonId,
    queryFn: () => rows<PrimeScore>(supabase.from('v_prime_scores').select('*').eq('season_id', seasonId!)),
  });
}
export function useSnapshots(seasonId?: string, leagueId?: string | null) {
  return useQuery({
    queryKey: ['snapshots', seasonId, leagueId ?? 'general'],
    enabled: !!seasonId,
    queryFn: () => {
      let b = supabase.from('rank_snapshots').select('season_id, prime_id, league_id, user_id, total, rank').eq('season_id', seasonId!);
      b = leagueId ? b.eq('league_id', leagueId) : b.is('league_id', null);
      return rows<RankSnapshot>(b);
    },
  });
}

// ---------- Ligues ----------
export function useMyLeagues() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['my-leagues', userId],
    enabled: !!userId,
    queryFn: () => rows<LeagueMembership>(supabase.from('league_members').select('*, leagues(*)').eq('user_id', userId!).order('joined_at')),
  });
}
export function usePrimaryLeague() {
  const l = useMyLeagues();
  const primary = l.data?.find((m) => m.is_primary) ?? l.data?.[0] ?? null;
  return { ...l, primary };
}
export function useLeagueMemberCounts(leagueIds: string[]) {
  return useQuery({
    queryKey: ['league-counts', leagueIds.join(',')],
    enabled: leagueIds.length > 0,
    queryFn: async () => {
      const r = await rows<{ league_id: string }>(supabase.from('league_members').select('league_id').in('league_id', leagueIds));
      return Object.fromEntries(leagueIds.map((id) => [id, r.filter((x) => x.league_id === id).length])) as Record<string, number>;
    },
  });
}

// ---------- Profil, badges, notifications ----------
export function useBadges() {
  return useQuery({ queryKey: ['badges'], staleTime: Infinity, queryFn: () => rows<Badge>(supabase.from('badges').select('*').order('sort_order')) });
}
export function useUserBadges(seasonId?: string, userIds?: string[]) {
  return useQuery({
    queryKey: ['user-badges', seasonId, userIds?.join(',')],
    enabled: !!seasonId && (!userIds || userIds.length > 0),
    queryFn: () => {
      let b = supabase.from('user_badges').select('*').eq('season_id', seasonId!).order('earned_at', { ascending: false });
      if (userIds) b = b.in('user_id', userIds);
      return rows<UserBadge>(b);
    },
  });
}
export function useNotifications() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['notifications', userId],
    enabled: !!userId,
    refetchInterval: 60_000,
    queryFn: () => rows<Notification>(supabase.from('notifications').select('*').eq('user_id', userId!).order('created_at', { ascending: false }).limit(60)),
  });
}
export function usePickStats(seasonId?: string) {
  return useQuery({
    queryKey: ['pick-stats', seasonId],
    enabled: !!seasonId,
    queryFn: () => rows<PickStat>(supabase.from('v_candidate_pick_stats').select('*').eq('season_id', seasonId!)),
  });
}
