import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Avatar, Badge, PointsChip, cx, hueOf, type BadgeTone } from './core';
import { Icon } from './Icon';

// ---------- Countdown ----------
const pad = (n: number) => String(n).padStart(2, '0');

/** Compte à rebours ; `onDone` est appelé une fois à zéro (déclenche un refetch → état verrouillé). */
export function Countdown({ to, size = 'md', showDays = true, onDone }: { to: string | number | Date; size?: 'md' | 'sm'; showDays?: boolean; onDone?: () => void }) {
  const target = useMemo(() => new Date(to).getTime(), [to]);
  const [now, setNow] = useState(Date.now());
  const fired = useRef(false);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.max(0, Math.floor((target - now) / 1000));
  useEffect(() => {
    if (s === 0 && !fired.current && onDone) {
      fired.current = true;
      onDone();
    }
    if (s > 0) fired.current = false;
  }, [s, onDone]);
  const parts = [Math.floor(s / 86400), Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60];
  const labels = ['J', 'H', 'Min', 'Sec'];
  let cells = showDays ? parts.map((v, i) => [v, labels[i]] as const) : parts.slice(1).map((v, i) => [v, labels[i + 1]] as const);
  if (!showDays) cells = [[parts[0] * 24 + parts[1], 'H'], cells[1], cells[2]];
  return (
    <div className={'gp-countdown' + (size === 'sm' ? ' gp-countdown--sm' : '')} role="timer" aria-label={`${parts[0]} jours ${parts[1]} heures ${parts[2]} minutes`}>
      {cells.map(([v, l], i) => (
        <span key={i} className="contents">
          {i > 0 && <span className="gp-countdown__sep">:</span>}
          <span className="gp-countdown__cell">
            <span className="gp-countdown__num">{pad(v)}</span>
            {size !== 'sm' && <span className="gp-countdown__lbl">{l}</span>}
          </span>
        </span>
      ))}
    </div>
  );
}

// ---------- PronoCard ----------
export type PronoStatus = 'open' | 'done' | 'closed' | 'won' | 'live' | 'cancelled' | 'pending';
const ST: Record<PronoStatus, [BadgeTone, string]> = {
  open: ['open', 'Ouvert'],
  done: ['magenta', 'Joué'],
  closed: ['closed', 'Fermé'],
  won: ['gold', 'Gagné'],
  live: ['live', 'En direct'],
  cancelled: ['closed', 'Annulé'],
  pending: ['neutral', 'En attente'],
};
export function PronoCard({ question, status = 'open', points, pointsSuffix, deadline, pick, icon = 'sparkles', onClick }: {
  question: string; status?: PronoStatus; points?: number | string | null; pointsSuffix?: string; deadline?: string | null; pick?: string | null; icon?: string; onClick?: () => void;
}) {
  const [tone, lbl] = ST[status];
  return (
    <button type="button" className="gp-prono" onClick={onClick}>
      <div className="gp-prono__top">
        <Badge tone={tone}>{lbl}</Badge>
        {points != null && <PointsChip value={typeof points === 'number' && status !== 'won' ? String(points) : points} tone={status === 'won' ? 'gain' : 'gold'} icon="star" suffix={pointsSuffix ?? 'pts'} />}
      </div>
      <div className="gp-prono__q">{question}</div>
      <div className="gp-prono__foot">
        <span className="gp-prono__pick min-w-0 overflow-hidden text-ellipsis">
          <Icon name={pick ? 'circle-check' : icon} size={14} />
          <span className="overflow-hidden text-ellipsis">{pick ?? 'Pas encore joué'}</span>
        </span>
        {deadline ? (
          <span className="inline-flex items-center gap-1">
            <Icon name="clock" size={13} />
            {deadline}
          </span>
        ) : (
          <Icon name="chevron-right" size={16} />
        )}
      </div>
    </button>
  );
}

// ---------- CandidateCard (sélection) ----------
export function CandidateCard({ name, photo, meta, selected, eliminated, disabled, onSelect, size = 64 }: {
  name: string; photo?: string | null; meta?: ReactNode; selected?: boolean; eliminated?: boolean; disabled?: boolean; onSelect?: () => void; size?: number;
}) {
  return (
    <button
      type="button"
      className={cx('gp-cand', selected && 'gp-cand--on', eliminated && 'gp-cand--out')}
      disabled={eliminated || disabled}
      aria-pressed={!!selected}
      onClick={() => !eliminated && !disabled && onSelect?.()}
      style={disabled && !eliminated ? { cursor: 'default' } : undefined}
    >
      <span className="gp-cand__tick">
        <Icon name="check" size={14} />
      </span>
      <Avatar name={name} src={photo} size={size} ring={selected ? 'flare' : undefined} />
      <span className="flex flex-col gap-0.5">
        <span className="gp-cand__name">{name}</span>
        {meta && <span className="gp-cand__meta">{meta}</span>}
      </span>
    </button>
  );
}

// ---------- CandidateTile (grille Candidats) ----------
export const STATUS_LABEL: Record<string, [string, BadgeTone]> = {
  competing: ['En compétition', 'neutral'],
  nominated: ['Nommé·e', 'magenta'],
  immune: ['Immunisé·e', 'open'],
  eliminated: ['Éliminé·e', 'closed'],
  finalist: ['Finaliste', 'gold'],
  winner: ['Vainqueur', 'gold'],
};

export function PhotoFill({ name, src, out, style }: { name: string; src?: string | null; out?: boolean; style?: CSSProperties }) {
  const h = hueOf(name);
  return (
    <div
      className="absolute inset-0"
      style={{
        background: src ? `center / cover no-repeat url("${src}")` : `linear-gradient(160deg,${h[0]},${h[1]})`,
        filter: out ? 'grayscale(1)' : undefined,
        opacity: out ? 0.45 : 1,
        ...style,
      }}
    />
  );
}

export function CandidateTile({ name, photo, status, onClick }: { name: string; photo?: string | null; status: string; onClick?: () => void }) {
  const [lbl, tone] = STATUS_LABEL[status] ?? STATUS_LABEL.competing;
  const out = status === 'eliminated';
  return (
    <button type="button" onClick={onClick} className="gp-card--interactive relative aspect-[3/4] overflow-hidden rounded-lg border-0 bg-violet-800 p-0 text-left shadow-subtle" aria-label={`${name}, ${lbl}`}>
      <PhotoFill name={name} src={photo} out={out} />
      {!photo && (
        <span className="absolute inset-x-0 top-[22%] text-center text-white/20" style={{ font: 'italic 900 72px/1 var(--font-display)' }} aria-hidden="true">
          {name[0]}
        </span>
      )}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(13,3,34,0) 45%,rgba(13,3,34,.92) 100%)' }} />
      <div className="absolute inset-x-3 bottom-3 flex flex-col items-start gap-1.5">
        <span className="text-white" style={{ font: 'italic 800 21px/1 var(--font-display)' }}>{name}</span>
        <Badge tone={tone}>{lbl}</Badge>
      </div>
    </button>
  );
}

// ---------- LeaderboardRow ----------
export function LeaderboardRow({ rank, name, sub, avatar, points, move = 0, me, onClick }: { rank: number; name: string; sub?: ReactNode; avatar?: string | null; points: ReactNode; move?: number | null; me?: boolean; onClick?: () => void }) {
  const m = move ?? 0;
  const dir = m > 0 ? 'up' : m < 0 ? 'down' : 'flat';
  return (
    <div className={'gp-lb' + (me ? ' gp-lb--me' : '')} onClick={onClick} role={onClick ? 'button' : undefined}>
      <span className={'gp-lb__rank' + (rank <= 3 ? ' gp-lb__rank--' + rank : '')}>{rank}</span>
      <Avatar name={name} src={avatar} size={40} ring={rank === 1 ? 'gold' : me ? 'magenta' : undefined} />
      <span className="gp-lb__who">
        <span className="gp-lb__name">
          {name}
          {me ? ' (toi)' : ''}
        </span>
        {sub && <span className="gp-lb__sub">{sub}</span>}
      </span>
      <span className={'gp-lb__move gp-lb__move--' + dir} aria-label={dir === 'flat' ? 'stable' : `${dir === 'up' ? 'gagne' : 'perd'} ${Math.abs(m)} place(s)`}>
        {dir === 'flat' ? <Icon name="minus" size={14} /> : (<><Icon name={dir === 'up' ? 'chevron-up' : 'chevron-down'} size={14} />{Math.abs(m)}</>)}
      </span>
      <span className="gp-lb__pts">
        {points}
        <small>pts</small>
      </span>
    </div>
  );
}

// ---------- BottomNav ----------
export function BottomNav({ items, value, onChange }: { items: { value: string; label: string; icon: string; center?: boolean }[]; value: string; onChange: (v: string) => void }) {
  return (
    <nav className="gp-bnav" aria-label="Navigation principale">
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          className={'gp-bnav__item' + (it.value === value ? ' gp-bnav__item--on' : '') + (it.center ? ' gp-bnav__item--center' : '')}
          onClick={() => onChange(it.value)}
          aria-current={it.value === value ? 'page' : undefined}
        >
          {it.center ? (
            <span className="gp-bnav__bubble">
              <Icon name={it.icon} size={24} />
            </span>
          ) : (
            <Icon name={it.icon} size={22} />
          )}
          <span>{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ---------- Wordmark ----------
export function Wordmark({ size = 20, overline = true }: { size?: number; overline?: boolean }) {
  return (
    <span className="inline-flex flex-col gap-0.5">
      {overline && <span className="t-overline text-gold-200">STAR ACADEMY</span>}
      <span className="gp-glitter-text pr-1" style={{ font: `italic 900 ${size}px/1 var(--font-display)` }}>Le Grand Prono</span>
    </span>
  );
}

/** Le logo officiel n'existe que dans le key art : on l'affiche tel quel, cadré (jamais redessiné). */
export function KeyArtHero({ height = 300, fadeAt = '70%' }: { height?: number; fadeAt?: string }) {
  return (
    <>
      <div className="absolute inset-x-0 top-0" style={{ height, background: 'url(/key-art.jpg) calc(50% - 5px) 10px / 500px auto no-repeat, #2a1275' }} role="img" aria-label="Star Academy 2026" />
      <div className="absolute inset-x-0 top-0" style={{ height: height + 2, background: `linear-gradient(180deg,rgba(13,3,34,.45) 0%,rgba(13,3,34,0) 16%,rgba(13,3,34,0) ${fadeAt},#0d0322 100%)` }} />
    </>
  );
}
