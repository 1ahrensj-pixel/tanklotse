import { roundCoord } from './cache-keys';

describe('roundCoord', () => {
  it('rundet auf drei Nachkommastellen', () => {
    expect(roundCoord(50.937531)).toBe('50.938');
    expect(roundCoord(6.95001)).toBe('6.950');
  });

  it('liefert für identische gerundete Werte gleiche Schlüssel', () => {
    expect(roundCoord(50.9376)).toBe(roundCoord(50.9379));
  });
});
