-- Durcissement suggéré par le linter Supabase.
alter function gen_invite_code() set search_path = public;
alter function questions_guard() set search_path = public;
alter function score_prediction(questions, uuid[], numeric, official_results) set search_path = public;
alter function question_is_locked(questions) set search_path = public;
revoke execute on function audit_row(), candidates_after_insert() from public, anon, authenticated;
-- La phase de saison se lit avec les droits du lecteur (saisons et questions non-brouillon sont publiques).
-- v_candidate_pick_stats et v_question_answer_counts restent volontairement « definer » : elles n'exposent que
-- des agrégats (pourcentages après clôture, nombres de réponses), jamais les choix individuels.
alter view v_seasons set (security_invoker = true);
