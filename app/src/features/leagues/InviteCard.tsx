import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyLeagues } from '@/lib/queries';
import { Button, Overline } from '@/components/ui/core';
import { useInvite } from './invite';

/** Partage de l'app et du code d'une de mes ligues (accueil, profil). */
export function InviteCard() {
  const navigate = useNavigate();
  const leagues = useMyLeagues();
  const { copy, shareApp, shareLeague } = useInvite();
  const list = [...(leagues.data ?? [])].sort((x, y) => Number(y.is_primary) - Number(x.is_primary));
  const [sel, setSel] = useState<string | null>(null);
  const L = (list.find((m) => m.league_id === sel) ?? list[0])?.leagues;

  return (
    <div className="card-edge flex flex-col gap-3 p-4">
      <Overline className="text-gold-200">INVITE TES AMIS</Overline>
      {L ? (
        <>
          {list.length > 1 && (
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
              {list.map((m) => (
                <button key={m.league_id} type="button" onClick={() => setSel(m.league_id)}
                  className={'gp-seg__opt flex-none rounded-full' + (m.leagues.id === L.id ? ' gp-seg__opt--on' : '')}
                  style={m.leagues.id === L.id ? { height: 30 } : { height: 30, background: 'rgba(255,255,255,.06)', boxShadow: 'inset 0 0 0 1px var(--border-subtle)' }}>
                  {m.leagues.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-end justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="t-caption truncate text-muted">Code de « {L.name} »</span>
              <span style={{ font: 'italic 800 28px/1 var(--font-numeric)', letterSpacing: '.06em' }}>{L.invite_code}</span>
            </div>
            <Button variant="ghost" size="sm" icon="copy" onClick={() => copy(L.invite_code, 'Code copié')}>Copier</Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" icon="share-2" onClick={() => shareLeague(L)}>Inviter dans la ligue</Button>
            <Button variant="secondary" size="sm" icon="link" onClick={shareApp}>Partager l’app</Button>
          </div>
        </>
      ) : (
        <>
          <span className="t-body-s text-secondary">Crée ta ligue pour jouer entre amis, ou partage simplement l’app.</span>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" icon="users" onClick={() => navigate('/classement?ajouter=1')}>Créer ma ligue</Button>
            <Button variant="secondary" size="sm" icon="share-2" onClick={shareApp}>Partager l’app</Button>
          </div>
        </>
      )}
    </div>
  );
}
