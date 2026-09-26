import { describe, expect, it } from 'vitest';
import { fmtDayTime, fmtLong, fmtNum, fromParisInput, toParisInput } from './format';

describe('dates à l’heure de Paris', () => {
  it('formate en français', () => {
    expect(fmtDayTime('2026-10-17T19:10:00Z')).toBe('sam. 21h10');
    expect(fmtLong('2026-10-17T19:10:00Z')).toBe('Sam. 17 oct. · 21h10');
  });
  it('convertit les saisies datetime-local de Paris, heure d’été comme d’hiver', () => {
    expect(fromParisInput('2026-10-17T21:10')).toBe('2026-10-17T19:10:00.000Z');
    expect(fromParisInput('2026-12-19T21:10')).toBe('2026-12-19T20:10:00.000Z');
    expect(toParisInput('2026-12-19T20:10:00Z')).toBe('2026-12-19T21:10');
  });
  it('sépare les milliers à la française', () => {
    expect(fmtNum(1184).replace(/\s/g, ' ')).toBe('1 184');
  });
});
