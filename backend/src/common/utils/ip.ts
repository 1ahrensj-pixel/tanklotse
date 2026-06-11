/**
 * IP-Anonymisierung für Logs (DSGVO-Konform).
 * IPv4: letztes Oktett auf 0.
 * IPv6: letzte 80 Bits maskieren (Behält /48-Prefix).
 */
export function anonymizeIp(ip: string): string {
  if (!ip) return 'unknown';
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      parts[3] = '0';
      return parts.join('.');
    }
  }
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return parts.slice(0, 3).join(':') + '::';
  }
  return 'unknown';
}
