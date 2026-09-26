import { useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { explainError } from '@/lib/errors';
import { Avatar, Button, Input, LegalNote } from '@/components/ui/core';
import { Icon } from '@/components/ui/Icon';
import { Wordmark } from '@/components/ui/game';
import { useToast } from '@/components/ui/feedback';
import { MobileShell, Screen } from '@/app/MobileLayout';
import { LeagueDialogs, type LeagueDialog } from '@/features/leagues/LeagueDialogs';
import { MobileFallback } from '@/app/App';

/** Pseudo → avatar → ligue. Si on arrive par /rejoindre/:code, l'adhésion se fait après le profil. */
export function Onboarding() {
  const { userId, profile, loading } = useAuth();
  const [params] = useSearchParams();
  const next = params.get('next') || '/';
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const [pseudo, setPseudo] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<'profile' | 'league'>('profile');
  const [dlg, setDlg] = useState<LeagueDialog>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (loading) return <MobileFallback />;
  if (!userId) return <Navigate to="/connexion" replace />;
  if (profile && step === 'profile') {
    // profil déjà créé : on file vers la suite
    return <Navigate to={next} replace />;
  }

  const pendingJoin = next.startsWith('/rejoindre/');

  async function save() {
    const p = pseudo.trim();
    if (p.length < 2 || p.length > 24) return setError('Entre 2 et 24 caractères.');
    setBusy(true);
    setError(null);
    try {
      let avatar_url: string | null = null;
      if (file) {
        const path = `${userId}/avatar-${Date.now()}.${file.type.split('/')[1] ?? 'jpg'}`;
        const up = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
        if (up.error) throw up.error;
        avatar_url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from('profiles').insert({ id: userId, pseudo: p, avatar_url });
      if (error) throw error;
      if (!pendingJoin) setStep('league');
      await qc.invalidateQueries({ queryKey: ['profile'] });
      if (pendingJoin) navigate(next, { replace: true });
    } catch (e) {
      const ex = explainError(e);
      setError(ex.title === 'Pseudo déjà pris' ? 'Ce pseudo est déjà pris.' : ex.message);
      toast({ tone: 'error', title: ex.title, message: ex.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <MobileShell nav={false}>
      <Screen gap={28} bottom={40} top={32}>
        <Wordmark size={34} />
        {step === 'profile' ? (
          <>
            <div className="flex flex-col gap-2">
              <span className="t-overline text-secondary">ÉTAPE 1 SUR 2</span>
              <h1 className="t-h1 m-0">Choisis ton pseudo</h1>
              <span className="t-body-s text-muted">C’est lui que tes amis verront dans le classement.</span>
            </div>
            <div className="flex items-center gap-4">
              <button type="button" className="relative border-0 bg-transparent p-0" onClick={() => fileRef.current?.click()} aria-label="Ajouter une photo">
                <Avatar name={pseudo || '?'} src={preview} size={72} ring="magenta" />
                <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-cta text-white shadow-glow-flare">
                  <Icon name="camera" size={14} />
                </span>
              </button>
              <div className="flex flex-col">
                <span className="t-body font-bold">Ton avatar</span>
                <span className="t-caption text-muted">Une photo, ou tes initiales sur un dégradé.</span>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 3_000_000) return toast({ tone: 'error', title: 'Image trop lourde', message: '3 Mo maximum.' });
                  setFile(f);
                  setPreview(URL.createObjectURL(f));
                }}
              />
            </div>
            <Input label="Pseudo" value={pseudo} maxLength={24} autoFocus onChange={(e) => setPseudo(e.target.value)} placeholder="Ex. Sam" error={error ?? undefined} hint="2 à 24 caractères, unique." />
            <Button size="lg" block loading={busy} disabled={pseudo.trim().length < 2} onClick={save} iconRight="arrow-right">Continuer</Button>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <span className="t-overline text-secondary">ÉTAPE 2 SUR 2</span>
              <h1 className="t-h1 m-0">Rejoins tes amis</h1>
              <span className="t-body-s text-pretty text-muted">Crée ta ligue ou entre le code reçu. Tes pronos compteront dans toutes tes ligues.</span>
            </div>
            <div className="flex flex-col gap-2.5">
              <Button size="lg" block icon="plus" onClick={() => setDlg('create')}>Créer ma ligue</Button>
              <Button size="lg" block variant="secondary" icon="key-round" onClick={() => setDlg('join')}>Rejoindre avec un code</Button>
              <Button variant="ghost" onClick={() => navigate(next, { replace: true })}>Plus tard</Button>
            </div>
          </>
        )}
        <LegalNote />
      </Screen>
      <LeagueDialogs open={dlg} onClose={() => setDlg(null)} onDone={(id) => navigate(`/ligues/${id}`, { replace: true })} />
    </MobileShell>
  );
}
