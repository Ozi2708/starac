import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/core';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/feedback';
import { InstallDemo } from './InstallDemo';
import { detectOS, inAppBrowser, installSeen, isStandalone, markInstallSeen, useInstallPrompt, type OS } from './install';

/**
 * Fenêtre « Installe l'app » : choix iPhone / Android puis démo animée qui guide pas à pas.
 * Sur Android (Chrome), un bouton installe directement l'app quand le navigateur le permet.
 */
export function InstallGuideDialog({ open, onClose, initialOS }: { open: boolean; onClose: () => void; initialOS?: OS | null }) {
  const detected = detectOS();
  const [os, setOS] = useState<OS | null>(initialOS ?? null);
  const install = useInstallPrompt();
  const toast = useToast();
  const iab = inAppBrowser();

  useEffect(() => { if (open) setOS(initialOS ?? null); }, [open, initialOS]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;

  async function installNow() {
    const r = await install.prompt();
    if (r === 'accepted') {
      toast({ tone: 'success', title: 'App installée', message: 'Retrouve Grand Prono sur ton écran d’accueil.' });
      onClose();
    }
  }

  return (
    <div className="gp-dialog__scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gp-dialog" role="dialog" aria-modal="true" aria-label="Installer l’app" style={{ padding: '20px 20px 16px', gap: 14 }}>
        <div className="flex items-center gap-2">
          {os ? (
            <button type="button" onClick={() => setOS(null)} aria-label="Changer de téléphone" className="flex h-9 w-9 flex-none items-center justify-center rounded-full border-0 bg-white/[.08] text-secondary"><Icon name="arrow-left" size={16} /></button>
          ) : null}
          <span className="t-overline flex-1 text-gold-200">{os === 'ios' ? 'SUR IPHONE · SAFARI' : os === 'android' ? 'SUR ANDROID · CHROME' : 'INSTALLE L’APP'}</span>
          <button type="button" aria-label="Fermer" onClick={onClose} className="flex h-9 w-9 flex-none items-center justify-center rounded-full border-0 bg-white/[.08] text-secondary"><Icon name="x" size={16} /></button>
        </div>

        {!os ? (
          <>
            <div className="flex flex-col gap-2">
              <span className="gp-glitter-text pr-1" style={{ font: 'italic 900 28px/1.05 var(--font-display)' }}>Le Grand Prono sur ton écran d’accueil</span>
              <span className="t-body-s text-pretty text-secondary">Une icône comme une vraie app, en plein écran, sans passer par un store. Ça prend 20 secondes.</span>
            </div>
            {iab && (
              <div className="t-caption flex gap-2 rounded-md p-3 text-pretty" style={{ background: 'rgba(255,166,74,.12)', boxShadow: 'inset 0 0 0 1px rgba(255,166,74,.45)' }}>
                <Icon name="info" size={16} className="flex-none text-flare-400" />
                <span>Tu es dans le navigateur de {iab}. Ouvre d’abord ce lien dans {detected === 'android' ? 'Chrome' : 'Safari'} (menu ⋯ puis « Ouvrir dans le navigateur »).</span>
              </div>
            )}
            <span className="t-body-s font-bold">Quel téléphone as-tu ?</span>
            <div className="grid grid-cols-2 gap-2.5">
              <OsChoice os="ios" label="iPhone" sub="avec Safari" detected={detected === 'ios'} onPick={setOS} />
              <OsChoice os="android" label="Android" sub="avec Chrome" detected={detected === 'android'} onPick={setOS} />
            </div>
            <Button variant="ghost" block onClick={onClose}>Plus tard</Button>
          </>
        ) : (
          <>
            <InstallDemo key={os} os={os} />
            <div className="flex flex-col gap-2">
              {os === 'android' && install.canPrompt && detected === 'android' && (
                <Button block icon="download" onClick={installNow}>Installer maintenant</Button>
              )}
              <Button block variant={os === 'android' && install.canPrompt && detected === 'android' ? 'secondary' : 'primary'} onClick={onClose}>J’ai compris</Button>
            </div>
            <span className="t-caption text-center text-pretty text-muted">Tu retrouveras ce guide dans Profil → « Installer l’app ».</span>
          </>
        )}
      </div>
    </div>
  );
}

function OsChoice({ os, label, sub, detected, onPick }: { os: OS; label: string; sub: string; detected: boolean; onPick: (o: OS) => void }) {
  return (
    <button type="button" onClick={() => onPick(os)} className={'gp-os' + (detected ? ' gp-os--detected' : '')}>
      <PhoneGlyph os={os} />
      <span className="flex flex-col items-center gap-0.5">
        <span className="t-body font-bold">{label}</span>
        <span className="t-caption text-muted">{sub}</span>
      </span>
      <span className="t-caption rounded-full px-2 py-0.5 font-bold" style={detected ? { background: 'var(--grad-cta)', color: '#fff' } : { visibility: 'hidden' }}>Ton téléphone</span>
    </button>
  );
}

/** Silhouette de téléphone : îlot dynamique (iPhone) ou caméra perforée (Android). */
function PhoneGlyph({ os }: { os: OS }) {
  return (
    <svg width="38" height="64" viewBox="0 0 38 64" aria-hidden="true">
      <defs>
        <linearGradient id={`gp-os-${os}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffa64a" /><stop offset=".55" stopColor="#ff6a3d" /><stop offset="1" stopColor="#d243e6" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="35" height="61" rx={os === 'ios' ? 8 : 6} fill="rgba(255,255,255,.06)" stroke={`url(#gp-os-${os})`} strokeWidth="3" />
      {os === 'ios' ? <rect x="13" y="6" width="12" height="4" rx="2" fill="#fff" /> : <circle cx="19" cy="8" r="2.2" fill="#fff" />}
      <rect x={os === 'ios' ? 13 : 14} y="56" width={os === 'ios' ? 12 : 10} height="2" rx="1" fill="rgba(255,255,255,.7)" />
    </svg>
  );
}

/**
 * Ouverture automatique, une seule fois, à la prochaine ouverture de l'app sur téléphone
 * (jamais quand l'app est déjà installée). `?installer=1` dans l'URL force l'ouverture.
 */
export function InstallGuideAuto() {
  const [params, setParams] = useSearchParams();
  const forced = params.get('installer') === '1';
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (forced) { setOpen(true); return; }
    if (isStandalone() || installSeen() || !detectOS()) return;
    const t = window.setTimeout(() => { markInstallSeen(); setOpen(true); }, 1200);
    return () => window.clearTimeout(t);
  }, [forced]);

  function close() {
    markInstallSeen();
    setOpen(false);
    if (forced) {
      const next = new URLSearchParams(params);
      next.delete('installer');
      setParams(next, { replace: true });
    }
  }
  return <InstallGuideDialog open={open} onClose={close} initialOS={null} />;
}
