import { useNavigate } from 'react-router-dom';
import { usePrimaryLeague } from '@/lib/queries';
import { Button, Overline } from '@/components/ui/core';
import { useToast } from '@/components/ui/feedback';

const APP_TEXT = 'Je joue au Grand Prono, le jeu de pronos entre amis sur la Star Academy 2026 : vainqueur, nommés, éliminés… Viens jouer !';

/** Partage de l'app et du code de la ligue principale (accueil, profil). */
export function InviteCard() {
  const navigate = useNavigate();
  const toast = useToast();
  const { primary } = usePrimaryLeague();
  const L = primary?.leagues;
  const appUrl = window.location.origin;
  const joinUrl = L ? `${appUrl}/rejoindre/${L.invite_code}` : appUrl;

  async function copy(text: string, title: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast({ tone: 'success', title, message: text });
    } catch {
      toast({ tone: 'info', title: 'Copie impossible', message: text });
    }
  }
  async function share(data: ShareData, fallback: string, copied: string) {
    if (navigator.share) {
      try { await navigator.share(data); } catch { /* partage annulé */ }
    } else copy(fallback, copied);
  }

  const shareApp = () => share({ title: 'Le Grand Prono · Star Academy 2026', text: APP_TEXT, url: appUrl }, appUrl, 'Lien de l’app copié');
  const shareLeague = () => L && share(
    { title: `Rejoins ${L.name} sur Le Grand Prono`, text: `${APP_TEXT}\nRejoins ma ligue « ${L.name} » avec le code ${L.invite_code} :`, url: joinUrl },
    joinUrl, 'Lien d’invitation copié',
  );

  return (
    <div className="card-edge flex flex-col gap-3 p-4">
      <Overline className="text-gold-200">INVITE TES AMIS</Overline>
      {L ? (
        <>
          <div className="flex items-end justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="t-caption truncate text-muted">Code de « {L.name} »</span>
              <span style={{ font: 'italic 800 28px/1 var(--font-numeric)', letterSpacing: '.06em' }}>{L.invite_code}</span>
            </div>
            <Button variant="ghost" size="sm" icon="copy" onClick={() => copy(L.invite_code, 'Code copié')}>Copier</Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" icon="share-2" onClick={shareLeague}>Inviter dans ma ligue</Button>
            <Button variant="secondary" size="sm" icon="link" onClick={shareApp}>Partager l’app</Button>
          </div>
        </>
      ) : (
        <>
          <span className="t-body-s text-secondary">Crée ta ligue pour jouer entre amis, ou partage simplement l’app.</span>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" icon="users" onClick={() => navigate('/ligues')}>Créer ma ligue</Button>
            <Button variant="secondary" size="sm" icon="share-2" onClick={shareApp}>Partager l’app</Button>
          </div>
        </>
      )}
    </div>
  );
}
