import { useToast } from '@/components/ui/feedback';
import type { League } from '@/lib/types';

const APP_TEXT = 'Je joue au Grand Prono, le jeu de pronos entre amis sur la Star Academy 2026 : vainqueur, nommés, éliminés… Viens jouer !';

export const joinUrl = (l: Pick<League, 'invite_code'>) => `${window.location.origin}/rejoindre/${l.invite_code}`;

/** Copier / partager (Web Share API, sinon copie du lien) l'app ou une ligue. */
export function useInvite() {
  const toast = useToast();
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
  const appUrl = window.location.origin;
  return {
    copy,
    shareApp: () => share({ title: 'Le Grand Prono · Star Academy 2026', text: APP_TEXT, url: appUrl }, appUrl, 'Lien de l’app copié'),
    shareLeague: (l: Pick<League, 'name' | 'invite_code'>) => share(
      { title: `Rejoins ${l.name} sur Le Grand Prono`, text: `${APP_TEXT}\nRejoins ma ligue « ${l.name} » avec le code ${l.invite_code} :`, url: joinUrl(l) },
      joinUrl(l), 'Lien d’invitation copié',
    ),
  };
}
