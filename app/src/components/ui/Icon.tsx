import type { CSSProperties } from 'react';
import {
  Archive, ArrowLeft, ArrowRight, Ban, Bell, Calendar, CalendarCheck, Camera, ChartLine, Check, ChevronDown, ChevronRight,
  ChevronUp, CircleCheck, Clock, Copy, Crown, DoorOpen, Download, Eye, Flag, Flame, Heart, History, House, Image, Info,
  KeyRound, LayoutDashboard, Link, ListChecks, Lock, LogOut, Mail, Medal, Minus, Pencil, Plus, RefreshCw, Repeat, Scale,
  Send, Share2, Shield, ShieldCheck, Sparkles, Star, Target, Ticket, Trash2, TrendingUp, Trophy, User, Users, X, Zap,
  type LucideIcon,
} from 'lucide-react';

// Noms Lucide (kebab-case) utilisés par le design system et stockés en base (questions.icon, badges.icon).
const ICONS: Record<string, LucideIcon> = {
  archive: Archive, 'arrow-left': ArrowLeft, 'arrow-right': ArrowRight, ban: Ban, bell: Bell, calendar: Calendar,
  'calendar-check': CalendarCheck, camera: Camera, 'chart-line': ChartLine, check: Check, 'chevron-down': ChevronDown,
  'chevron-right': ChevronRight, 'chevron-up': ChevronUp, 'circle-check': CircleCheck, clock: Clock, copy: Copy, crown: Crown,
  'door-open': DoorOpen, download: Download, eye: Eye, flag: Flag, flame: Flame, heart: Heart, history: History, house: House,
  image: Image, info: Info, 'key-round': KeyRound, 'layout-dashboard': LayoutDashboard, link: Link, 'list-checks': ListChecks,
  lock: Lock, 'log-out': LogOut, mail: Mail, medal: Medal, minus: Minus, pencil: Pencil, plus: Plus, 'refresh-cw': RefreshCw,
  repeat: Repeat, scale: Scale, send: Send, 'share-2': Share2, shield: Shield, 'shield-check': ShieldCheck, sparkles: Sparkles,
  star: Star, target: Target, ticket: Ticket, trash: Trash2, 'trending-up': TrendingUp, trophy: Trophy, user: User, users: Users,
  x: X, zap: Zap,
};

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
  strokeWidth?: number;
}

export function Icon({ name, size = 20, color, className, style, strokeWidth = 2 }: IconProps) {
  const C = ICONS[name] ?? Sparkles;
  return (
    <C
      aria-hidden="true"
      className={'gp-icon' + (className ? ' ' + className : '')}
      size={size}
      strokeWidth={strokeWidth}
      style={{ color, ...style }}
    />
  );
}
