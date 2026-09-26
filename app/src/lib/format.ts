import { formatInTimeZone } from 'date-fns-tz';
import { fr } from 'date-fns/locale';

export const TZ = 'Europe/Paris';

type D = string | number | Date;
const f = (d: D, pattern: string) => formatInTimeZone(new Date(d), TZ, pattern, { locale: fr });

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** « 21h10 » */
export const fmtTime = (d: D) => f(d, "HH'h'mm");
/** « sam. 21h10 » */
export const fmtDayTime = (d: D) => f(d, "EEE HH'h'mm");
/** « 17 oct. » */
export const fmtShortDate = (d: D) => f(d, 'd MMM');
/** « sam. 17 oct. » */
export const fmtDay = (d: D) => f(d, 'EEE d MMM');
/** « Sam. 17 oct. · 21h10 » */
export const fmtLong = (d: D) => cap(f(d, "EEE d MMM '·' HH'h'mm"));
/** « sam. 17 oct. 21h00 » */
export const fmtDayDateTime = (d: D) => f(d, "EEE d MMM HH'h'mm");
/** « 17 oct. à 21h00 » */
export const fmtDateAt = (d: D) => f(d, "d MMM 'à' HH'h'mm");
/** « oct. 2026 » */
export const fmtMonthYear = (d: D) => f(d, 'MMM yyyy');
/** Valeur d'un <input type="datetime-local"> exprimée à l'heure de Paris. */
export const toParisInput = (d: D) => f(d, "yyyy-MM-dd'T'HH:mm");

/** Convertit une saisie « heure de Paris » (datetime-local) en ISO UTC. */
export function fromParisInput(v: string): string {
  // Décalage de Paris à cette date : on part d'une estimation UTC puis on corrige.
  const guess = new Date(v + 'Z');
  const parisAsUtc = new Date(formatInTimeZone(guess, TZ, "yyyy-MM-dd'T'HH:mm:ss") + 'Z');
  const offset = parisAsUtc.getTime() - guess.getTime();
  return new Date(guess.getTime() - offset).toISOString();
}

/** Clôture proche : « ven. 18h00 » dans la semaine, sinon « 17 oct. ». */
export function fmtClose(d: D, now = Date.now()) {
  const diff = new Date(d).getTime() - now;
  return diff > 0 && diff < 6 * 86400_000 ? fmtDayTime(d) : fmtShortDate(d);
}

const nf = new Intl.NumberFormat('fr-FR');
/** « 1 184 » */
export const fmtNum = (n: number) => nf.format(n);
/** « +30 » / « 0 » */
export const fmtGain = (n: number) => (n > 0 ? '+' + fmtNum(n) : fmtNum(n));
export const fmtPct = (n: number) => fmtNum(Math.round(n)) + ' %';
export const ordinal = (n: number) => (n === 1 ? '1er' : n + 'e');

/** Temps relatif compact pour les notifications : « à l'instant », « il y a 2 h », sinon « sam. 23h40 ». */
export function fmtAgo(d: D, now = Date.now()) {
  const s = (now - new Date(d).getTime()) / 1000;
  if (s < 60) return 'à l’instant';
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 6 * 3600) return `il y a ${Math.floor(s / 3600)} h`;
  return fmtDayTime(d);
}

export const plural = (n: number, one: string, many = one + 's') => `${fmtNum(n)} ${n > 1 ? many : one}`;

/** Pour les noms écrits en inclusif selon le contexte. */
export const joinNames = (names: string[]) => names.join(', ');
