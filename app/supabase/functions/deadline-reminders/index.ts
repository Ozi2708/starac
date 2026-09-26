// Edge Function planifiée : clôture les questions échues et crée les rappels « clôture dans 2 h ».
// Alternative à pg_cron (voir migration 20261001000100). Planification : Dashboard → Edge Functions → Schedules,
// ou un cron externe qui appelle cette URL avec la clé service (header Authorization).
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const auth = req.headers.get('Authorization') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  if (auth !== `Bearer ${serviceKey}`) return new Response('Unauthorized', { status: 401 });

  const db = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey, { auth: { persistSession: false } });
  const closed = await db.rpc('close_due_questions');
  const reminders = await db.rpc('notify_deadlines', { p_within: '2 hours' });
  const error = closed.error ?? reminders.error;
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return Response.json({ closed: closed.data, reminders: reminders.data });
});
