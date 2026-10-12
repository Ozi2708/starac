/** Normalise un nom pour la comparaison : sans accents, minuscules, mots séparés par une espace. */
export const normName = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]+/g, ' ').trim();

/**
 * Retrouve l'élève correspondant à un nom de fichier photo : nom exact (« Noémie.webp »), sinon un seul prénom
 * reconnu dans le nom (« vignette-portrait-noemie-e719fb-0@1x.webp », « lee-loo » pour Leeloo). Ambigu ou inconnu → undefined.
 */
export function matchCandidate<T extends { first_name: string; last_name?: string | null }>(fileName: string, cands: T[]): T | undefined {
  const base = normName(fileName.replace(/\.[a-z0-9]{2,5}$/i, ''));
  const full = (c: T) => normName(c.last_name ? `${c.first_name} ${c.last_name}` : c.first_name);
  const exact = cands.filter((c) => normName(c.first_name) === base || full(c) === base);
  if (exact.length === 1) return exact[0];
  const words = base.split(' ').filter(Boolean);
  // mots seuls + paires de mots collées (« lee loo » → « leeloo »)
  const grams = new Set([...words, ...words.slice(1).map((w, i) => words[i] + w)]);
  const hits = cands.filter((c) => grams.has(normName(c.first_name).replace(/ /g, '')) || (!!c.last_name && base.includes(full(c))));
  return hits.length === 1 ? hits[0] : undefined;
}
