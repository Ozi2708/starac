import type { ButtonHTMLAttributes, CSSProperties, HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { Icon } from './Icon';

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ');

// ---------- Button ----------
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glitter' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  iconRight?: string;
  block?: boolean;
  loading?: boolean;
}
export function Button({ variant = 'primary', size = 'md', icon, iconRight, block, loading, disabled, children, className, type = 'button', ...rest }: ButtonProps) {
  const is = size === 'sm' ? 16 : size === 'lg' ? 20 : 18;
  return (
    <button
      type={type}
      className={cx('gp-btn', 'gp-btn--' + variant, 'gp-btn--' + size, block && 'gp-btn--block', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Icon name="refresh-cw" size={is} className="animate-spin" /> : icon && <Icon name={icon} size={is} />}
      {children != null && <span>{children}</span>}
      {iconRight && !loading && <Icon name={iconRight} size={is} />}
    </button>
  );
}

// ---------- IconButton ----------
export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  label: string;
  variant?: 'glass' | 'ghost' | 'primary';
  size?: number;
  dot?: boolean;
}
export function IconButton({ icon, label, variant = 'glass', size = 44, dot, className, style, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button type={type} aria-label={label} title={label} className={cx('gp-iconbtn', 'gp-iconbtn--' + variant, className)} style={{ width: size, height: size, ...style }} {...rest}>
      <Icon name={icon} size={Math.round(size * 0.45)} />
      {dot && <span className="gp-iconbtn__dot" />}
    </button>
  );
}

// ---------- Badge ----------
export type BadgeTone = 'neutral' | 'open' | 'closed' | 'live' | 'gold' | 'magenta';
export function Badge({ tone = 'neutral', icon, children, className }: { tone?: BadgeTone; icon?: string | null; children: ReactNode; className?: string }) {
  return (
    <span className={cx('gp-badge gp-badge--' + tone, className)}>
      {tone === 'live' && <span className="gp-badge__dot" />}
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  );
}

// ---------- Avatar ----------
const HUES: [string, string][] = [['#d243e6', '#4a24c8'], ['#ff8a1f', '#b42ccc'], ['#63d9ff', '#6a3cf0'], ['#ffcb5c', '#e8650c'], ['#8b67ff', '#24106a']];
export const hueOf = (name: string) => HUES[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % HUES.length];
export const hueGradient = (name: string, angle = 140) => { const h = hueOf(name); return `linear-gradient(${angle}deg,${h[0]},${h[1]})`; };

export function Avatar({ name = '', src, size = 40, ring, className, style }: { name?: string; src?: string | null; size?: number; ring?: 'gold' | 'magenta' | 'flare' | null; className?: string; style?: CSSProperties }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <span
      className={cx('gp-avatar', ring && 'gp-avatar--ring-' + ring, className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38), background: src ? 'none' : hueGradient(name), ...style }}
      role="img"
      aria-label={name}
    >
      {src ? <img src={src} alt="" loading="lazy" /> : initials}
    </span>
  );
}

// ---------- Vignette carrée (ligue, image) ----------
export function Thumb({ name, src, size = 56, radius = 14 }: { name: string; src?: string | null; size?: number; radius?: number }) {
  return (
    <span
      className="flex flex-none items-center justify-center overflow-hidden text-white"
      style={{ width: size, height: size, borderRadius: radius, background: src ? 'none' : hueGradient(name), font: `italic 900 ${Math.round(size * 0.43)}px var(--font-display)` }}
      aria-hidden="true"
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : [...name.trim()][0]?.toUpperCase()}
    </span>
  );
}

// ---------- PointsChip ----------
export function PointsChip({ value, tone, size = 'md', icon, suffix = 'pts' }: { value: number | string; tone?: 'gold' | 'gain' | 'loss' | 'neutral'; size?: 'md' | 'lg'; icon?: string; suffix?: string }) {
  const t = tone || (typeof value === 'number' ? (value > 0 ? 'gain' : value < 0 ? 'loss' : 'neutral') : 'gold');
  const txt = typeof value === 'number' ? (value > 0 ? '+' : value < 0 ? '−' : '') + Math.abs(value) : value;
  return (
    <span className={'gp-points gp-points--' + t + (size === 'lg' ? ' gp-points--lg' : '')}>
      <span>
        {icon && <Icon name={icon} size={size === 'lg' ? 16 : 13} />}
        {txt}
        {suffix ? ' ' + suffix : ''}
      </span>
    </span>
  );
}

// ---------- ProgressBar ----------
export function ProgressBar({ value = 0, max = 100, tone = 'flare', label, valueLabel }: { value?: number; max?: number; tone?: 'flare' | 'gold' | 'cyan'; label?: ReactNode; valueLabel?: ReactNode }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className={'gp-progress gp-progress--' + tone}>
      {(label || valueLabel != null) && (
        <div className="gp-progress__head">
          <span>{label}</span>
          <b className="whitespace-nowrap">{valueLabel ?? `${value}/${max}`}</b>
        </div>
      )}
      <div className="gp-progress__track" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
        <div className="gp-progress__fill" style={{ width: pct + '%' }} />
      </div>
    </div>
  );
}

// ---------- StatTile ----------
export function StatTile({ label, value, accent, gold, valueStyle }: { label: ReactNode; value: ReactNode; accent?: string; gold?: boolean; valueStyle?: CSSProperties }) {
  return (
    <div className="gp-stat">
      <span className={cx('gp-stat__val', gold && 'gp-gold-text self-start pr-1')} style={{ ...(accent ? { color: accent } : null), ...valueStyle }}>
        {value}
      </span>
      <span className="gp-stat__lbl">{label}</span>
    </div>
  );
}

// ---------- SegmentedControl ----------
export function SegmentedControl<T extends string>({ options, value, onChange, block = true, className }: { options: { value: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; block?: boolean; className?: string }) {
  return (
    <div className={cx('gp-seg', block && 'gp-seg--block', className)} role="tablist">
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={o.value === value} className={'gp-seg__opt' + (o.value === value ? ' gp-seg__opt--on' : '')} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------- Switch ----------
export function Switch({ checked, onChange, label, disabled, ariaLabel }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode; disabled?: boolean; ariaLabel?: string }) {
  return (
    <label className={cx('gp-switch relative', checked && 'gp-switch--on', disabled && 'gp-switch--disabled')}>
      <input type="checkbox" role="switch" aria-label={ariaLabel} checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="absolute h-0 w-0 opacity-0" />
      <span className="gp-switch__track">
        <span className="gp-switch__thumb" />
      </span>
      {label && <span>{label}</span>}
    </label>
  );
}

// ---------- Input ----------
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  icon?: string;
}
export function Input({ label, hint, error, icon, id, className, ...rest }: InputProps) {
  const fid = id || (typeof label === 'string' ? 'in-' + label.replace(/\W+/g, '-').toLowerCase() : undefined);
  return (
    <div className={cx('gp-field', !!error && 'gp-field--error', className)}>
      {label && <label className="gp-field__label" htmlFor={fid}>{label}</label>}
      <div className="gp-field__control">
        {icon && <Icon name={icon} size={18} />}
        <input id={fid} aria-invalid={!!error || undefined} {...rest} />
      </div>
      {(error || hint) && <span className="gp-field__hint">{error || hint}</span>}
    </div>
  );
}

export function TextArea({ label, hint, className, ...rest }: { label?: ReactNode; hint?: ReactNode } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className={cx('gp-field', className)}>
      {label && <span className="gp-field__label">{label}</span>}
      <textarea
        className="min-h-[76px] resize-y rounded-md border-0 bg-card px-4 py-3 text-primary shadow-subtle outline-none focus:shadow-glow-cyan"
        style={{ font: 'var(--text-body-s)' }}
        {...rest}
      />
      {hint && <span className="gp-field__hint">{hint}</span>}
    </label>
  );
}

// ---------- Card ----------
export function Card({ variant = 'glass', padding = 16, interactive, className, style, children, ...rest }: { variant?: 'glass' | 'solid' | 'stage' | 'edge'; padding?: number; interactive?: boolean } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx('gp-card', 'gp-card--' + variant, interactive && 'gp-card--interactive', className)} style={{ padding, ...style }} {...rest}>
      {children}
    </div>
  );
}

// ---------- Titres de section ----------
export function Overline({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <span className={cx('t-overline text-secondary', className)} style={style}>{children}</span>;
}

export function Section({ title, aside, children, gap = 12 }: { title: ReactNode; aside?: ReactNode; children: ReactNode; gap?: number }) {
  return (
    <section className="flex flex-col" style={{ gap }}>
      <div className="flex items-center justify-between gap-3">
        <Overline>{title}</Overline>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Skeleton({ h = 60, className, style }: { h?: number; className?: string; style?: CSSProperties }) {
  return <div className={cx('skeleton', className)} style={{ height: h, ...style }} aria-hidden="true" />;
}

export function IconCircle({ icon, tone = 'neutral', size = 40 }: { icon: string; tone?: 'neutral' | 'green' | 'gold' | 'flare' | 'muted'; size?: number }) {
  const styles: Record<string, CSSProperties> = {
    neutral: { background: 'rgba(255,255,255,.08)', color: 'var(--text-primary)' },
    muted: { background: 'rgba(255,255,255,.08)', color: 'var(--text-secondary)' },
    green: { background: 'rgba(47,217,154,.16)', color: 'var(--green-500)' },
    gold: { background: 'var(--grad-gold)', color: '#3a1a00' },
    flare: { background: 'rgba(255,138,31,.16)', color: 'var(--flare-400)' },
  };
  return (
    <span className="flex flex-none items-center justify-center rounded-full" style={{ width: size, height: size, ...styles[tone] }}>
      <Icon name={icon} size={Math.round(size * 0.45)} />
    </span>
  );
}

export const LEGAL = 'Jeu entre amis, sans argent. Créé par des fans, sans affiliation avec TF1 ni la production.';
export function LegalNote() {
  return <p className="t-caption m-0 text-pretty text-center text-muted">{LEGAL}</p>;
}
