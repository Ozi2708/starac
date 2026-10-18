import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  Bookmark, BookOpen, Calculator, Calendar, Camera, ChevronLeft, Clock, Cloud, Copy, Download, Ellipsis, EllipsisVertical,
  Glasses, Globe, Heart, History, Image, Info, Lock, Mail, Map, MessageCircle, Music, Phone, Plus, RotateCw, Search,
  Settings, Share, SquarePlus, Star, StickyNote, X, ArrowRight, type LucideIcon,
} from 'lucide-react';
import type { OS } from './install';
import './install.css';

/**
 * Démo animée (« motion design ») de l'ajout à l'écran d'accueil, jouée en boucle dans un téléphone.
 * Tout est dessiné dans un écran virtuel de 390 × 844 mis à l'échelle ; le doigt suit un trajet
 * (Web Animations API) et chaque « tap » fait avancer l'interface d'une étape.
 */

const SW = 390;
const SH = 844;

/** [instant en ms, x, y] dans l'écran virtuel */
type Pt = [number, number, number];
interface Scene { id: string; dur: number; caption: string; tip?: string; finger?: Pt[]; taps?: number[] }

const APP_URL = 'le-grand-prono.vercel.app';
const ICON_IOS: [number, number] = [244, 332];
const ICON_ANDROID: [number, number] = [151, 340];

export const SCENES: Record<OS, Scene[]> = {
  ios: [
    { id: 'browse', dur: 2400, caption: `Ouvre ${APP_URL} dans Safari`, tip: 'Lien ouvert depuis WhatsApp ou Instagram ? Ouvre-le d’abord dans Safari.' },
    { id: 'menu', dur: 3000, caption: 'Touche ⋯ en bas à droite, puis « Partager »', tip: 'iPhone plus ancien : touche directement l’icône Partager (carré avec une flèche) en bas.',
      finger: [[0, 430, 900], [900, 348, 792], [1700, 251, 525], [3000, 251, 525]], taps: [1100, 2100] },
    { id: 'sheet', dur: 3400, caption: 'Fais défiler, puis touche « Sur l’écran d’accueil »',
      finger: [[0, 251, 525], [650, 195, 770], [1350, 195, 560], [2000, 195, 576], [3400, 195, 576]], taps: [800, 2300] },
    { id: 'add', dur: 2700, caption: 'Touche « Ajouter » en haut à droite', tip: 'Laisse « Ouvrir en tant qu’app web » activé.',
      finger: [[0, 195, 576], [1200, 340, 84], [2700, 340, 84]], taps: [1500] },
    { id: 'home', dur: 2900, caption: 'L’icône Grand Prono est sur ton écran d’accueil',
      finger: [[0, 430, 900], [1500, ICON_IOS[0], ICON_IOS[1] + 6], [2900, ICON_IOS[0], ICON_IOS[1] + 6]], taps: [1900] },
    { id: 'open', dur: 3000, caption: 'Touche-la : l’app s’ouvre en plein écran 🎉', tip: 'Première ouverture : reconnecte-toi avec ton e-mail et ton mot de passe.' },
  ],
  android: [
    { id: 'browse', dur: 2400, caption: `Ouvre ${APP_URL} dans Chrome`, tip: 'Lien ouvert depuis WhatsApp ou Instagram ? Ouvre-le d’abord dans Chrome.' },
    { id: 'menu', dur: 2500, caption: 'Touche ⋮ en haut à droite',
      finger: [[0, 430, -60], [1000, 366, 70], [2500, 366, 70]], taps: [1200] },
    { id: 'pick', dur: 2500, caption: 'Choisis « Ajouter à l’écran d’accueil »', tip: 'Selon ton téléphone : « Installer l’application ». Samsung Internet : menu ≡, puis « Ajouter page à ».',
      finger: [[0, 366, 70], [1100, 250, 404], [2500, 250, 404]], taps: [1400] },
    { id: 'confirm', dur: 2700, caption: 'Confirme avec « Installer »',
      finger: [[0, 250, 404], [1300, 302, 448], [2700, 302, 448]], taps: [1600] },
    { id: 'home', dur: 2900, caption: 'L’icône Grand Prono est sur ton écran d’accueil',
      finger: [[0, 430, 900], [1500, ICON_ANDROID[0], ICON_ANDROID[1] + 4], [2900, ICON_ANDROID[0], ICON_ANDROID[1] + 4]], taps: [1900] },
    { id: 'open', dur: 3000, caption: 'Touche-la : l’app s’ouvre en plein écran 🎉', tip: 'Tu restes connecté : rien à ressaisir.' },
  ],
};

function usePhoneWidth() {
  const calc = () => Math.round(Math.min(228, Math.max(160, ((window.innerHeight - 380) * SW) / SH + 14)));
  const [w, setW] = useState(calc);
  useEffect(() => {
    const on = () => setW(calc());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return w;
}

/** Rythme de lecture automatique (1 = vitesse de conception, plus grand = plus lent). */
const PACE = 1.5;

export function InstallDemo({ os }: { os: OS }) {
  const scenes = SCENES[os];
  const [i, setI] = useState(0);
  const [run, setRun] = useState(0); // relance l'étape courante (tap à gauche sur la première)
  const [phase, setPhase] = useState(0);
  const [tap, setTap] = useState(0);
  const [nudge, setNudge] = useState<{ side: 'l' | 'r'; k: number } | null>(null);
  const finger = useRef<HTMLDivElement>(null);
  const w = usePhoneWidth();
  const inner = w - 14;
  const scale = inner / SW;
  const sc = scenes[i];
  const dur = sc.dur * PACE;

  const go = (d: 1 | -1) => {
    setI((x) => (d > 0 ? (x + 1) % scenes.length : Math.max(0, x - 1)));
    setRun((r) => r + 1);
    setNudge((n) => ({ side: d > 0 ? 'r' : 'l', k: (n?.k ?? 0) + 1 }));
  };

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenes.length]);

  useEffect(() => {
    setPhase(0);
    const timers = (sc.taps ?? []).map((t, k) => window.setTimeout(() => { setPhase(k + 1); setTap((x) => x + 1); }, t * PACE));
    timers.push(window.setTimeout(() => setI((x) => (x + 1) % scenes.length), dur));
    const el = finger.current;
    let anim: Animation | undefined;
    if (el && sc.finger && el.animate) {
      const frames: Keyframe[] = sc.finger.map(([t, x, y]) => ({ transform: `translate(${x - 23}px, ${y - 23}px)`, offset: Math.min(1, t / sc.dur), easing: 'cubic-bezier(.45,0,.2,1)' }));
      anim = el.animate(frames, { duration: dur, fill: 'forwards' });
    }
    return () => { timers.forEach(clearTimeout); anim?.cancel(); };
  }, [i, run, sc, dur, scenes.length]);

  return (
    <div className="flex flex-col items-center gap-3.5">
      {/* Tap à droite : étape suivante · tap à gauche : étape précédente */}
      <div className="gp-phone" role="button" tabIndex={0} aria-label="Touche à droite pour avancer, à gauche pour revenir"
        style={{ width: w, ['--pw' as string]: `${w}px`, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' } as CSSProperties}
        onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); go(e.clientX - r.left < r.width / 2 ? -1 : 1); }}>
        <div className="gp-phone__screen" style={{ height: Math.round(inner * (SH / SW)) }}>
          <div className="gp-phone__canvas" style={{ transform: `scale(${scale})` }} data-os={os}>
            {os === 'ios' ? <IosScreen scene={sc.id} phase={phase} /> : <AndroidScreen scene={sc.id} phase={phase} />}
            <div ref={finger} className={'gp-finger' + (sc.finger ? '' : ' is-off')} aria-hidden="true">
              <span key={tap} className="gp-finger__dot" />
              {tap > 0 && <span key={'r' + tap} className="gp-finger__ripple" />}
            </div>
          </div>
          {nudge && (
            <span key={nudge.k} className={'gp-nudge gp-nudge--' + nudge.side} aria-hidden="true">
              <span>{nudge.side === 'r' ? '›' : '‹'}</span>
            </span>
          )}
        </div>
      </div>

      {/* Légende synchronisée */}
      <div className="flex w-full flex-col gap-2" aria-live="polite">
        <div className="flex gap-1" role="tablist" aria-label="Étapes">
          {scenes.map((s, k) => (
            <button key={s.id} type="button" role="tab" aria-selected={k === i} aria-label={`Étape ${k + 1}`} onClick={() => { setI(k); setRun((r) => r + 1); }}
              className="h-1.5 flex-1 overflow-hidden rounded-full border-0 p-0" style={{ background: 'rgba(255,255,255,.14)' }}>
              <span key={k === i ? `on-${i}-${run}` : k} className={'block h-full rounded-full' + (k === i ? ' gp-step-fill' : '')}
                style={{ background: 'var(--grad-cta)', width: k < i ? '100%' : k === i ? undefined : '0%', animationDuration: `${dur}ms` }} />
            </button>
          ))}
        </div>
        <div key={`${os}-${i}`} className="gp-caption flex min-h-[64px] flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <span className="t-overline text-gold-200">ÉTAPE {i + 1} / {scenes.length}</span>
            <span className="t-caption text-muted">‹ touche le téléphone ›</span>
          </div>
          <span className="t-body text-pretty font-bold">{sc.caption}</span>
          {sc.tip && <span className="t-caption text-pretty text-muted">{sc.tip}</span>}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Éléments communs

const L = (I: LucideIcon, size = 22, color?: string) => <I size={size} strokeWidth={2} color={color} aria-hidden="true" />;
const abs = (s: CSSProperties): CSSProperties => ({ position: 'absolute', ...s });

function Layer({ on, className = '', style, children }: { on: boolean; className?: string; style?: CSSProperties; children?: ReactNode }) {
  return <div className={'gp-x ' + className + (on ? ' is-on' : ' is-off')} style={style}>{children}</div>;
}

/** Capture de l'app sous la barre d'état (top) ; la barre de navigation de l'app reste collée en bas. */
function AppShot({ top, open, nav = true, origin }: { top: number; open?: boolean; nav?: boolean; origin: [number, number] }) {
  const img = 'url(/install/app-home.webp)';
  return (
    <div className={'gp-x' + (open ? ' gp-x-open' : '')} style={abs({ inset: 0, background: '#0d0322', transformOrigin: `${origin[0]}px ${origin[1]}px`, overflow: 'hidden' })}>
      <div style={abs({ left: 0, top, width: SW, height: SH - top, background: `${img} top / ${SW}px ${SH}px no-repeat` })} />
      {nav && <div style={abs({ left: 0, bottom: 0, width: SW, height: 96, background: `${img} bottom / ${SW}px ${SH}px no-repeat` })} />}
    </div>
  );
}

function HomeIcons({ ourAt, round, pressed }: { ourAt: number; round?: boolean; pressed: boolean }) {
  const apps: [LucideIcon, string, string][] = [
    [Calendar, 'Calendrier', '#ff453a'], [Camera, 'Caméra', '#636366'], [Image, 'Photos', 'linear-gradient(135deg,#ffd60a,#ff375f,#5e5ce6)'], [Clock, 'Horloge', '#1c1c1e'],
    [Mail, 'Mail', '#0a84ff'], [Cloud, 'Météo', 'linear-gradient(180deg,#64d2ff,#0a84ff)'], [Map, 'Plans', '#30d158'], [StickyNote, 'Notes', '#ffd60a'],
    [Calculator, 'Calculette', '#3a3a3c'], [Heart, 'Santé', '#ff2d55'], [Settings, 'Réglages', '#8e8e93'], [Music, 'Musique', '#fa2d48'],
  ];
  const cols = [58, 151, 244, 337];
  const cells: ReactNode[] = [];
  let k = 0;
  for (let slot = 0; slot < 16; slot++) {
    const x = cols[slot % 4] - 32;
    const y = 80 + Math.floor(slot / 4) * 108 + (round ? 120 : 0);
    if (slot === ourAt) {
      cells.push(
        <div key="ours" className={'gp-home-ours' + (pressed ? ' is-pressed' : '')} style={abs({ left: x, top: y, width: 64, textAlign: 'center' })}>
          <img src={round ? '/icon-maskable-192-v3.png' : '/apple-touch-icon-v3.png'} alt="" width={64} height={64} style={{ display: 'block', borderRadius: round ? 32 : 15, boxShadow: '0 6px 18px rgba(0,0,0,.45)' }} />
          <span className="gp-home-label">Grand Prono</span>
        </div>,
      );
    } else if (k < apps.length && slot < 12 + (ourAt >= 12 ? 1 : 0)) {
      const [I, label, bg] = apps[k++];
      cells.push(
        <div key={label} style={abs({ left: x, top: y, width: 64, textAlign: 'center' })}>
          <div style={{ width: 64, height: 64, borderRadius: round ? 32 : 15, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>{L(I, 30)}</div>
          <span className="gp-home-label">{label}</span>
        </div>,
      );
    }
  }
  return <>{cells}</>;
}

// ---------------------------------------------------------------------------------------------
// iPhone · Safari (iOS 26)

function IosStatus({ dark = true }: { dark?: boolean }) {
  return (
    <div style={abs({ left: 0, top: 0, width: SW, height: 54, color: dark ? '#fff' : '#000', zIndex: 30, pointerEvents: 'none' })}>
      <span style={abs({ left: 46, top: 17, font: '600 17px/1 -apple-system,system-ui,sans-serif' })}>21:10</span>
      <div style={abs({ left: 132, top: 11, width: 126, height: 37, borderRadius: 20, background: '#000' })} />
      <div style={abs({ right: 34, top: 18, display: 'flex', gap: 6, alignItems: 'center' })}>
        <span style={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>{[5, 8, 11, 14].map((h) => <i key={h} style={{ width: 3.5, height: h, borderRadius: 1, background: 'currentColor' }} />)}</span>
        <span style={{ width: 25, height: 12, borderRadius: 4, border: '1.5px solid currentColor', padding: 1.5, display: 'block' }}><i style={{ display: 'block', width: '75%', height: '100%', borderRadius: 2, background: 'currentColor' }} /></span>
      </div>
    </div>
  );
}

function IosScreen({ scene, phase }: { scene: string; phase: number }) {
  const browsing = ['browse', 'menu', 'sheet'].includes(scene);
  const menuOn = scene === 'menu' && phase >= 1;
  const home = scene === 'home' || scene === 'open';
  return (
    <>
      {/* Écran d'accueil */}
      <Layer on={home} className="gp-x-fade" style={abs({ inset: 0, background: 'radial-gradient(120% 70% at 20% 10%,#7b3fe4 0%,rgba(123,63,228,0) 60%),radial-gradient(90% 60% at 90% 90%,#ff6a3d 0%,rgba(255,106,61,0) 60%),linear-gradient(180deg,#2a0f72,#120634)' })}>
        <HomeIcons ourAt={10} pressed={scene === 'home' && phase >= 1} />
        <div style={abs({ left: 14, right: 14, bottom: 22, height: 92, borderRadius: 34, background: 'rgba(255,255,255,.18)', backdropFilter: 'blur(20px)', display: 'flex', justifyContent: 'space-around', alignItems: 'center' })}>
          {([[Phone, '#30d158'], [Globe, '#0a84ff'], [MessageCircle, '#30d158'], [Music, '#fa2d48']] as [LucideIcon, string][]).map(([I, bg], k) => (
            <div key={k} style={{ width: 64, height: 64, borderRadius: 15, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>{L(I, 30)}</div>
          ))}
        </div>
      </Layer>

      {/* Le site dans Safari, puis l'app ouverte en plein écran */}
      <Layer on={!home || scene === 'open'} style={abs({ inset: 0 })}>
        <AppShot top={54} open={scene === 'open'} nav={scene === 'open'} origin={ICON_IOS} />
      </Layer>

      {/* Barre Safari flottante */}
      <Layer on={browsing} className="gp-x-slide-down" style={abs({ left: 10, right: 10, top: 760, height: 58, borderRadius: 29, background: 'rgba(40,30,70,.72)', backdropFilter: 'blur(18px)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.14), 0 8px 24px rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px' })}>
        <span className="gp-ios-btn">{L(ChevronLeft, 24)}</span>
        <span className={'gp-ios-url' + (scene === 'browse' ? ' is-hint' : '')}>{L(Lock, 13, 'rgba(255,255,255,.7)')}<span>{APP_URL}</span></span>
        <span className={'gp-ios-btn' + (scene === 'menu' && phase === 0 ? ' is-target' : '')}>{L(Ellipsis, 24)}</span>
      </Layer>
      <div style={abs({ left: 128, top: 831, width: 134, height: 5, borderRadius: 3, background: 'rgba(255,255,255,.85)', zIndex: 25 })} />

      {/* Voile */}
      <Layer on={menuOn || scene === 'sheet' || scene === 'add'} className="gp-x-fade" style={abs({ inset: 0, background: 'rgba(0,0,0,.42)' })} />

      {/* Menu ⋯ */}
      <Layer on={menuOn} className="gp-x-pop" style={abs({ right: 14, top: 492, width: 262, padding: 8, borderRadius: 26, background: 'rgba(52,44,82,.92)', backdropFilter: 'blur(24px)', boxShadow: '0 18px 48px rgba(0,0,0,.55)', transformOrigin: '92% 105%' })}>
        {([[Share, 'Partager'], [BookOpen, 'Ajouter aux signets'], [Star, 'Ajouter aux favoris'], [Search, 'Rechercher dans la page'], [Plus, 'Nouvel onglet']] as [LucideIcon, string][]).map(([I, t], k) => (
          <div key={t} className={'gp-ios-row' + (k === 0 && phase >= 2 ? ' is-pressed' : '')}>{L(I, 21)}<span>{t}</span></div>
        ))}
      </Layer>

      {/* Feuille de partage */}
      <Layer on={scene === 'sheet'} className="gp-x-sheet" style={abs({ left: 0, right: 0, top: 300, bottom: 0, borderRadius: '18px 18px 0 0', background: '#1c1c1e', overflow: 'hidden' })}>
        <div className="gp-ios-list" style={abs({ inset: 0, transform: phase >= 1 ? 'translateY(-200px)' : undefined })}>
        <div style={abs({ left: 18, right: 18, top: 16, display: 'flex', alignItems: 'center', gap: 12 })}>
          <img src="/apple-touch-icon-v3.png" alt="" width={46} height={46} style={{ borderRadius: 11 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <b style={{ fontSize: 16 }}>Le Grand Prono</b><span style={{ fontSize: 13, color: '#98989f' }}>{APP_URL}</span>
          </div>
          <span style={{ width: 30, height: 30, borderRadius: 15, background: '#3a3a3c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c7c7cc' }}>{L(X, 16)}</span>
        </div>
        <div style={abs({ left: 18, right: 18, top: 86, display: 'flex', justifyContent: 'space-between' })}>
          {([['AirDrop', 'linear-gradient(180deg,#64d2ff,#0a84ff)', Share], ['Messages', '#30d158', MessageCircle], ['Mail', '#0a84ff', Mail], ['Notes', '#ffd60a', StickyNote]] as [string, string, LucideIcon][]).map(([t, bg, I]) => (
            <div key={t} style={{ width: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 60, height: 60, borderRadius: t === 'AirDrop' ? 30 : 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{L(I, 28)}</span>
              <span style={{ fontSize: 11, color: '#d1d1d6' }}>{t}</span>
            </div>
          ))}
        </div>
        <div style={abs({ left: 16, right: 16, top: 190, borderRadius: 12, background: '#2c2c2e', overflow: 'hidden' })}>
          {([[Copy, 'Copier'], [Glasses, 'Ajouter à la liste de lecture'], [Bookmark, 'Ajouter un signet'], [Star, 'Ajouter aux favoris'], [Search, 'Rechercher dans la page'], [SquarePlus, 'Sur l’écran d’accueil'], [Info, 'Modifier les actions…']] as [LucideIcon, string][]).map(([I, t], k) => (
            <div key={t} className={'gp-ios-li' + (k === 5 ? ' is-key' : '') + (k === 5 && phase >= 2 ? ' is-pressed' : '')}><span>{t}</span>{L(I, 21)}</div>
          ))}
        </div>
        </div>
      </Layer>

      {/* Écran « Ajouter » */}
      <Layer on={scene === 'add'} className="gp-x-sheet" style={abs({ left: 0, right: 0, top: 54, bottom: 0, borderRadius: '14px 14px 0 0', background: '#1c1c1e' })}>
        <div style={abs({ left: 0, right: 0, top: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', fontSize: 17 })}>
          <span style={{ color: '#0a84ff' }}>Annuler</span>
          <b style={{ fontSize: 16 }}>Sur l’écran d’accueil</b>
          <b className={phase >= 1 ? 'gp-flash' : ''} style={{ color: '#0a84ff' }}>Ajouter</b>
        </div>
        <div style={abs({ left: 16, right: 16, top: 78, borderRadius: 12, background: '#2c2c2e', padding: 14, display: 'flex', gap: 14, alignItems: 'center' })}>
          <img src="/apple-touch-icon-v3.png" alt="" width={62} height={62} style={{ borderRadius: 14 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 17, paddingBottom: 8, borderBottom: '1px solid #48484a' }}>Grand Prono</span>
            <span style={{ fontSize: 14, color: '#98989f' }}>{APP_URL}</span>
          </div>
        </div>
        <div style={abs({ left: 16, right: 16, top: 196, borderRadius: 12, background: '#2c2c2e', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 16 })}>
          <span>Ouvrir en tant qu’app web</span>
          <span style={{ width: 52, height: 32, borderRadius: 16, background: '#30d158', position: 'relative' }}><i style={{ position: 'absolute', right: 2, top: 2, width: 28, height: 28, borderRadius: 14, background: '#fff' }} /></span>
        </div>
        <p style={abs({ left: 30, right: 30, top: 262, margin: 0, fontSize: 13, lineHeight: 1.35, color: '#98989f' })}>Une icône sera ajoutée à votre écran d’accueil pour accéder rapidement à ce site web.</p>
      </Layer>

      <IosStatus />
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// Android · Chrome

function AndroidStatus() {
  return (
    <div style={abs({ left: 0, top: 0, width: SW, height: 36, color: '#fff', zIndex: 30, pointerEvents: 'none' })}>
      <span style={abs({ left: 24, top: 10, font: '500 15px/1 Roboto,system-ui,sans-serif' })}>21:10</span>
      <div style={abs({ left: 189, top: 10, width: 13, height: 13, borderRadius: 7, background: '#000', boxShadow: '0 0 0 2px #111' })} />
      <div style={abs({ right: 22, top: 11, display: 'flex', gap: 6, alignItems: 'center' })}>
        <span style={{ width: 0, height: 0, borderLeft: '12px solid transparent', borderBottom: '12px solid currentColor' }} />
        <span style={{ width: 9, height: 15, borderRadius: 2, border: '1.5px solid currentColor', padding: 1, display: 'flex', alignItems: 'flex-end' }}><i style={{ display: 'block', width: '100%', height: '70%', background: 'currentColor', borderRadius: 1 }} /></span>
      </div>
    </div>
  );
}

function AndroidScreen({ scene, phase }: { scene: string; phase: number }) {
  const browsing = ['browse', 'menu', 'pick', 'confirm'].includes(scene);
  const menuOn = (scene === 'menu' && phase >= 1) || scene === 'pick';
  const home = scene === 'home' || scene === 'open';
  return (
    <>
      <Layer on={home} className="gp-x-fade" style={abs({ inset: 0, background: 'radial-gradient(100% 60% at 80% 0%,#d243e6 0%,rgba(210,67,230,0) 60%),radial-gradient(100% 60% at 0% 100%,#ff9a2e 0%,rgba(255,154,46,0) 55%),linear-gradient(180deg,#24106a,#0d0322)' })}>
        <div style={abs({ left: 0, right: 0, top: 70, textAlign: 'center', font: '300 64px/1 Roboto,system-ui,sans-serif' })}>21:10</div>
        <div style={abs({ left: 0, right: 0, top: 146, textAlign: 'center', fontSize: 15, color: 'rgba(255,255,255,.8)' })}>samedi 24 octobre</div>
        <HomeIcons ourAt={5} round pressed={scene === 'home' && phase >= 1} />
        <div style={abs({ left: 20, right: 20, bottom: 40, height: 52, borderRadius: 26, background: 'rgba(255,255,255,.16)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', gap: 12, padding: '0 18px', color: 'rgba(255,255,255,.75)' })}>{L(Search, 20)}<span style={{ fontSize: 15 }}>Rechercher</span></div>
      </Layer>

      <Layer on={!home || scene === 'open'} style={abs({ inset: 0, background: '#0d0322' })}>
        <AppShot top={scene === 'open' ? 36 : 100} open={scene === 'open'} origin={ICON_ANDROID} />
      </Layer>

      {/* Barre Chrome */}
      <Layer on={browsing} className="gp-x-fade" style={abs({ left: 0, right: 0, top: 0, height: 100, background: '#202124', boxShadow: '0 1px 0 rgba(255,255,255,.08)' })}>
        <div className={'gp-and-url' + (scene === 'browse' ? ' is-hint' : '')} style={abs({ left: 12, top: 46, width: 276, height: 44 })}>{L(Lock, 15, '#bdc1c6')}<span>{APP_URL}</span></div>
        <span style={abs({ left: 302, top: 56, width: 24, height: 24, borderRadius: 5, border: '2px solid #e8eaed', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' })}>2</span>
        <span className={'gp-and-btn' + (scene === 'menu' && phase === 0 ? ' is-target' : '')} style={abs({ left: 344, top: 46 })}>{L(EllipsisVertical, 24)}</span>
      </Layer>

      <Layer on={scene === 'confirm'} className="gp-x-fade" style={abs({ inset: 0, background: 'rgba(0,0,0,.5)' })} />

      {/* Menu ⋮ */}
      <Layer on={menuOn} className="gp-x-pop" style={abs({ right: 8, top: 40, width: 292, paddingBottom: 6, borderRadius: 14, background: '#303134', boxShadow: '0 12px 40px rgba(0,0,0,.6)', transformOrigin: '95% 5%' })}>
        <div style={{ height: 52, display: 'flex', justifyContent: 'space-around', alignItems: 'center', color: '#e8eaed', borderBottom: '1px solid #3c4043' }}>
          {[ArrowRight, Star, Download, Info, RotateCw].map((I, k) => <span key={k}>{L(I, 21)}</span>)}
        </div>
        {([[Plus, 'Nouvel onglet'], [Glasses, 'Nouvel onglet privé'], [History, 'Historique'], [Download, 'Téléchargements'], [Star, 'Favoris'], [Share, 'Partager…'], [SquarePlus, 'Ajouter à l’écran d’accueil'], [Settings, 'Paramètres']] as [LucideIcon, string][]).map(([I, t], k) => (
          <div key={t} className={'gp-and-row' + (k === 6 ? ' is-key' : '') + (k === 6 && scene === 'pick' && phase >= 1 ? ' is-pressed' : '')}>{L(I, 20)}<span>{t}</span></div>
        ))}
      </Layer>

      {/* Confirmation d'installation */}
      <Layer on={scene === 'confirm'} className="gp-x-pop" style={abs({ left: 28, right: 28, top: 300, borderRadius: 28, background: '#2d2f31', padding: '24px 24px 16px', boxShadow: '0 20px 50px rgba(0,0,0,.6)', transformOrigin: '50% 50%' })}>
        <div style={{ font: '400 22px/1.2 Roboto,system-ui,sans-serif', marginBottom: 18 }}>Installer l’application ?</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
          <img src="/icon-maskable-192-v3.png" alt="" width={48} height={48} style={{ borderRadius: 24 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={{ fontSize: 16 }}>Grand Prono</span><span style={{ fontSize: 13, color: '#9aa0a6' }}>{APP_URL}</span></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 26, fontSize: 15, fontWeight: 600, color: '#8ab4f8', paddingRight: 6 }}>
          <span>Annuler</span><span className={phase >= 1 ? 'gp-flash' : ''}>Installer</span>
        </div>
      </Layer>

      <div style={abs({ left: 135, top: 830, width: 120, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.75)', zIndex: 25 })} />
      <AndroidStatus />
    </>
  );
}
