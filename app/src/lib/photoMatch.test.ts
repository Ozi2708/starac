import { describe, expect, it } from 'vitest';
import { matchCandidate } from './photoMatch';

// Les 17 élèves de la saison 2026 et les noms des vignettes officielles
const CANDS = ['Amel', 'Antoine', 'Brieuc', 'Cameron', 'Elija', 'Félix', 'Isabella', 'Khalil', 'Kylian', 'Leeloo', 'Maud', 'Mélina', 'Morgan', 'Noémie', 'Tracy', 'Ydriss', 'Zoé'].map((first_name) => ({ first_name, last_name: null }));
const FILES: [string, string][] = [
  ['vignette-portrait-zoe-2b1b50-af6d80-0@1x.webp', 'Zoé'],
  ['vignette-portrait-ydriss-15d154-2715da-0@1x.webp', 'Ydriss'],
  ['vignette-portrait-tracy-cda32e-233b1f-0@1x.webp', 'Tracy'],
  ['vignette-portrait-noemie-e719fb-fa815c-0@1x.webp', 'Noémie'],
  ['vignette-portrait-morgan-ad7087-f61d3d-0@1x.webp', 'Morgan'],
  ['vignette-portrait-melina-b6deb1-88611a-0@1x.webp', 'Mélina'],
  ['vignette-portrait-maud-ecee91-433c4f-0@1x.webp', 'Maud'],
  ['vignette-portrait-lee-loo-4f3695-f2d5b5-0@1x.webp', 'Leeloo'],
  ['vignette-portrait-kylian-57568a-80e00f-0@1x.webp', 'Kylian'],
  ['vignette-portrait-khalil-fbdd63-2a7cc8-0@1x.webp', 'Khalil'],
  ['vignette-portrait-isabella-b22e90-fc9d63-0@1x.webp', 'Isabella'],
  ['vignette-portrait-felix-51a351-1e392a-0@1x.webp', 'Félix'],
  ['vignette-portrait-elija-b4cce0-ca5fbc-0@1x.webp', 'Elija'],
  ['vignette-portrait-cameron-78c4e4-4e50a6-0@1x.webp', 'Cameron'],
  ['vignette-portrait-brieuc-6d05b5-c0189a-0@1x.webp', 'Brieuc'],
  ['vignette-portrait-antoine-eca668-ef3122-0@1x.webp', 'Antoine'],
  ['vignette-portrait-amel-1c03f9-538b64-0@1x.webp', 'Amel'],
];

describe('import des photos : nom de fichier → élève', () => {
  it.each(FILES)('%s → %s', (file, name) => {
    expect(matchCandidate(file, CANDS)?.first_name).toBe(name);
  });
  it('les 17 vignettes donnent 17 élèves différents', () => {
    expect(new Set(FILES.map(([f]) => matchCandidate(f, CANDS)?.first_name)).size).toBe(17);
  });
  it('noms simples, accents, majuscules, sans extension', () => {
    expect(matchCandidate('Noémie.webp', CANDS)?.first_name).toBe('Noémie');
    expect(matchCandidate('FELIX.JPG', CANDS)?.first_name).toBe('Félix');
    expect(matchCandidate('Mélina.png', CANDS)?.first_name).toBe('Mélina');
    expect(matchCandidate('vignette-portrait-zoe-2b1b50-af6d80-0@1x', CANDS)?.first_name).toBe('Zoé');
  });
  it('inconnu ou ambigu → aucun rattachement', () => {
    expect(matchCandidate('IMG_0042.jpg', CANDS)).toBeUndefined();
    expect(matchCandidate('amel-et-maud.jpg', CANDS)).toBeUndefined();
  });
});
