-- =====================================================================
-- DONNÉES DE DÉMO — FICTIVES. À charger UNIQUEMENT sur un projet de démonstration séparé.
-- Candidats, joueurs et résultats sont inventés et marqués « DÉMO » (nom de saison).
-- Comptes de connexion :
--   joueur : demo@legrandprono.app        / grandprono-demo   (pseudo Sam)
--   admin  : admin-demo@legrandprono.app  / grandprono-demo   (pseudo Alex)
-- Usage : psql "$DATABASE_URL" -f supabase/seed.demo.sql
-- =====================================================================
do $demo$
declare
  v_admin uuid; v_season uuid; v_prime uuid; v_q uuid; v_first timestamptz;
  v_now timestamptz := now();
  p record; q record; k int; i int; n int; opts uuid[]; pick uuid[];
  cands text[] := array['Inès','Noah','Jade','Malo','Léna','Théo','Chloé','Enzo','Lou','Yanis','Maëlle','Sacha'];
  players text[] := array['Alex','Sam','Camille','Hugo','Manon','Rayan','Léo','Zoé','Karim','Nadia','Julie','Thomas','Kevin','Lucie','Paul','Emma'];
  ids jsonb := '{}'; cid jsonb := '{}'; prime_ids uuid[] := '{}';
  canap uuid; bureau uuid;
  -- historique des nominations (semaines 1 à 6) : 1 = nommé·e, null = plus en compétition
  hist jsonb := '{"Inès":[0,0,1,0,0,1],"Noah":[1,0,0,1,0,1],"Jade":[0,1,0,0,0,1],"Malo":[0,0,0,0,0,0],"Léna":[1,0,1,0,0,0],"Théo":[0,1,1,0,1,null],"Chloé":[0,0,0,1,0,0],"Enzo":[0,0,0,0,1,0],"Lou":[0,0,0,1,0,0],"Yanis":[0,0,1,0,0,0],"Maëlle":[0,0,0,0,1,0],"Sacha":[1,1,null,null,null,null]}';
  info jsonb := '{
    "Inès":{"age":21,"city":"Lyon","bio":"Chanteuse soul formée au conservatoire, elle écrit ses propres textes depuis ses 15 ans."},
    "Noah":{"age":23,"city":"Lille","bio":"Guitariste et auteur-compositeur, il a longtemps joué dans les bars de sa ville."},
    "Jade":{"age":19,"city":"Marseille","bio":"Danseuse avant d’être chanteuse, elle mise tout sur la scène."},
    "Malo":{"age":22,"city":"Rennes","bio":"Pianiste autodidacte, fan de variété française."},
    "Léna":{"age":20,"city":"Bordeaux","bio":"Voix pop puissante, repérée sur les réseaux."},
    "Théo":{"age":24,"city":"Nantes","bio":"Rappeur et beatmaker, il voulait se confronter au chant."},
    "Chloé":{"age":18,"city":"Toulouse","bio":"La benjamine de la promo, choriste depuis l’enfance."},
    "Enzo":{"age":21,"city":"Nice","bio":"Comédien de formation, il chante depuis la comédie musicale."},
    "Lou":{"age":22,"city":"Strasbourg","bio":"Folk et guitare-voix, un univers intimiste."},
    "Yanis":{"age":20,"city":"Montpellier","bio":"Danseur hip-hop reconverti dans le chant R’n’B."},
    "Maëlle":{"age":23,"city":"Grenoble","bio":"Voix lyrique, elle rêve de comédie musicale."},
    "Sacha":{"age":25,"city":"Paris","bio":"Le plus âgé de la promo, ancien serveur passionné de soul."}}';
  has_identities boolean := exists (select 1 from pg_tables where schemaname = 'auth' and tablename = 'identities');
  uid uuid; nm text;
begin
  -- ---------- Comptes ----------
  foreach nm in array players loop
    uid := gen_random_uuid();
    begin
      execute $u$insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
                 raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                 confirmation_token, recovery_token, email_change_token_new, email_change)
               values ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2,
                 crypt('grandprono-demo', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')$u$
        using uid, case nm when 'Sam' then 'demo@legrandprono.app' when 'Alex' then 'admin-demo@legrandprono.app'
                           else 'demo+' || lower(translate(nm, 'éèëÉ', 'eeeE')) || '@legrandprono.app' end;
    exception when undefined_column then
      insert into auth.users(id, email) values (uid, 'demo+' || lower(translate(nm, 'éèëÉ', 'eeeE')) || '@legrandprono.app');
    end;
    if has_identities then
      execute $i$insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
               select gen_random_uuid(), id, id::text, jsonb_build_object('sub', id::text, 'email', email), 'email', now(), now(), now()
               from auth.users where id = $1$i$ using uid;
    end if;
    insert into profiles(id, pseudo, role, created_at) values (uid, nm, case when nm = 'Alex' then 'admin' else 'player' end::user_role, now() - interval '40 days');
    ids := ids || jsonb_build_object(nm, uid);
  end loop;
  v_admin := (ids->>'Alex')::uuid;
  perform set_config('request.jwt.claim.sub', v_admin::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_admin, 'role', 'authenticated')::text, true);

  -- ---------- Saison et primes : prime 6 dans ~2 jours ----------
  v_first := date_trunc('minute', v_now + interval '2 days 3 hours') - interval '35 days';
  update seasons set is_current = false where is_current;
  insert into seasons(name, year, is_current, first_prime_at, grand_predictions_close_at, final_at)
  values ('Star Academy 2026 · DÉMO', 2026, true, v_first, v_first - interval '10 minutes', v_first + interval '63 days')
  returning id into v_season;
  for k in 1..10 loop
    insert into primes(season_id, number, airs_at, is_final) values (v_season, k, v_first + (k - 1) * interval '7 days', k = 10)
    returning id into v_prime;
    prime_ids := prime_ids || v_prime;
  end loop;

  -- ---------- Candidats ----------
  foreach nm in array cands loop
    insert into candidates(season_id, first_name, age, city, bio, entered_at)
    values (v_season, nm, (info->nm->>'age')::int, info->nm->>'city', info->nm->>'bio', (v_first - interval '1 day')::date)
    returning id into uid;
    cid := cid || jsonb_build_object(nm, uid);
    for k in 1..6 loop
      if hist->nm->>(k - 1) is not null then
        insert into candidate_eligible_weeks values (uid, prime_ids[k]);
        if (hist->nm->>(k - 1))::int = 1 then insert into candidate_nominations values (uid, prime_ids[k]); end if;
      end if;
    end loop;
  end loop;

  -- ---------- Grands pronos (ouverts avant le 1er prime, puis verrouillés) ----------
  perform admin_create_grand_questions(v_season);
  update questions set status = 'closed' where season_id = v_season and category = 'grand';
  for p in select key, value from jsonb_each_text(ids) where key <> 'Alex' loop
    for q in select * from questions where season_id = v_season and category = 'grand' loop
      select array_agg(o.id order by o.sort_order) into opts from question_options o where o.question_id = q.id and not o.is_none_option;
      if p.key = 'Sam' then
        pick := array(select o.id from question_options o join candidates c on c.id = o.candidate_id where o.question_id = q.id and c.first_name = any(
          case q.key when 'winner' then array['Inès'] when 'finalists' then array['Inès','Noah']
            when 'tour' then array['Inès','Noah','Jade','Malo','Léna','Chloé','Enzo','Lou'] when 'first_out' then array['Sacha']
            when 'most_nominated' then array['Jade'] when 'least_nominated' then array['Malo'] when 'first_finalist' then array['Noah']
            when 'last_out' then array['Lou'] else array['Léna','Enzo'] end));
      else
        n := q.max_selections; pick := '{}';
        i := abs(hashtext(p.key || q.key));
        while coalesce(array_length(pick, 1), 0) < n loop
          if not (opts[1 + i % array_length(opts, 1)] = any(pick)) then pick := pick || opts[1 + i % array_length(opts, 1)]; end if;
          i := i + 7;
        end loop;
      end if;
      insert into user_predictions(question_id, user_id, option_ids, submitted_at, updated_at)
      values (q.id, p.value::uuid, pick, v_first - interval '5 days', v_first - interval '5 days');
    end loop;
  end loop;

  -- ---------- Ligues ----------
  insert into leagues(season_id, name, invite_code, created_by, created_at)
  values (v_season, 'Les Stars du Canap’', 'CANAP-7K2Q', (ids->>'Sam')::uuid, v_first - interval '15 days') returning id into canap;
  insert into leagues(season_id, name, invite_code, created_by, created_at)
  values (v_season, 'Open space 4e étage', 'BUREAU-P9XD', (ids->>'Julie')::uuid, v_first - interval '12 days') returning id into bureau;
  foreach nm in array array['Sam','Camille','Hugo','Manon','Rayan','Léo','Zoé','Karim'] loop
    insert into league_members(league_id, user_id, role, is_primary) values (canap, (ids->>nm)::uuid, case when nm = 'Sam' then 'owner' else 'member' end::league_role, true);
  end loop;
  foreach nm in array array['Julie','Nadia','Thomas','Kevin','Lucie','Sam','Paul','Emma'] loop
    insert into league_members(league_id, user_id, role, is_primary) values (bureau, (ids->>nm)::uuid, case when nm = 'Julie' then 'owner' else 'member' end::league_role, nm <> 'Sam');
  end loop;

  -- ---------- Primes 1 à 5 : questions publiées, semaine clôturée ----------
  for k in 1..5 loop
    for q in select * from (values
        ('eval', 'Qui terminera premier des évaluations ?', 'medal', 20, 'candidates_competing', 'Le candidat classé premier des évaluations officielles de la semaine. Égalités acceptées.'),
        ('elim', 'Qui sera éliminé ?', 'flame', 30, 'candidates_nominated', 'Le candidat nommé qui quitte officiellement le château à l’issue du prime.'),
        ('immu', 'Qui obtiendra l’immunité ?', 'shield', 20, 'candidates_competing', 'Le candidat officiellement immunisé pour la semaine suivante.')
      ) as t(kind, title, icon, pts, src, crit)
      where t.kind <> 'elim' or k in (2, 5) loop
      -- état des candidats au moment du prime
      update candidates set status = case when first_name = 'Sacha' and k > 2 then 'eliminated' when first_name = 'Théo' and k > 5 then 'eliminated'
                                          when (hist->first_name->>(k - 1))::int = 1 then 'nominated' else 'competing' end::candidate_status
      where season_id = v_season;
      insert into questions(season_id, prime_id, category, type, title, icon, validation_criteria, options_source, points, closes_at, status, sort_order)
      values (v_season, prime_ids[k], 'weekly', 'single', q.title, q.icon, q.crit, q.src::options_source, q.pts,
              v_first + (k - 1) * interval '7 days' - interval '70 minutes', 'draft', case q.kind when 'elim' then 1 when 'eval' then 2 else 3 end)
      returning id into v_q;
      perform sync_question_options(v_q);
      update questions set status = 'closed' where id = v_q;
      select array_agg(o.id order by o.sort_order) into opts from question_options o where o.question_id = v_q;
      for p in select key, value from jsonb_each_text(ids) where key <> 'Alex' loop
        i := abs(hashtext(p.key || q.kind || k));
        continue when i % 9 = 0;  -- quelques oublis
        insert into user_predictions(question_id, user_id, option_ids, submitted_at, updated_at)
        values (v_q, p.value::uuid, array[opts[1 + i % array_length(opts, 1)]], v_first + (k - 2) * interval '7 days' + interval '3 days', v_first + (k - 2) * interval '7 days' + interval '3 days');
      end loop;
      perform publish_result(v_q, array(select o.id from question_options o join candidates c on c.id = o.candidate_id where o.question_id = v_q and c.first_name =
        case q.kind when 'elim' then (case k when 2 then 'Sacha' else 'Théo' end)
                    when 'eval' then (array['Inès','Malo','Jade','Inès','Noah'])[k]
                    else (array['Léna','Malo','Chloé','Malo','Lou'])[k] end));
    end loop;
    if k = 2 then  -- le premier éliminé est connu
      perform publish_result((select id from questions where season_id = v_season and key = 'first_out'),
        array(select o.id from question_options o join candidates c on c.id = o.candidate_id join questions qq on qq.id = o.question_id
              where qq.season_id = v_season and qq.key = 'first_out' and c.first_name = 'Sacha'));
    end if;
    perform close_prime(prime_ids[k]);
  end loop;

  -- ---------- Semaine 6 : nommés Inès, Noah, Jade ; Malo immunisé ; pronos ouverts ----------
  update candidates set status = case first_name when 'Sacha' then 'eliminated' when 'Théo' then 'eliminated'
    when 'Inès' then 'nominated' when 'Noah' then 'nominated' when 'Jade' then 'nominated' when 'Malo' then 'immune' else 'competing' end::candidate_status,
    eliminated_prime_id = case first_name when 'Sacha' then prime_ids[2] when 'Théo' then prime_ids[5] end,
    eliminated_at = case first_name when 'Sacha' then v_first + interval '7 days 3 hours' when 'Théo' then v_first + interval '28 days 3 hours' end
  where season_id = v_season;

  perform admin_save_question(jsonb_build_object('prime_id', prime_ids[6], 'category', 'weekly', 'type', 'single', 'title', 'Qui sera éliminé ?',
    'description', 'Parmi les trois nommés de la semaine.', 'icon', 'flame', 'options_source', 'candidates_nominated', 'points', 30, 'sort_order', 1,
    'validation_criteria', 'Le candidat nommé qui quitte officiellement le château à l’issue du prime. Double élimination : tous comptent.',
    'closes_at', date_trunc('minute', v_now + interval '2 days 1 hour 55 minutes'), 'status', 'open'));
  perform admin_save_question(jsonb_build_object('prime_id', prime_ids[6], 'category', 'weekly', 'type', 'multiple', 'title', 'Qui sera nommé la semaine prochaine ?',
    'description', 'Choisis 3 candidats. 15 pts par nommé trouvé.', 'icon', 'users', 'options_source', 'candidates_competing', 'points', 15,
    'min_selections', 3, 'max_selections', 3, 'sort_order', 2,
    'validation_criteria', 'Les candidats officiellement nommés lors de l’annonce de la semaine suivante. 15 pts par nommé trouvé.',
    'closes_at', date_trunc('minute', v_now + interval '1 day 22 hours'), 'status', 'open'));
  perform admin_save_question(jsonb_build_object('prime_id', prime_ids[6], 'category', 'weekly', 'type', 'single', 'title', 'Qui terminera premier des évaluations ?',
    'description', 'En cas d’égalité officielle, toutes les bonnes réponses comptent.', 'icon', 'medal', 'options_source', 'candidates_competing', 'points', 20, 'sort_order', 3,
    'validation_criteria', 'Le candidat classé premier des évaluations officielles de la semaine. Égalités acceptées.',
    'closes_at', date_trunc('minute', v_now + interval '20 hours 48 minutes'), 'status', 'open'));
  perform admin_save_question(jsonb_build_object('prime_id', prime_ids[6], 'category', 'weekly', 'type', 'single', 'title', 'Qui obtiendra l’immunité ?',
    'description', 'Le candidat immunisé ne peut pas être nommé la semaine suivante.', 'icon', 'shield', 'options_source', 'candidates_competing', 'points', 20, 'sort_order', 4,
    'validation_criteria', 'Le candidat officiellement immunisé pour la semaine suivante.',
    'closes_at', date_trunc('minute', v_now + interval '20 hours 48 minutes'), 'status', 'open'));
  -- Les paris improbables
  perform admin_save_question(jsonb_build_object('prime_id', prime_ids[6], 'category', 'fun', 'type', 'yes_no', 'title', 'Y aura-t-il un duo surprise avec un ancien candidat ?',
    'options_source', 'yes_no', 'points', 15, 'sort_order', 10, 'validation_criteria', 'un ancien candidat chante en direct avec un élève pendant le prime.',
    'closes_at', date_trunc('minute', v_now + interval '2 days 1 hour 50 minutes'), 'status', 'open'));
  perform admin_save_question(jsonb_build_object('prime_id', prime_ids[6], 'category', 'fun', 'type', 'yes_no', 'title', 'Un candidat oubliera-t-il ses paroles ?',
    'options_source', 'yes_no', 'points', 10, 'sort_order', 11, 'validation_criteria', 'un candidat s’arrête ou reprend sa chanson, constaté à l’antenne.',
    'closes_at', date_trunc('minute', v_now + interval '2 days 1 hour 50 minutes'), 'status', 'open'));
  perform admin_save_question(jsonb_build_object('prime_id', prime_ids[6], 'category', 'fun', 'type', 'single', 'title', 'Combien d’artistes invités sur le prime ?',
    'options_source', 'custom', 'options', jsonb_build_array('1 – 2', '3 – 4', '5 et +'), 'points', 20, 'sort_order', 12,
    'validation_criteria', 'nombre d’artistes invités crédités au générique de fin.',
    'closes_at', date_trunc('minute', v_now + interval '2 days 1 hour 50 minutes'), 'status', 'open'));
  perform admin_save_question(jsonb_build_object('prime_id', prime_ids[6], 'category', 'fun', 'type', 'yes_no', 'title', 'Deux candidats seront-ils immunisés ?',
    'options_source', 'yes_no', 'points', 10, 'sort_order', 13, 'validation_criteria', 'deux immunités officielles annoncées pour la semaine.',
    'closes_at', date_trunc('minute', v_now + interval '20 hours 48 minutes'), 'status', 'open'));

  -- Quelques réponses déjà enregistrées pour la semaine 6 (Sam a joué « évaluations »)
  for p in select key, value from jsonb_each_text(ids) where key not in ('Alex') loop
    for q in select * from questions where prime_id = prime_ids[6] and category = 'weekly' and max_selections = 1 loop
      i := abs(hashtext(p.key || q.id::text));
      continue when p.key = 'Sam' and q.sort_order <> 3;
      continue when p.key <> 'Sam' and i % 3 = 0;
      select array_agg(o.id order by o.sort_order) into opts from question_options o where o.question_id = q.id;
      insert into user_predictions(question_id, user_id, option_ids)
      values (q.id, p.value::uuid,
              case when p.key = 'Sam' then array(select o.id from question_options o where o.question_id = q.id and o.label = 'Inès')
                   else array[opts[1 + i % array_length(opts, 1)]] end);
    end loop;
  end loop;

  -- Notifications de démo pour Sam
  insert into notifications(user_id, kind, title, body, link, created_at) values
    ((ids->>'Sam')::uuid, 'predictions_open', 'Pronos du prime 6 ouverts', '4 questions et 4 paris improbables t’attendent.', '/pronos', v_now - interval '1 day');
end
$demo$;
