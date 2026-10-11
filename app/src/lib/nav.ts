import { useNavigate } from 'react-router-dom';

/**
 * Bouton « Retour » sûr : revient en arrière seulement si la page précédente est dans l'app
 * (React Router compte les entrées dans history.state.idx). Arrivé par un lien externe
 * (invitation, notification…), on va vers `fallback` au lieu de quitter l'app.
 */
export function useBack(fallback: string) {
  const navigate = useNavigate();
  return () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  };
}
