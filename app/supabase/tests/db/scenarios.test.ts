/**
 * Les 8 scénarios obligatoires (docs/03-scoring-engine.md) + cas limites,
 * exécutés contre un vrai Postgres avec RLS, rôles et JWT simulés comme dans Supabase.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Db, freshDb } from './helpers';

const CANDS = ['Inès', 'Noah', 'Jade', 'Malo', 'Léna', 'Théo', 'Chloé', 'Enzo', 'Lou', 'Yanis', 'Maëlle', 'Sacha'];
const TOUR = ['Inès', 'Noah', 'Jade', 'Malo', 'Léna', 'Chloé', 'Enzo', 'Lou'];

let db: Db;
let drop: () => Promise<void>;
let admin: string, owner: string, A: string, B: string, C: string;
let season: string, prime1: string, finale: string;
let L1: { id: string; invite_code: string }, L2: { id: string; invite_code: string };
const grand: Record<string, string> = {};
const cand: Record<string, string> = {};

const rpcErr = async (p: Promise<unknown>) => {
  try {
    await p;
  } catch (e: any) {
    return e.message as string;
  }
  return 'NO_ERROR';
};

async function weeklyQuestion(title: string, opts: { source?: string; max?: number; points?: number; type?: string; bonus?: number } = {}) {
  const [{ id }] = await db.as(admin, `select admin_save_question($1::jsonb) as id`, [
    JSON.stringify({
      prime_id: prime1,
      category: 'weekly',
      type: opts.type ?? ((opts.max ?? 1) > 1 ? 'multiple' : 'single'),
      title,
      validation_criteria: 'Résultat officiel annoncé à l’antenne.',
      options_source: opts.source ?? 'candidates_competing',
      min_selections: opts.max ?? 1,
      max_selections: opts.max ?? 1,
      points: opts.points ?? 30,
      bonus_points: opts.bonus ?? 0,
      closes_at: new Date(Date.now() + 3600_000).toISOString(),
      status: 'open',
    }),
  ]);
  return id as string;
}

async function totalOf(user: string) {
  const [r] = await db.as(user, `select total from v_season_scores where user_id = $1 and season_id = $2`, [user, season]);
  return r.total as number;
}

beforeAll(async () => {
  ({ db, drop } = await freshDb());
  admin = await db.user('Alex', 'admin');
  owner = await db.user('Camille');
  A = await db.user('Sam');
  B = await db.user('Hugo');
  C = await db.user('Manon');

  [{ id: season }] = await db.as(admin, `insert into seasons(name, year, is_current, first_prime_at, grand_predictions_close_at)
     values ('Star Academy 2026', 2026, true, now() + interval '2 days', now() + interval '1 day') returning id`);
  [{ id: prime1 }] = await db.as(admin, `insert into primes(season_id, number, airs_at) values ($1, 1, now() + interval '2 days') returning id`, [season]);
  [{ id: finale }] = await db.as(admin, `insert into primes(season_id, number, airs_at, is_final) values ($1, 2, now() + interval '9 days', true) returning id`, [season]);
  for (const n of CANDS) {
    const [{ id }] = await db.as(admin, `insert into candidates(season_id, first_name) values ($1, $2) returning id`, [season, n]);
    cand[n] = id;
  }
  const [{ n }] = await db.as(admin, `select admin_create_grand_questions($1) as n`, [season]);
  expect(n).toBe(9);
  for (const q of await db.sql(`select id, key from questions where season_id = $1 and category = 'grand'`, [season])) {
    grand[q.key] = q.id;
    await db.as(admin, `select open_question($1)`, [q.id]);
  }
  L1 = (await db.as(owner, `select * from create_league('Les Stars du Canap’')`))[0];
  L2 = (await db.as(C, `select * from create_league('Open space 4e étage')`))[0];
}, 60_000);

afterAll(async () => {
  await drop?.();
});

describe('Scénario 1 · inscription, ligue et grands pronos', () => {
  it('enregistre les choix du joueur et les relit à l’identique', async () => {
    const leagueId = (await db.as(A, `select join_league($1) as id`, [L1.invite_code.toLowerCase()]))[0].id;
    expect(leagueId).toBe(L1.id);
    const winner = await db.optionIds(grand.winner, ['Inès']);
    const tour = await db.optionIds(grand.tour, TOUR);
    await db.as(A, `select submit_prediction($1, $2::uuid[])`, [grand.winner, winner]);
    await db.as(A, `select submit_prediction($1, $2::uuid[])`, [grand.tour, tour]);
    const rows = await db.as(A, `select question_id, option_ids from user_predictions where user_id = $1 order by question_id`, [A]);
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.question_id === grand.tour)!.option_ids).toEqual(tour);
    expect(rows.find((r) => r.question_id === grand.winner)!.option_ids).toEqual(winner);
    // ligue principale positionnée automatiquement
    const [m] = await db.as(A, `select is_primary from league_members where user_id = $1`, [A]);
    expect(m.is_primary).toBe(true);
  });

  it('refuse un mauvais nombre de sélections, un doublon ou une option étrangère', async () => {
    const seven = await db.optionIds(grand.tour, TOUR.slice(0, 7));
    expect(await rpcErr(db.as(A, `select submit_prediction($1, $2::uuid[])`, [grand.tour, seven]))).toContain('BAD_SELECTION_COUNT');
    const [x] = await db.optionIds(grand.finalists, ['Inès']);
    expect(await rpcErr(db.as(A, `select submit_prediction($1, $2::uuid[])`, [grand.finalists, [x, x]]))).toContain('DUPLICATE_OPTION');
    const foreign = await db.optionIds(grand.winner, ['Noah', 'Jade']);
    expect(await rpcErr(db.as(A, `select submit_prediction($1, $2::uuid[])`, [grand.finalists, foreign]))).toContain('INVALID_OPTION');
    expect(await rpcErr(db.as(null, `select submit_prediction($1, $2::uuid[])`, [grand.finalists, foreign]))).not.toBe('NO_ERROR');
  });

  it('accepte « Aucun couple confirmé » seul pour le couple', async () => {
    const none = await db.optionIds(grand.couple, ['Aucun couple confirmé']);
    await db.as(A, `select submit_prediction($1, $2::uuid[])`, [grand.couple, none]);
    const mixed = [none[0], ...(await db.optionIds(grand.couple, ['Inès']))];
    expect(await rpcErr(db.as(A, `select submit_prediction($1, $2::uuid[])`, [grand.couple, mixed]))).toContain('BAD_SELECTION_COUNT');
  });
});

describe('Scénario 2 · confidentialité', () => {
  it('B ne voit pas les pronos de A tant que la question est ouverte', async () => {
    await db.as(B, `select join_league($1)`, [L1.invite_code]);
    await db.as(B, `select submit_prediction($1, $2::uuid[])`, [grand.winner, await db.optionIds(grand.winner, ['Noah'])]);
    expect(await db.as(B, `select * from user_predictions where user_id = $1`, [A])).toHaveLength(0);
    // les stats communautaires restent muettes avant la clôture
    expect(await db.as(B, `select * from v_candidate_pick_stats where question_id = $1`, [grand.winner])).toHaveLength(0);
    // mais le classement de la ligue montre bien les deux joueurs
    const lb = await db.as(B, `select user_id from v_league_leaderboard where league_id = $1`, [L1.id]);
    expect(lb.map((r) => r.user_id).sort()).toEqual([owner, A, B].sort());
  });

  it('un joueur ne voit ni les ligues ni les membres des ligues dont il ne fait pas partie', async () => {
    expect(await db.as(B, `select * from leagues where id = $1`, [L2.id])).toHaveLength(0);
    expect(await db.as(B, `select * from v_league_leaderboard where league_id = $1`, [L2.id])).toHaveLength(0);
  });

  it('un joueur ne peut ni s’attribuer le rôle admin ni modifier son score', async () => {
    await db.as(A, `update profiles set role = 'admin' where id = $1`, [A]).catch(() => undefined);
    expect((await db.sql(`select role from profiles where id = $1`, [A]))[0].role).toBe('player');
    expect(await rpcErr(db.as(A, `insert into score_transactions(season_id, question_id, user_id, kind, points, result_version) values ($1,$2,$3,'base',999,1)`, [season, grand.winner, A]))).toMatch(/row-level security/);
    expect(await rpcErr(db.as(A, `select publish_result($1, '{}')`, [grand.winner]))).toContain('FORBIDDEN');
  });
});

describe('Scénario 3 · verrouillage', () => {
  it('après la clôture, submit_prediction lève QUESTION_LOCKED et l’écriture directe est refusée', async () => {
    await db.expire(grand.winner);
    const noah = await db.optionIds(grand.winner, ['Noah']);
    expect(await rpcErr(db.as(A, `select submit_prediction($1, $2::uuid[])`, [grand.winner, noah]))).toContain('QUESTION_LOCKED');
    expect(await rpcErr(db.as(A, `insert into user_predictions(question_id, user_id, option_ids) values ($1, $2, $3::uuid[])`, [grand.winner, A, noah]))).toMatch(/row-level security/);
    await db.as(A, `update user_predictions set option_ids = $2::uuid[] where question_id = $1 and user_id = $3`, [grand.winner, noah, A]);
    await db.as(A, `delete from user_predictions where question_id = $1`, [grand.winner]);
    const [r] = await db.sql(`select option_ids from user_predictions where question_id = $1 and user_id = $2`, [grand.winner, A]);
    expect(r.option_ids).toEqual(await db.optionIds(grand.winner, ['Inès']));
    // une fois clôturée, les réponses des autres et les stats deviennent visibles
    expect(await db.as(B, `select * from user_predictions where user_id = $1 and question_id = $2`, [A, grand.winner])).toHaveLength(1);
    const stats = await db.as(B, `select pct from v_candidate_pick_stats where question_id = $1 and candidate_id = $2`, [grand.winner, cand['Inès']]);
    expect(stats[0].pct).toBe(50);
  });

  it('le barème est figé après l’ouverture', async () => {
    expect(await rpcErr(db.as(admin, `update questions set points = 1 where id = $1`, [grand.winner]))).toContain('QUESTION_FROZEN');
  });
});

let elim: string;
describe('Scénario 4 · élimination et prévisualisation', () => {
  it('preview_result renvoie les bons joueurs sans rien écrire', async () => {
    for (const n of ['Inès', 'Noah', 'Jade']) await db.as(admin, `select admin_set_candidate_status($1, 'nominated')`, [cand[n]]);
    elim = await weeklyQuestion('Qui sera éliminé ?', { source: 'candidates_nominated' });
    const labels = (await db.sql(`select label from question_options where question_id = $1 order by label`, [elim])).map((r) => r.label);
    expect(labels).toEqual(['Inès', 'Jade', 'Noah']);
    await db.as(A, `select submit_prediction($1, $2::uuid[])`, [elim, await db.optionIds(elim, ['Noah'])]);
    await db.as(B, `select submit_prediction($1, $2::uuid[])`, [elim, await db.optionIds(elim, ['Jade'])]);
    expect(await rpcErr(db.as(admin, `select publish_result($1, $2::uuid[])`, [elim, await db.optionIds(elim, ['Noah'])]))).toContain('QUESTION_STILL_OPEN');
    await db.expire(elim);

    const before = (await db.sql(`select count(*)::int as n from score_transactions`))[0].n;
    const rows = await db.as(admin, `select * from preview_result($1, $2::uuid[])`, [elim, await db.optionIds(elim, ['Noah'])]);
    expect(rows.find((r) => r.user_id === A).base).toBe(30);
    expect(rows.find((r) => r.user_id === B).base).toBe(0);
    expect((await db.sql(`select count(*)::int as n from score_transactions`))[0].n).toBe(before);
    expect(await rpcErr(db.as(A, `select * from preview_result($1, '{}')`, [elim]))).toContain('FORBIDDEN');
  });
});

describe('Scénario 5 · publication', () => {
  it('crée une transaction par répondant, met à jour les classements et notifie', async () => {
    const tA = await totalOf(A);
    await db.as(admin, `select publish_result($1, $2::uuid[])`, [elim, await db.optionIds(elim, ['Noah'])]);
    const tx = await db.sql(`select user_id, points from score_transactions where question_id = $1 and kind = 'base'`, [elim]);
    expect(tx).toHaveLength(2);
    expect(await totalOf(A)).toBe(tA + 30);
    const lb = await db.as(A, `select user_id, total, rank from v_league_leaderboard where league_id = $1 order by rank`, [L1.id]);
    expect(lb[0]).toMatchObject({ user_id: A, total: 30, rank: 1 });
    expect(lb.filter((r) => r.rank === 2)).toHaveLength(2); // B et Camille à égalité (0 pt) partagent le rang 2
    const notifs = await db.as(A, `select title from notifications where kind = 'results_published'`);
    expect(notifs.map((n) => n.title)).toContain('+30 pts !');
    expect(await db.as(A, `select * from notifications where user_id = $1`, [B])).toHaveLength(0);
    expect(await db.as(B, `select correct_option_ids from official_results where question_id = $1`, [elim])).toHaveLength(1);
  });
});

describe('Scénario 6 · correction', () => {
  it('passe en version 2, remplace les transactions sans doublon et journalise', async () => {
    await db.as(admin, `select publish_result($1, $2::uuid[])`, [elim, await db.optionIds(elim, ['Jade'])]);
    const [res] = await db.sql(`select version from official_results where question_id = $1`, [elim]);
    expect(res.version).toBe(2);
    const base = await db.sql(`select user_id, points from score_transactions where question_id = $1 and kind = 'base'`, [elim]);
    expect(base).toHaveLength(2);
    expect(base.find((r) => r.user_id === A).points).toBe(0);
    expect(base.find((r) => r.user_id === B).points).toBe(30);
    expect(await totalOf(A)).toBe(0);
    const [log] = await db.as(admin, `select old_value, new_value from admin_logs where action = 'result.correct' and entity_id = $1`, [elim]);
    expect(log.old_value.correct).toEqual(['Noah']);
    expect(log.new_value.correct).toEqual(['Jade']);
    expect(await db.as(A, `select * from admin_logs`)).toHaveLength(0);
  });
});

describe('Scénario 7 · multi-ligues', () => {
  it('le total de B est identique dans ses deux ligues, sans ressaisie', async () => {
    await db.as(B, `select join_league($1)`, [L2.invite_code]);
    const rows = await db.as(B, `select league_id, total from v_league_leaderboard where user_id = $1`, [B]);
    expect(rows).toHaveLength(2);
    expect(rows[0].total).toBe(30);
    expect(rows[1].total).toBe(30);
    // la ligue principale reste la première rejointe
    const prim = await db.as(B, `select league_id from league_members where user_id = $1 and is_primary`, [B]);
    expect(prim).toEqual([{ league_id: L1.id }]);
    await db.as(B, `select set_primary_league($1)`, [L2.id]);
    expect(await db.as(B, `select league_id from league_members where user_id = $1 and is_primary`, [B])).toEqual([{ league_id: L2.id }]);
  });
});

describe('Cas limites', () => {
  it('question annulée → 0 point, transactions supprimées', async () => {
    const q = await weeklyQuestion('Qui obtiendra l’immunité ?', { points: 20 });
    await db.as(A, `select submit_prediction($1, $2::uuid[])`, [q, await db.optionIds(q, ['Malo'])]);
    await db.expire(q);
    await db.as(admin, `select publish_result($1, $2::uuid[])`, [q, await db.optionIds(q, ['Malo'])]);
    expect((await db.sql(`select count(*)::int n from score_transactions where question_id = $1`, [q]))[0].n).toBe(1);
    expect(await rpcErr(db.as(admin, `select cancel_question($1, '')`, [q]))).toContain('REASON_REQUIRED');
    await db.as(admin, `select cancel_question($1, 'Mécanique absente ce prime')`, [q]);
    expect((await db.sql(`select count(*)::int n from score_transactions where question_id = $1`, [q]))[0].n).toBe(0);
    expect(await rpcErr(db.as(admin, `select publish_result($1, $2::uuid[])`, [q, await db.optionIds(q, ['Malo'])]))).toContain('QUESTION_CANCELLED');
  });

  it('égalité officielle : les deux groupes marquent ; sans réponse : aucune transaction', async () => {
    const q = await weeklyQuestion('Qui terminera premier des évaluations ?', { points: 20 });
    await db.as(A, `select submit_prediction($1, $2::uuid[])`, [q, await db.optionIds(q, ['Inès'])]);
    await db.as(B, `select submit_prediction($1, $2::uuid[])`, [q, await db.optionIds(q, ['Léna'])]);
    await db.expire(q);
    await db.as(admin, `select publish_result($1, $2::uuid[])`, [q, await db.optionIds(q, ['Inès', 'Léna'])]);
    const tx = await db.sql(`select user_id, points from score_transactions where question_id = $1`, [q]);
    expect(tx.map((t) => t.points)).toEqual([20, 20]);
    expect(tx.find((t) => t.user_id === C)).toBeUndefined();
  });

  it('une réponse enregistrée après la clôture est ignorée (défense en profondeur)', async () => {
    const q = await weeklyQuestion('Qui sera sauvé par les élèves ?', { points: 25 });
    await db.as(A, `select submit_prediction($1, $2::uuid[])`, [q, await db.optionIds(q, ['Lou'])]);
    await db.expire(q);
    await db.sql(`update user_predictions set updated_at = now() + interval '1 minute' where question_id = $1`, [q]);
    await db.as(admin, `select publish_result($1, $2::uuid[])`, [q, await db.optionIds(q, ['Lou'])]);
    expect(await db.sql(`select * from score_transactions where question_id = $1`, [q])).toHaveLength(0);
  });

  it('un candidat éliminé ne peut pas être choisi dans une question « en compétition »', async () => {
    const q = await weeklyQuestion('Qui sera nommé la semaine prochaine ?', { max: 3, points: 15 });
    await db.as(admin, `select admin_set_candidate_status($1, 'eliminated')`, [cand['Théo']]);
    const ids = await db.optionIds(q, ['Théo', 'Malo', 'Lou']);
    expect(await rpcErr(db.as(A, `select submit_prediction($1, $2::uuid[])`, [q, ids]))).toContain('CANDIDATE_ELIMINATED');
    const [c] = await db.sql(`select eliminated_at, eliminated_prime_id from candidates where id = $1`, [cand['Théo']]);
    expect(c.eliminated_prime_id).toBe(prime1);
    expect(c.eliminated_at).not.toBeNull();
  });

  it('nombre exact et sélection ordonnée', async () => {
    const n = await weeklyQuestion('Combien d’artistes invités ?', { type: 'exact_number', source: 'custom', points: 20 });
    await db.as(A, `select submit_prediction($1, '{}', 4)`, [n]);
    await db.as(B, `select submit_prediction($1, '{}', 3)`, [n]);
    await db.expire(n);
    await db.as(admin, `select publish_result($1, '{}', 4)`, [n]);
    const tx = await db.sql(`select user_id, points from score_transactions where question_id = $1 order by points desc`, [n]);
    expect(tx[0]).toMatchObject({ user_id: A, points: 20 });
    expect(tx[1].points).toBe(0);

    const o = await weeklyQuestion('Top 3 des évaluations', { type: 'ordered', max: 3, points: 10 });
    await db.as(A, `select submit_prediction($1, $2::uuid[])`, [o, await db.optionIds(o, ['Inès', 'Jade', 'Malo'])]);
    await db.expire(o);
    await db.as(admin, `select publish_result($1, $2::uuid[])`, [o, await db.optionIds(o, ['Inès', 'Malo', 'Jade'])]);
    expect((await db.sql(`select points from score_transactions where question_id = $1 and user_id = $2`, [o, A]))[0].points).toBe(10);
  });

  it('ouvrir une question exige une règle de validation', async () => {
    const [{ id }] = await db.as(admin, `select admin_save_question($1::jsonb) as id`, [
      JSON.stringify({ prime_id: prime1, category: 'fun', type: 'yes_no', title: 'Un duo surprise ?', options_source: 'yes_no', points: 15, closes_at: new Date(Date.now() + 3600_000).toISOString() }),
    ]);
    expect(await rpcErr(db.as(admin, `select open_question($1)`, [id]))).toContain('CRITERIA_REQUIRED');
    expect(await db.as(A, `select * from questions where id = $1`, [id])).toHaveLength(0); // brouillon invisible
    const opts = await db.sql(`select label from question_options where question_id = $1 order by sort_order`, [id]);
    expect(opts.map((r) => r.label)).toEqual(['Oui', 'Non']);
  });
});

describe('Scénario 8 · fin de saison', () => {
  it('attribue les derniers points, les badges et le champion de chaque ligue', async () => {
    // A a déjà fait gagnant (Inès) et tournée (8/8) ; B tente la tournée à 7/8 + 1 faux
    await db.as(B, `select submit_prediction($1, $2::uuid[])`, [grand.tour, await db.optionIds(grand.tour, [...TOUR.slice(0, 7), 'Yanis'])]);
    await db.as(A, `select submit_prediction($1, $2::uuid[])`, [grand.finalists, await db.optionIds(grand.finalists, ['Inès', 'Noah'])]);
    for (const k of Object.keys(grand)) await db.expire(grand[k]);

    const tA = await totalOf(A);
    await db.as(admin, `select publish_result($1, $2::uuid[])`, [grand.tour, await db.optionIds(grand.tour, TOUR)]);
    expect((await db.sql(`select sum(points)::int s from score_transactions where question_id = $1 and user_id = $2`, [grand.tour, A]))[0].s).toBe(210);
    expect((await db.sql(`select sum(points)::int s from score_transactions where question_id = $1 and user_id = $2`, [grand.tour, B]))[0].s).toBe(140);
    await db.as(admin, `select publish_result($1, $2::uuid[])`, [grand.winner, await db.optionIds(grand.winner, ['Inès'])]);
    await db.as(admin, `select publish_result($1, $2::uuid[])`, [grand.finalists, await db.optionIds(grand.finalists, ['Inès', 'Jade'])]);
    await db.as(admin, `select publish_result($1, $2::uuid[])`, [grand.couple, await db.optionIds(grand.couple, ['Aucun couple confirmé'])]);
    await db.as(admin, `select publish_result($1, $2::uuid[])`, [grand.last_out, await db.optionIds(grand.last_out, ['Noah'])]);
    expect(await totalOf(A)).toBe(tA + 210 + 100 + 30 + 30);

    const [phase] = await db.as(A, `select phase from v_seasons where id = $1`, [season]);
    expect(phase.phase).toBe('finished');

    // prime 1 : toutes les questions tranchées → on peut clôturer ; la finale aussi
    await db.sql(`update questions set status = 'cancelled', cancelled_reason = 'test' where prime_id = $1 and status in ('open','closed')`, [prime1]);
    await db.as(admin, `select close_prime($1)`, [prime1]);
    await db.as(admin, `select close_prime($1)`, [finale]);
    const snaps = await db.as(A, `select rank from rank_snapshots where prime_id = $1 and league_id = $2 and user_id = $3`, [finale, L1.id, A]);
    expect(snaps[0].rank).toBe(1);

    const badges = (await db.as(A, `select badge_code from user_badges where user_id = $1`, [A])).map((r) => r.badge_code).sort();
    expect(badges).toEqual(expect.arrayContaining(['champion', 'tour_manager', 'visionnaire']));
    const champs = await db.sql(`select user_id from user_badges where badge_code = 'champion'`);
    expect(champs.map((r) => r.user_id).sort()).toEqual([A, B].sort()); // A mène L1, B mène L2
    // idempotent : relancer ne crée pas de doublon
    await db.as(admin, `select award_badges($1)`, [season]);
    expect((await db.sql(`select count(*)::int n from user_badges where user_id = $1 and badge_code = 'champion'`, [A]))[0].n).toBe(1);
    const n = await db.as(A, `select title from notifications where kind = 'badge_earned'`);
    expect(n.length).toBeGreaterThanOrEqual(3);
  });

  it('l’export RGPD renvoie les données du joueur, la suppression efface le compte', async () => {
    const [{ d }] = await db.as(C, `select export_my_data() as d`);
    expect(d.profil.pseudo).toBe('Manon');
    await db.as(C, `select delete_my_account()`);
    expect(await db.sql(`select * from profiles where id = $1`, [C])).toHaveLength(0);
  });
});
