import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { explainError } from '@/lib/errors';
import { Button, Input } from '@/components/ui/core';
import { Dialog, useToast } from '@/components/ui/feedback';
import type { League } from '@/lib/types';

export type LeagueDialog = 'create' | 'join' | null;

export async function joinLeague(code: string): Promise<string> {
  const { data, error } = await supabase.rpc('join_league', { p_code: code });
  if (error) throw error;
  return data as string;
}

/** Dialogues « Créer une ligue » et « Rejoindre une ligue » (RPC create_league / join_league). */
export function LeagueDialogs({ open, onClose, onDone }: { open: LeagueDialog; onClose: () => void; onDone: (leagueId: string) => void }) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const qc = useQueryClient();
  useEffect(() => {
    setValue('');
    setError(null);
  }, [open]);

  const create = open === 'create';
  async function submit() {
    const v = value.trim();
    if (!v) return setError(create ? 'Donne un nom à ta ligue.' : 'Saisis le code reçu.');
    if (create && v.length < 2) return setError('2 caractères minimum.');
    setBusy(true);
    try {
      if (create) {
        const { data, error } = await supabase.rpc('create_league', { p_name: v });
        if (error) throw error;
        const l = data as League;
        toast({ tone: 'success', title: 'Ligue créée', message: `Partage le code ${l.invite_code} à tes amis.` });
        await qc.invalidateQueries();
        onDone(l.id);
      } else {
        const id = await joinLeague(v);
        toast({ tone: 'success', title: 'Bienvenue dans la ligue', message: 'Tes pronos comptent déjà ici, rien à refaire.' });
        await qc.invalidateQueries();
        onDone(id);
      }
      onClose();
    } catch (e) {
      const ex = explainError(e);
      setError(ex.message);
      toast({ tone: 'error', title: ex.title, message: ex.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={!!open}
      title={create ? 'Créer une ligue' : 'Rejoindre une ligue'}
      onClose={busy ? undefined : onClose}
      actions={<>
        <Button block onClick={submit} loading={busy}>{create ? 'Créer ma ligue' : 'Rejoindre la ligue'}</Button>
        <Button block variant="ghost" onClick={onClose} disabled={busy}>Annuler</Button>
      </>}
    >
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <Input
          label={create ? 'Nom de la ligue' : 'Code d’invitation'}
          value={value}
          maxLength={create ? 40 : 12}
          autoFocus
          onChange={(e) => setValue(create ? e.target.value : e.target.value.toUpperCase())}
          placeholder={create ? 'Ex. La team du dimanche' : 'Ex. CANAP-7K2Q'}
          error={error ?? undefined}
          autoCapitalize={create ? 'sentences' : 'characters'}
        />
      </form>
    </Dialog>
  );
}
