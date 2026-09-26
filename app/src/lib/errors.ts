// Traduction des erreurs levées par les fonctions SQL (raise exception 'CODE').
const MESSAGES: Record<string, [string, string]> = {
  AUTH_REQUIRED: ['Connexion requise', 'Connecte-toi pour continuer.'],
  PROFILE_REQUIRED: ['Profil incomplet', 'Choisis ton pseudo avant de jouer.'],
  QUESTION_NOT_FOUND: ['Question introuvable', 'Elle a peut-être été retirée.'],
  QUESTION_LOCKED: ['Prono verrouillé', 'La clôture est passée : ta réponse précédente est conservée.'],
  BAD_SELECTION_COUNT: ['Sélection incomplète', 'Vérifie le nombre de candidats choisis.'],
  DUPLICATE_OPTION: ['Doublon', 'Un même choix ne compte qu’une fois.'],
  INVALID_OPTION: ['Choix invalide', 'Recharge la page et réessaie.'],
  CANDIDATE_ELIMINATED: ['Candidat éliminé', 'Ce candidat n’est plus en compétition.'],
  NUMBER_REQUIRED: ['Nombre manquant', 'Saisis un nombre.'],
  INVALID_CODE: ['Code introuvable', 'Vérifie le code avec l’admin de la ligue.'],
  NO_SEASON: ['Pas de saison en cours', 'Reviens quand la saison est créée.'],
  NOT_A_MEMBER: ['Ligue inconnue', 'Tu ne fais pas partie de cette ligue.'],
  FORBIDDEN: ['Action réservée', 'Tu n’as pas les droits pour faire ça.'],
  QUESTION_NOT_OPENED: ['Question en brouillon', 'Ouvre-la avant de publier un résultat.'],
  QUESTION_CANCELLED: ['Question annulée', 'Une question annulée n’attribue aucun point.'],
  QUESTION_STILL_OPEN: ['Question encore ouverte', 'Attends la clôture pour publier le résultat.'],
  QUESTION_FROZEN: ['Barème figé', 'Après l’ouverture, seule l’annulation reste possible.'],
  RESULT_REQUIRED: ['Résultat manquant', 'Sélectionne au moins une bonne réponse.'],
  REASON_REQUIRED: ['Motif obligatoire', 'Indique pourquoi la question est annulée.'],
  CRITERIA_REQUIRED: ['Règle de validation manquante', 'Chaque question doit avoir un critère objectif avant ouverture.'],
  OPTIONS_REQUIRED: ['Réponses manquantes', 'Ajoute au moins deux réponses possibles.'],
  CLOSES_IN_PAST: ['Clôture dans le passé', 'Choisis une date de clôture à venir.'],
  BAD_STATUS: ['Action impossible', 'Le statut de la question ne le permet pas.'],
  RESULTS_PENDING: ['Résultats en attente', 'Publie ou annule toutes les questions du prime avant de clôturer la semaine.'],
  PRIME_NOT_FOUND: ['Prime introuvable', ''],
  SEASON_NOT_FOUND: ['Saison introuvable', 'Crée d’abord la saison.'],
  CANDIDATE_NOT_FOUND: ['Candidat introuvable', ''],
};

export function errorCode(e: unknown): string | null {
  const msg = (e as { message?: string })?.message ?? '';
  const m = msg.match(/[A-Z][A-Z_]{3,}/);
  return m && MESSAGES[m[0]] ? m[0] : null;
}

export function explainError(e: unknown): { title: string; message: string } {
  const code = errorCode(e);
  if (code) return { title: MESSAGES[code][0], message: MESSAGES[code][1] };
  const msg = (e as { message?: string })?.message ?? '';
  if (/duplicate key.*pseudo|profiles_pseudo/i.test(msg)) return { title: 'Pseudo déjà pris', message: 'Choisis-en un autre.' };
  if (/fetch|network|Failed to fetch/i.test(msg)) return { title: 'Connexion perdue', message: 'Rien n’a été enregistré. On réessaie ?' };
  return { title: 'Oups', message: 'Ça n’a pas marché. On réessaie dans un instant.' };
}
