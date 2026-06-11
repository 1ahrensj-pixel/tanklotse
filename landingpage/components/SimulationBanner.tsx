/**
 * PR #15 Befund 8 — Sichtbarer Mock-/Contract-Modus-Hinweis auf der Landingpage.
 *
 * Wird angezeigt, wenn `NEXT_PUBLIC_APP_ENV=staging-preview`. Verhindert,
 * dass Besucher die Demo mit einem Live-System verwechseln.
 */
export function SimulationBanner() {
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV ?? '';
  if (appEnv !== 'staging-preview') return null;

  return (
    <div
      role="alert"
      style={{
        backgroundColor: '#fff7ed',
        borderBottom: '2px solid #f97316',
        color: '#7c2d12',
        padding: '10px 16px',
        textAlign: 'center',
        fontSize: '14px',
      }}
    >
      <strong>Demo-Preview:</strong>{' '}
      Diese Seite zeigt eine Vorschau mit Beispieldaten. Echte Live-Tankpreise
      werden erst nach Anbieter-Freischaltung angezeigt.
    </div>
  );
}
