import { anonymizeIp } from './ip';

describe('anonymizeIp', () => {
  it('maskiert IPv4-Letztes-Oktett', () => {
    expect(anonymizeIp('192.168.1.42')).toBe('192.168.1.0');
  });

  it('maskiert IPv6 auf /48', () => {
    expect(anonymizeIp('2001:db8:abcd:1234::1')).toBe('2001:db8:abcd::');
  });

  it('liefert "unknown" für leere Strings', () => {
    expect(anonymizeIp('')).toBe('unknown');
  });

  it('liefert "unknown" für unsinnige Werte', () => {
    expect(anonymizeIp('garbage')).toBe('unknown');
  });
});
