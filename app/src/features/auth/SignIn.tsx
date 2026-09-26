import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Button, IconButton, Input, LegalNote, SegmentedControl } from '@/components/ui/core';
import { Wordmark } from '@/components/ui/game';
import { useToast } from '@/components/ui/feedback';
import { MobileShell } from '@/app/MobileLayout';

type Mode = 'link' | 'password';

export function SignIn() {
  const [params] = useSearchParams();
  const next = params.get('next') || '/';
  const { userId, profile, loading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [mode, setMode] = useState<Mode>('link');
  const [signup, setSignup] = useState(params.get('mode') === 'inscription');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && userId) return <Navigate to={profile ? next : `/bienvenue?next=${encodeURIComponent(next)}`} replace />;

  const redirect = `${window.location.origin}/bienvenue?next=${encodeURIComponent(next)}`;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Adresse e-mail invalide.');
    setBusy(true);
    try {
      if (mode === 'link') {
        const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect } });
        if (error) throw error;
        setSent(true);
      } else if (signup) {
        if (password.length < 8) throw new Error('Choisis un mot de passe d’au moins 8 caractères.');
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirect } });
        if (error) throw error;
        if (!data.session) setSent(true);
        else navigate(`/bienvenue?next=${encodeURIComponent(next)}`);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      const msg = (err as Error).message;
      setError(/Invalid login/i.test(msg) ? 'E-mail ou mot de passe incorrect.' : /rate limit/i.test(msg) ? 'Trop de tentatives. Réessaie dans une minute.' : msg);
      toast({ tone: 'error', title: 'Connexion impossible', message: 'Vérifie tes informations.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <MobileShell nav={false}>
      <main className="flex min-h-[100dvh] flex-col gap-7 px-5 pb-10 pt-4">
        <IconButton icon="arrow-left" label="Retour" onClick={() => navigate('/')} />
        <div className="flex flex-col gap-3">
          <Wordmark size={40} />
          <span className="t-body-l text-secondary">{signup ? 'Crée ton compte en 30 secondes.' : 'Content de te revoir.'}</span>
        </div>

        {sent ? (
          <div className="card-edge flex flex-col gap-2 p-5">
            <span className="t-overline text-gold-200">VÉRIFIE TA BOÎTE MAIL</span>
            <span className="t-body font-bold">Un lien de connexion est parti vers {email}.</span>
            <span className="t-body-s text-muted">Ouvre-le sur ce téléphone pour continuer. Pense à regarder dans les indésirables.</span>
            <Button variant="ghost" size="sm" className="self-start" onClick={() => setSent(false)}>Changer d’adresse</Button>
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
            <SegmentedControl<Mode> value={mode} onChange={setMode} options={[{ value: 'link', label: 'Lien magique' }, { value: 'password', label: 'Mot de passe' }]} />
            <Input label="E-mail" type="email" icon="mail" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="toi@exemple.fr" required />
            {mode === 'password' && (
              <Input label="Mot de passe" type="password" icon="lock" autoComplete={signup ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} hint={signup ? '8 caractères minimum.' : undefined} />
            )}
            {error && <span className="t-body-s text-red-200" role="alert">{error}</span>}
            <Button type="submit" size="lg" block loading={busy}>
              {mode === 'link' ? 'Recevoir mon lien' : signup ? 'Créer mon compte' : 'Me connecter'}
            </Button>
            {mode === 'password' && (
              <Button variant="ghost" size="sm" onClick={() => setSignup(!signup)}>
                {signup ? 'J’ai déjà un compte' : 'Pas encore de compte ? Inscris-toi'}
              </Button>
            )}
          </form>
        )}
        <div className="flex-1" />
        <LegalNote />
      </main>
    </MobileShell>
  );
}
