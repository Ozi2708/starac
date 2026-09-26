import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { AdminLog, League, Profile, Question, QuestionOption } from '@/lib/types';

async function rows<T>(p: PromiseLike<{ data: unknown; error: unknown }>): Promise<T[]> {
  const { data, error } = await p;
  if (error) throw error;
  return (data ?? []) as T[];
}

export interface AdminQuestion extends Question {
  options: QuestionOption[];
  answers: number;
}

/** Toutes les questions de la saison, brouillons compris (RLS : admin). */
export function useAdminQuestions(seasonId?: string) {
  return useQuery({
    queryKey: ['admin-questions', seasonId],
    enabled: !!seasonId,
    queryFn: async () => {
      const qs = await rows<Question>(supabase.from('questions').select('*').eq('season_id', seasonId!).order('closes_at').order('sort_order'));
      const ids = qs.map((q) => q.id);
      if (!ids.length) return [] as AdminQuestion[];
      const [opts, counts] = await Promise.all([
        rows<QuestionOption>(supabase.from('question_options').select('*').in('question_id', ids).order('sort_order')),
        rows<{ question_id: string; answers: number }>(supabase.from('v_question_answer_counts').select('*').in('question_id', ids)),
      ]);
      return qs.map<AdminQuestion>((q) => ({ ...q, options: opts.filter((o) => o.question_id === q.id), answers: counts.find((c) => c.question_id === q.id)?.answers ?? 0 }));
    },
  });
}

export function useProfiles() {
  return useQuery({ queryKey: ['admin-profiles'], queryFn: () => rows<Profile>(supabase.from('profiles').select('*').order('pseudo')) });
}

export interface AdminLeague extends League { members: { user_id: string; role: string }[] }
export function useAdminLeagues(seasonId?: string) {
  return useQuery({
    queryKey: ['admin-leagues', seasonId],
    enabled: !!seasonId,
    queryFn: () => rows<AdminLeague>(supabase.from('leagues').select('*, members:league_members(user_id, role)').eq('season_id', seasonId!).order('created_at')),
  });
}

export function usePredictionCount(seasonId?: string) {
  return useQuery({
    queryKey: ['admin-pred-count', seasonId],
    enabled: !!seasonId,
    queryFn: async () => {
      const { count, error } = await supabase.from('user_predictions').select('id, questions!inner(season_id)', { count: 'exact', head: true }).eq('questions.season_id', seasonId!);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useAdminLogs() {
  return useQuery({ queryKey: ['admin-logs'], queryFn: () => rows<AdminLog>(supabase.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(300)) });
}

export function useAdminRefresh() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
}
