import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';

const ROOT = join(__dirname, '..', '..');
const ADMIN_URL = process.env.TEST_PG_URL ?? 'postgres://postgres:postgres@localhost:5432/postgres';

/** Crée une base vierge, applique le shim Supabase puis toutes les migrations. */
export async function freshDb(): Promise<{ db: Db; drop: () => Promise<void> }> {
  const name = `gp_test_${process.pid}_${Math.floor(Math.random() * 1e6)}`;
  const admin = new pg.Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(`create database ${name}`);
  await admin.end();

  const url = new URL(ADMIN_URL);
  url.pathname = '/' + name;
  const client = new pg.Client({ connectionString: url.toString() });
  await client.connect();
  await client.query(readFileSync(join(ROOT, 'tests/shim/supabase_shim.sql'), 'utf8'));
  for (const f of readdirSync(join(ROOT, 'migrations')).filter((f) => f.endsWith('.sql')).sort()) {
    await client.query(readFileSync(join(ROOT, 'migrations', f), 'utf8'));
  }
  const db = new Db(client);
  return {
    db,
    drop: async () => {
      await client.end();
      const a = new pg.Client({ connectionString: ADMIN_URL });
      await a.connect();
      await a.query(`drop database if exists ${name} with (force)`);
      await a.end();
    },
  };
}

export class Db {
  constructor(public client: pg.Client) {}

  /** Requête en superutilisateur (hors RLS), pour préparer les données. */
  async sql<T = any>(text: string, params: unknown[] = []): Promise<T[]> {
    return (await this.client.query(text, params)).rows as T[];
  }

  /** Requête exécutée comme un utilisateur connecté (rôle authenticated + JWT), RLS active. */
  async as<T = any>(userId: string | null, text: string, params: unknown[] = []): Promise<T[]> {
    await this.client.query('begin');
    try {
      await this.client.query(`set local role ${userId ? 'authenticated' : 'anon'}`);
      await this.client.query(`select set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claim.role', $2, true)`, [
        userId ?? '',
        userId ? 'authenticated' : 'anon',
      ]);
      const r = await this.client.query(text, params);
      await this.client.query('commit');
      return r.rows as T[];
    } catch (e) {
      await this.client.query('rollback');
      throw e;
    }
  }

  async user(pseudo: string, role: 'player' | 'admin' = 'player'): Promise<string> {
    const [{ id }] = await this.sql(`insert into auth.users(email) values ($1) returning id`, [`${pseudo.toLowerCase()}@test.local`]);
    await this.as(id, `insert into profiles(id, pseudo) values ($1, $2)`, [id, pseudo]);
    if (role === 'admin') await this.sql(`update profiles set role = 'admin' where id = $1`, [id]);
    return id;
  }

  /** Avance l'heure de clôture d'une question dans le passé (simule le temps qui passe). */
  async expire(questionId: string) {
    await this.sql(`update questions set closes_at = now() where id = $1`, [questionId]);
  }

  async optionIds(questionId: string, labels: string[]): Promise<string[]> {
    const rows = await this.sql<{ id: string; label: string }>(`select id, label from question_options where question_id = $1`, [questionId]);
    return labels.map((l) => {
      const r = rows.find((x) => x.label === l);
      if (!r) throw new Error(`option ${l} introuvable`);
      return r.id;
    });
  }
}
