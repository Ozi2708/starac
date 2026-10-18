import { useEffect, useReducer } from 'react';
import { supabase } from '@/lib/supabase';

/** Guide d'installation déjà montré une fois (on ne le réaffiche plus automatiquement). */
export const INSTALL_SEEN_KEY = 'gp:install-guide-v1';

export type OS = 'ios' | 'android';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Chrome/Android propose l'installation en un geste via `beforeinstallprompt` : on garde l'événement
// dès le chargement (ce module est importé par main.tsx) pour l'utiliser plus tard depuis le guide.
let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    markInstallSeen();
    notify();
    trackApp('install');
  });
}

/** Signale une installation ou une ouverture depuis l'écran d'accueil (suivi visible dans l'admin). */
export function trackApp(event: 'open' | 'install') {
  supabase.rpc('track_app', { p_event: event, p_platform: detectOS() }).then(() => undefined, () => undefined);
}

let openTracked = false;
/** Une fois par lancement : l'app est ouverte en mode installé. */
export function useTrackAppOpen(userId: string | null | undefined) {
  useEffect(() => {
    if (!userId || openTracked || !isStandalone()) return;
    openTracked = true;
    trackApp('open');
  }, [userId]);
}

export function useInstallPrompt() {
  const [, rerender] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    listeners.add(rerender);
    return () => { listeners.delete(rerender); };
  }, []);
  return {
    canPrompt: !!deferred,
    async prompt(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
      if (!deferred) return 'unavailable';
      const e = deferred;
      await e.prompt();
      const { outcome } = await e.userChoice;
      deferred = null;
      notify();
      return outcome;
    },
  };
}

/** L'app tourne déjà en mode installé (icône de l'écran d'accueil). */
export function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function detectOS(): OS | null {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return null;
}

/** Navigateur intégré d'une app (Instagram, Facebook…) : l'installation y est impossible. */
export function inAppBrowser(): string | null {
  const ua = navigator.userAgent;
  if (/Instagram/i.test(ua)) return 'Instagram';
  if (/FBAN|FBAV|FB_IAB|Messenger/i.test(ua)) return 'Facebook';
  if (/Snapchat/i.test(ua)) return 'Snapchat';
  if (/TikTok|musical_ly|BytedanceWebview/i.test(ua)) return 'TikTok';
  if (/LinkedInApp/i.test(ua)) return 'LinkedIn';
  return null;
}

export function installSeen() {
  try { return localStorage.getItem(INSTALL_SEEN_KEY) === '1'; } catch { return true; }
}

export function markInstallSeen() {
  try { localStorage.setItem(INSTALL_SEEN_KEY, '1'); } catch { /* stockage indisponible */ }
}
