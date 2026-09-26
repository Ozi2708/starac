import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { isDemoSeason, useMyLeagues, usePrimes, currentPrime } from '@/lib/queries';
import { fmtLong } from '@/lib/format';
import type { Season } from '@/lib/types';
import { Badge, Button, LegalNote, Overline } from '@/components/ui/core';
import { Countdown, KeyArtHero } from '@/components/ui/game';
import { LeagueDialogs, type LeagueDialog } from '@/features/leagues/LeagueDialogs';

const STEPS = ['Pronostique les grands événements de la saison.', 'Gagne des points chaque semaine.', 'Affronte tes amis jusqu’à la finale.'];

/** Avant-saison (écran 1) : logo, nom du jeu, compte à rebours, 3 étapes, inscription / ligue. */
export function Landing({ season, signedIn }: { season: Season | null; signedIn?: boolean }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const leagues = useMyLeagues();
  const primes = usePrimes(season?.id);
  const [dlg, setDlg] = useState<LeagueDialog>(null);

  const pre = !season || season.phase === 'pre';
  const next = pre ? season?.first_prime_at : currentPrime(primes.data)?.airs_at ?? season?.first_prime_at;
  const hasLeague = (leagues.data?.length ?? 0) > 0;

  return (
    <div className="relative flex min-h-[100dvh] flex-col">
      <KeyArtHero />
      <div className="relative flex flex-col gap-7 px-5 pt-[230px]" style={{ paddingBottom: signedIn ? 120 : 40 }}>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Badge tone="magenta">{pre ? 'Avant-saison' : 'Saison en cours'}</Badge>
            {isDemoSeason(season) && <Badge>Démo</Badge>}
          </div>
          <Overline className="text-gold-200">SAISON {season?.year ?? 2026} · LE JEU DE PRONOS</Overline>
          <h1 className="gp-glitter-text m-0 pr-1.5" style={{ font: 'italic 900 46px/1 var(--font-display)', letterSpacing: '-.015em' }}>Le Grand Prono</h1>
          <span className="t-body-l text-secondary">Une saison. Des pronos. Un seul gagnant.</span>
        </div>

        {next && new Date(next).getTime() > Date.now() && (
          <div className="flex flex-col gap-2.5">
            <Overline>{pre ? 'PREMIER PRIME DANS' : 'PROCHAIN PRIME DANS'}</Overline>
            <Countdown to={next} onDone={() => qc.invalidateQueries({ queryKey: ['season'] })} />
            <span className="t-caption text-muted">{fmtLong(next)}, heure de Paris</span>
          </div>
        )}

        <ol className="m-0 flex list-none flex-col border-t border-subtle p-0">
          {STEPS.map((s, i) => (
            <li key={i} className="flex items-center gap-4 border-b border-subtle py-3.5">
              <span className="w-7 text-flare-400" style={{ font: 'italic 900 26px/1 var(--font-numeric)' }}>{i + 1}</span>
              <span className="t-body font-semibold">{s}</span>
            </li>
          ))}
        </ol>

        <div className="flex flex-col gap-2.5">
          {!signedIn ? (
            <>
              <Button size="lg" block onClick={() => navigate('/connexion?mode=inscription')}>Créer mon compte</Button>
              <Button size="lg" block variant="secondary" icon="key-round" onClick={() => navigate('/connexion?next=/ligues')}>Rejoindre une ligue</Button>
              <Button variant="ghost" onClick={() => navigate('/connexion')}>J’ai déjà un compte</Button>
            </>
          ) : hasLeague ? (
            <>
              {season?.phase === 'open' && <Button size="lg" block iconRight="arrow-right" onClick={() => navigate('/pronos?tab=saison')}>Faire mes grands pronos</Button>}
              <Button size="lg" block variant={season?.phase === 'open' ? 'secondary' : 'primary'} icon="users" onClick={() => navigate('/ligues')}>Mes ligues</Button>
              <Button size="lg" block variant="secondary" icon="key-round" onClick={() => setDlg('join')}>Rejoindre une autre ligue</Button>
            </>
          ) : (
            <>
              <Button size="lg" block icon="plus" onClick={() => setDlg('create')}>Créer ma ligue</Button>
              <Button size="lg" block variant="secondary" icon="key-round" onClick={() => setDlg('join')}>Rejoindre une ligue</Button>
            </>
          )}
          {signedIn && pre && <span className="t-caption text-center text-muted">Les candidats et les grands pronos arrivent dès leur annonce officielle.</span>}
        </div>
        <LegalNote />
      </div>
      <LeagueDialogs open={dlg} onClose={() => setDlg(null)} onDone={(id) => navigate(`/ligues/${id}`)} />
    </div>
  );
}
