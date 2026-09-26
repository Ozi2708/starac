// Types des tables et vues (miroir de supabase/migrations). Régénérables avec
// `supabase gen types typescript --local > src/lib/database.types.ts`.

export type UserRole = 'player' | 'admin';
export type CandidateStatus = 'competing' | 'nominated' | 'immune' | 'eliminated' | 'finalist' | 'winner';
export type QuestionCategory = 'grand' | 'weekly' | 'fun';
export type QuestionType = 'single' | 'multiple' | 'yes_no' | 'exact_number' | 'ordered';
export type QuestionStatus = 'draft' | 'open' | 'closed' | 'published' | 'cancelled';
export type ScoringRule = 'per_correct' | 'all_or_nothing' | 'exact_number' | 'ordered_positions';
export type OptionsSource = 'candidates_competing' | 'candidates_nominated' | 'candidates_all' | 'custom' | 'yes_no';
export type LeagueRole = 'owner' | 'admin' | 'member';
export type NotifKind = 'predictions_open' | 'deadline_soon' | 'results_published' | 'points_awarded' | 'badge_earned' | 'rank_jump';
export type SeasonPhase = 'pre' | 'open' | 'running' | 'finished';

export interface Profile {
  id: string;
  pseudo: string;
  avatar_url: string | null;
  role: UserRole;
  notif_enabled: boolean;
  created_at: string;
}

export interface Season {
  id: string;
  name: string;
  year: number;
  is_current: boolean;
  first_prime_at: string;
  grand_predictions_close_at: string;
  final_at: string | null;
  finalists_count: number;
  tour_count: number;
  least_nominated_min_weeks: number;
  archived_at: string | null;
  created_at: string;
  phase: SeasonPhase;
  server_now: string;
}

export interface Prime {
  id: string;
  season_id: string;
  number: number;
  airs_at: string;
  is_final: boolean;
  closed_at: string | null;
}

export interface Candidate {
  id: string;
  season_id: string;
  first_name: string;
  last_name: string | null;
  photo_url: string | null;
  age: number | null;
  city: string | null;
  bio: string | null;
  entered_at: string | null;
  status: CandidateStatus;
  eliminated_at: string | null;
  eliminated_prime_id: string | null;
  on_tour: boolean | null;
  final_rank: number | null;
}

export interface Question {
  id: string;
  season_id: string;
  prime_id: string | null;
  category: QuestionCategory;
  key: string | null;
  type: QuestionType;
  title: string;
  description: string | null;
  icon: string;
  validation_criteria: string | null;
  options_source: OptionsSource;
  min_selections: number;
  max_selections: number;
  points: number;
  bonus_points: number;
  scoring: ScoringRule;
  closes_at: string;
  status: QuestionStatus;
  sort_order: number;
  cancelled_reason: string | null;
  created_at: string;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  label: string;
  candidate_id: string | null;
  is_none_option: boolean;
  sort_order: number;
}

export interface UserPrediction {
  id: string;
  question_id: string;
  user_id: string;
  option_ids: string[];
  number_value: number | null;
  submitted_at: string;
  updated_at: string;
}

export interface OfficialResult {
  question_id: string;
  correct_option_ids: string[];
  number_value: number | null;
  version: number;
  recorded_at: string;
}

export interface ScoreTransaction {
  id: string;
  season_id: string;
  prime_id: string | null;
  question_id: string;
  user_id: string;
  kind: 'base' | 'bonus';
  points: number;
  correct_count: number;
  result_version: number;
  created_at: string;
}

export interface League {
  id: string;
  season_id: string;
  name: string;
  image_url: string | null;
  invite_code: string;
  created_by: string | null;
  created_at: string;
}

export interface LeagueMembership {
  league_id: string;
  user_id: string;
  role: LeagueRole;
  is_primary: boolean;
  joined_at: string;
  leagues: League;
}

export interface LeaderRow {
  user_id: string;
  pseudo: string;
  avatar_url: string | null;
  total: number;
  rank: number;
  prev_rank: number | null;
  correct_answers: number;
}

export interface LeagueLeaderRow extends LeaderRow {
  league_id: string;
  season_id: string;
  role: LeagueRole;
}

export interface PrimeScore {
  user_id: string;
  prime_id: string;
  season_id: string;
  points: number;
  correct_answers: number;
  rank: number;
}

export interface RankSnapshot {
  season_id: string;
  prime_id: string;
  league_id: string | null;
  user_id: string;
  total: number;
  rank: number;
}

export interface Badge {
  code: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
}

export interface UserBadge {
  user_id: string;
  badge_code: string;
  season_id: string;
  earned_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  kind: NotifKind;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface AdminLog {
  id: number;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}

export interface PickStat {
  question_id: string;
  key: string | null;
  title: string;
  category: QuestionCategory;
  prime_id: string | null;
  candidate_id: string;
  pct: number;
  answers: number;
}
