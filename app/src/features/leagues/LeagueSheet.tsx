import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { explainError } from '@/lib/errors';
import { plural } from '@/lib/format';
import type { LeagueLeaderRow, LeagueMembership, Season } from '@/lib/types';
import { Avatar, Button, Overline, Thumb } from '@/components/ui/core';
import { Icon } from '@/components/ui/Icon';
import { ConfirmDialog, Dialog, useToast } from '@/components/ui/feedback';
import { shareNode } from '@/lib/share';
import { ShareLeaderboardCard } from './ShareLeaderboardCard';
import { useInvite } from './invite';

/** « Gérer la ligue » : invitation, image du classement, ligue principale, membres, quitter. */
export function LeagueSheet({ open, onClose, membership, rows, season, onLeft }: {
  open: boolean; onClose: () => void; membership: LeagueMembership; rows: LeagueLeaderRow[]; season: Season | null; onLeft: () => void;
}) {
  const L = membership.leagues;
  const { userId } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const { copy, shareLeague } = useInvite();
  const shareRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [removing, setRemoving] = useState<{ id: string; name: string } | null>(null);
  const [leaving, setLeaving] = useState(false);
  const manager = membership.role === 'owner' || membership.role === 'admin';
  const err = (e: unknown) => { const x = explainError(e); toast({ tone: 'error', title: x.title, message: x.message }); };

  async function shareImage() {
    if (!shareRef.current) return;
    setSharing(true);
    try {
      const r = await shareNode(shareRef.current, `classement-${L.name}.png`, `Classement · ${L.name}`);
      toast({ tone: 'success', title: 'Image du classement générée', message: r === 'shared' ? 'Partagée.' : 'Téléchargée, prête à partager dans tes messageries.' });
    } catch {
      toast({ tone: 'error', title: 'Image non générée', message: 'On réessaie dans un instant.' });
    } finally {
      setSharing(false);
    }
  }
  async function makePrimary() {
    const { error } = await supabase.rpc('set_primary_league', { p_league: L.id });
    if (error) return err(error);
    toast({ tone: 'success', title: 'Ligue principale', message: `${L.name} s’affiche désormais sur ton accueil.` });
    qc.invalidateQueries({ queryKey: ['my-leagues'] });
  }
  async function regenerate() {
    const { error } = await supabase.rpc('regenerate_invite_code', { p_league: L.id });
    if (error) return err(error);
    toast({ tone: 'success', title: 'Nouveau code généré', message: 'L’ancien code ne fonctionne plus.' });
    qc.invalidateQueries({ queryKey: ['my-leagues'] });
  }
  async function removeMember() {
    if (!removing) return;
    const { error } = await supabase.from('league_members').delete().eq('league_id', L.id).eq('user_id', removing.id);
    if (error) err(error);
    else toast({ tone: 'success', title: `${removing.name} a quitté la ligue` });
    setRemoving(null);
    qc.invalidateQueries({ queryKey: ['lb-league', L.id] });
    qc.invalidateQueries({ queryKey: ['league-counts'] });
  }
  async function leave() {
    const { error } = await supabase.from('league_members').delete().eq('league_id', L.id).eq('user_id', userId!);
    setLeaving(false);
    if (error) return err(error);
    toast({ tone: 'success', title: 'Tu as quitté la ligue', message: 'Tes points restent acquis dans tes autres ligues.' });
    onClose();
    onLeft();
    await qc.invalidateQueries();
  }

  return (
    <>
      <Dialog open={open && !removing && !leaving} onClose={onClose}>
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3.5">
            <Thumb name={L.name} src={L.image_url} size={52} radius={16} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="t-h3 truncate text-primary">{L.name}</span>
              <span className="t-caption text-muted">{plural(rows.length, 'joueur')}{membership.is_primary ? ' · ligue principale' : ''}{manager ? ' · tu es admin' : ''}</span>
            </div>
            <button type="button" aria-label="Fermer" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border-0 bg-white/[.08] text-secondary"><Icon name="x" size={16} /></button>
          </div>

          <div className="card-edge flex flex-col gap-3 p-4">
            <Overline className="text-gold-200">CODE D’INVITATION</Overline>
            <div className="flex items-center justify-between gap-3">
              <span className="whitespace-nowrap text-primary" style={{ font: 'italic 800 22px/1 var(--font-numeric)', letterSpacing: '.05em' }}>{L.invite_code}</span>
              <Button variant="ghost" size="sm" icon="copy" onClick={() => copy(L.invite_code, 'Code copié')}>Copier</Button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Button size="sm" icon="share-2" onClick={() => shareLeague(L)}>Inviter des amis</Button>
              {manager && <Button variant="ghost" size="sm" icon="refresh-cw" onClick={regenerate}>Générer un nouveau code</Button>}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="secondary" block icon="image" loading={sharing} onClick={shareImage}>Classement en image</Button>
            {!membership.is_primary && <Button variant="secondary" block icon="star" onClick={makePrimary}>Mettre en ligue principale</Button>}
          </div>

          {manager && rows.length > 1 && (
            <div className="flex flex-col gap-2">
              <Overline>MEMBRES</Overline>
              <div className="card-plain row-sep flex flex-col">
                {rows.map((r) => (
                  <div key={r.user_id} className="flex items-center gap-3 px-3.5 py-2.5">
                    <Avatar name={r.pseudo} src={r.avatar_url} size={30} />
                    <span className="t-body-s flex-1 truncate text-primary">{r.pseudo}{r.user_id === userId ? ' (toi)' : ''}</span>
                    {r.role === 'owner' ? <span className="t-caption text-muted">Créateur</span>
                      : r.user_id !== userId && (
                        <button type="button" onClick={() => setRemoving({ id: r.user_id, name: r.pseudo })} className="t-caption inline-flex items-center gap-1 rounded-full border-0 bg-white/[.06] px-2.5 py-1 text-secondary">
                          <Icon name="user-minus" size={13} />Retirer
                        </button>
                      )}
                  </div>
                ))}
              </div>
              <span className="t-caption text-pretty text-muted">Tu gères les membres et les invitations, jamais les résultats ni les scores.</span>
            </div>
          )}

          {membership.role !== 'owner' && <Button variant="ghost" block icon="log-out" onClick={() => setLeaving(true)}>Quitter la ligue</Button>}
        </div>
      </Dialog>

      {/* Visuel 1080×1350 rendu hors écran pour l'export image */}
      {open && (
        <div style={{ position: 'fixed', left: -10000, top: 0 }} aria-hidden="true">
          <ShareLeaderboardCard ref={shareRef} league={L} rows={rows} season={season} />
        </div>
      )}

      <ConfirmDialog open={!!removing} title={`Retirer ${removing?.name} ?`} confirmLabel="Retirer de la ligue" danger onConfirm={removeMember} onCancel={() => setRemoving(null)}>
        Ses pronos et ses points restent intacts. Il pourra revenir avec le code d’invitation.
      </ConfirmDialog>
      <ConfirmDialog open={leaving} title="Quitter la ligue ?" confirmLabel="Quitter" danger onConfirm={leave} onCancel={() => setLeaving(false)}>
        Tes pronos et tes points sont conservés. Tu pourras revenir avec le code.
      </ConfirmDialog>
    </>
  );
}
