/**
 * PR #15 Befund 8 — Sichtbarer Mock-/Contract-Modus-Hinweis im Admin.
 *
 * Wird angezeigt, wenn `NEXT_PUBLIC_APP_ENV=staging-preview` oder explizit
 * `NEXT_PUBLIC_PROVIDER_SIMULATION_ACTIVE=true`. Damit ein nicht-technischer
 * Tester innerhalb von 2 Minuten versteht, dass die Preise Mock-Daten sind.
 */
export function SimulationBanner() {
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV ?? '';
  const explicit =
    (process.env.NEXT_PUBLIC_PROVIDER_SIMULATION_ACTIVE ?? '').toLowerCase() === 'true';
  const showBanner = explicit || appEnv === 'staging-preview';

  if (!showBanner) return null;

  return (
    <div
      role="alert"
      style={{
        backgroundColor: '#fff7ed',
        borderBottom: '2px solid #f97316',
        color: '#7c2d12',
        padding: '12px 24px',
        fontSize: '14px',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <strong style={{ fontSize: '16px' }}>Demo-Modus</strong>
      <span>
        Es werden Mock-Daten verwendet. Keine echten Tankstellenpreise, keine echten
        Routenberechnungen. Live-Tests sind noch nicht erfolgt — siehe{' '}
        <a
          href="https://github.com/1ahrensj-pixel/tankengpt/blob/main/docs/65-truth-status-reconciliation.md"
          target="_blank"
          rel="noreferrer"
          style={{ textDecoration: 'underline', color: '#7c2d12' }}
        >
          docs/65
        </a>
        .
      </span>
    </div>
  );
}
