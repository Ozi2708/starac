import { Wordmark } from '@/components/ui/game';

export function NotConfigured() {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-app flex-col justify-center gap-5 px-5">
      <Wordmark size={40} />
      <p className="t-body-l text-secondary">Il manque la connexion à Supabase.</p>
      <ol className="t-body-s m-0 flex flex-col gap-2 pl-5 text-secondary">
        <li>Copie <code>.env.example</code> vers <code>.env</code>.</li>
        <li>Renseigne <code>VITE_SUPABASE_URL</code> et <code>VITE_SUPABASE_ANON_KEY</code>.</li>
        <li>Relance <code>npm run dev</code>.</li>
      </ol>
    </main>
  );
}
