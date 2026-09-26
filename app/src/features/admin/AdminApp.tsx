import type { ReactNode } from 'react';
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { isDemoSeason, useSeason } from '@/lib/queries';
import { Avatar, Badge, Button } from '@/components/ui/core';
import { Icon } from '@/components/ui/Icon';
import { AdminDashboard } from './AdminDashboard';
import { AdminSeason } from './AdminSeason';
import { AdminCandidates } from './AdminCandidates';
import { AdminQuestions } from './AdminQuestions';
import { AdminResults } from './AdminResults';
import { AdminLeagues } from './AdminLeagues';
import { AdminJournal } from './AdminJournal';

const NAV = [
  { to: '/admin', label: 'Tableau de bord', icon: 'layout-dashboard', end: true },
  { to: '/admin/saison', label: 'Saison', icon: 'calendar' },
  { to: '/admin/candidats', label: 'Candidats', icon: 'users' },
  { to: '/admin/questions', label: 'Questions', icon: 'list-checks' },
  { to: '/admin/resultats', label: 'Résultats', icon: 'flag' },
  { to: '/admin/ligues', label: 'Ligues', icon: 'trophy' },
  { to: '/admin/journal', label: 'Journal', icon: 'history' },
];

/** Back-office desktop (≥ 1200px) : barre du haut 60px, sidebar 190px. */
export default function AdminApp() {
  const { profile } = useAuth();
  const season = useSeason();
  const navigate = useNavigate();
  return (
    <div className="flex h-[100dvh] min-w-[1100px] flex-col bg-page">
      <header className="flex h-[60px] flex-none items-center gap-4 border-b border-subtle px-6">
        <div className="flex items-baseline gap-2.5">
          <span className="gp-glitter-text pr-1" style={{ font: 'italic 900 20px/1 var(--font-display)' }}>Le Grand Prono</span>
          <span className="t-overline text-secondary">ADMINISTRATION</span>
        </div>
        {season.data && <Badge tone="magenta">{season.data.name.replace(/Star Academy /, 'Saison ').replace(/ · DÉMO/, '')}</Badge>}
        {isDemoSeason(season.data) && <Badge>Démo</Badge>}
        <span className="flex-1" />
        <Button variant="ghost" size="sm" icon="house" onClick={() => navigate('/')}>Voir l’app</Button>
        <span className="t-body-s whitespace-nowrap text-secondary">{profile?.pseudo} (admin)</span>
        <Avatar name={profile?.pseudo} src={profile?.avatar_url} size={32} />
      </header>
      <div className="flex min-h-0 flex-1">
        <nav className="flex w-[190px] flex-none flex-col gap-0.5 border-r border-subtle px-2.5 py-[18px]">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => 'flex h-10 items-center gap-2.5 whitespace-nowrap rounded-sm px-3 no-underline hover:no-underline ' + (isActive ? 'bg-white/[.08] text-primary shadow-subtle' : 'text-muted hover:text-primary')}
              style={{ font: 'var(--text-body-s)', fontWeight: 600 }}>
              <Icon name={n.icon} size={17} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="min-w-0 flex-1 overflow-auto">
          {!season.data && !season.isLoading ? (
            <Routes>
              <Route path="saison" element={<AdminSeason />} />
              <Route path="*" element={<Navigate to="/admin/saison" replace />} />
            </Routes>
          ) : (
            <Routes>
              <Route index element={<AdminDashboard />} />
              <Route path="saison" element={<AdminSeason />} />
              <Route path="candidats" element={<AdminCandidates />} />
              <Route path="questions" element={<AdminQuestions />} />
              <Route path="resultats" element={<AdminResults />} />
              <Route path="ligues" element={<AdminLeagues />} />
              <Route path="journal" element={<AdminJournal />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminPage({ title, sub, actions, children }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <main className="flex flex-col gap-6 px-8 py-7">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="t-h1 m-0">{title}</h1>
          {sub && <span className="t-body-s text-muted">{sub}</span>}
        </div>
        {actions && <div className="flex flex-none gap-2">{actions}</div>}
      </div>
      {children}
    </main>
  );
}

/** Tableau sobre (grille CSS) utilisé par toutes les pages admin. */
export function Table({ cols, head, children }: { cols: string; head: string[]; children: ReactNode }) {
  return (
    <div className="flex flex-col rounded-md bg-card shadow-subtle">
      <div className="t-overline grid items-center gap-3 px-4 py-2.5 text-muted" style={{ gridTemplateColumns: cols, letterSpacing: '.1em' }}>
        {head.map((h) => <span key={h}>{h}</span>)}
      </div>
      {children}
    </div>
  );
}
export function Tr({ cols, children, onClick, active }: { cols: string; children: ReactNode; onClick?: () => void; active?: boolean }) {
  return (
    <div onClick={onClick} className={'t-body-s grid min-h-[52px] items-center gap-3 border-t border-subtle px-4 py-1.5' + (onClick ? ' cursor-pointer hover:bg-white/[.03]' : '')}
      style={{ gridTemplateColumns: cols, ...(active ? { background: 'rgba(255,255,255,.06)' } : null) }}>
      {children}
    </div>
  );
}
