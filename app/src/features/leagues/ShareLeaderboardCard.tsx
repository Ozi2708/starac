import { forwardRef } from 'react';
import type { LeagueLeaderRow, League, Season } from '@/lib/types';
import { Avatar, Thumb } from '@/components/ui/core';
import { fmtNum } from '@/lib/format';

/** Visuel 1080×1350 exporté par « Partager le classement en image ». */
export const ShareLeaderboardCard = forwardRef<HTMLDivElement, { league: League; rows: LeagueLeaderRow[]; season: Season | null }>(function ShareLeaderboardCard({ league, rows, season }, ref) {
  return (
    <div ref={ref} style={{ width: 1080, height: 1350, padding: 72, boxSizing: 'border-box', background: 'var(--grad-stage)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: 40, fontFamily: 'var(--font-body)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ font: '700 26px/1.2 var(--font-body)', letterSpacing: '.14em', color: 'var(--gold-200)' }}>STAR ACADEMY {season?.year ?? ''}</span>
          <span className="gp-glitter-text" style={{ font: 'italic 900 64px/1 var(--font-display)', paddingRight: 8 }}>Le Grand Prono</span>
        </div>
        <Thumb name={league.name} src={league.image_url} size={120} radius={32} />
      </div>
      <div style={{ font: 'italic 800 56px/1.1 var(--font-display)' }}>{league.name}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        {rows.slice(0, 8).map((r) => (
          <div key={r.user_id} style={{ display: 'flex', alignItems: 'center', gap: 28, padding: '18px 28px', borderRadius: 28, background: r.rank === 1 ? 'rgba(255,203,92,.12)' : 'rgba(255,255,255,.06)', boxShadow: r.rank === 1 ? 'inset 0 0 0 2px rgba(255,203,92,.5)' : 'inset 0 0 0 1px rgba(255,255,255,.1)' }}>
            <span style={{ width: 64, font: 'italic 900 52px/1 var(--font-numeric)', color: r.rank === 1 ? 'var(--gold-400)' : r.rank === 2 ? 'var(--violet-200)' : r.rank === 3 ? 'var(--flare-400)' : 'var(--text-secondary)' }}>{r.rank}</span>
            <Avatar name={r.pseudo} src={r.avatar_url} size={80} ring={r.rank === 1 ? 'gold' : null} />
            <span style={{ flex: 1, font: '700 40px/1.2 var(--font-body)' }}>{r.pseudo}</span>
            <span style={{ font: 'italic 800 48px/1 var(--font-numeric)' }}>{fmtNum(r.total)}<small style={{ font: '600 24px var(--font-body)', color: 'var(--text-muted)', marginLeft: 8 }}>pts</small></span>
          </div>
        ))}
      </div>
      <span style={{ textAlign: 'center', font: '500 26px var(--font-body)', color: 'var(--text-muted)' }}>legrandprono.app · jeu entre amis, sans argent</span>
    </div>
  );
});
