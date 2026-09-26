import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSeason } from '@/lib/queries';
import { explainError } from '@/lib/errors';
import { fmtShortDate } from '@/lib/format';
import { Button } from '@/components/ui/core';
import { ConfirmDialog, useToast } from '@/components/ui/feedback';
import { AdminPage, Table, Tr } from './AdminApp';
import { useAdminLeagues, useAdminRefresh, useProfiles, type AdminLeague } from './data';

const COLS = 'minmax(0,1fr) 100px 150px 110px 150px 250px';

export function AdminLeagues() {
  const season = useSeason();
  const leagues = useAdminLeagues(season.data?.id);
  const profiles = useProfiles();
  const toast = useToast();
  const refresh = useAdminRefresh();
  const [del, setDel] = useState<AdminLeague | null>(null);
  const pseudo = (id?: string | null) => profiles.data?.find((p) => p.id === id)?.pseudo ?? '—';

  return (
    <AdminPage title="Ligues" sub="Les admins de ligue gèrent membres et invitations, sans accès aux résultats ni aux scores.">
      <Table cols={COLS} head={['LIGUE', 'MEMBRES', 'ADMIN DE LIGUE', 'CRÉÉE LE', 'CODE', 'MODÉRATION']}>
        {(leagues.data ?? []).length === 0 && <Tr cols="1fr"><span className="text-muted">Aucune ligue pour l’instant.</span></Tr>}
        {(leagues.data ?? []).map((l) => (
          <Tr key={l.id} cols={COLS}>
            <span className="truncate font-bold">{l.name}</span>
            <span style={{ font: 'italic 800 15px var(--font-numeric)' }}>{l.members.length}</span>
            <span className="text-secondary">{pseudo(l.members.find((m) => m.role === 'owner')?.user_id ?? l.created_by)}</span>
            <span className="text-secondary">{fmtShortDate(l.created_at)}</span>
            <span className="font-mono text-muted">{l.invite_code.split('-')[0]}-••••</span>
            <span className="flex gap-1.5">
              <Button size="sm" variant="ghost" icon="refresh-cw" onClick={async () => {
                const { error } = await supabase.rpc('regenerate_invite_code', { p_league: l.id });
                if (error) return toast({ tone: 'error', ...explainError(error) });
                toast({ tone: 'success', title: 'Nouveau code généré', message: 'L’ancien code ne fonctionne plus.' });
                refresh();
              }}>Nouveau code</Button>
              <Button size="sm" variant="ghost" icon="trash" onClick={() => setDel(l)}>Supprimer</Button>
            </span>
          </Tr>
        ))}
      </Table>
      <ConfirmDialog open={!!del} danger title={`Supprimer « ${del?.name} » ?`} confirmLabel="Supprimer la ligue" onCancel={() => setDel(null)} onConfirm={async () => {
        const { error } = await supabase.from('leagues').delete().eq('id', del!.id);
        setDel(null);
        if (error) return toast({ tone: 'error', ...explainError(error) });
        toast({ tone: 'success', title: 'Ligue supprimée', message: 'Les pronos et points des membres sont conservés. Enregistré dans le journal.' });
        refresh();
      }}>
        À réserver aux ligues abusives. Les membres gardent leurs pronos et leurs points ; seul le classement de cette ligue disparaît.
      </ConfirmDialog>
    </AdminPage>
  );
}
