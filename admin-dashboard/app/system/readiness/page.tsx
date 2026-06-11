'use client';

import { useEffect, useState } from 'react';

/**
 * PR #15 Befund 8 + Detail 5.5 — Provider-Readiness-Seite.
 *
 * Zeigt fuer jeden Adapter (fuel/routing/geocoder/push/auth/payment) den
 * Modus, Status, configured/runnable/liveVerified-Flags + missingKeys.
 * Quelle: `GET /api/admin/system/api-readiness` (NestJS-Route, JWT-geschuetzt).
 *
 * Sicherheits-Garantie: das Backend liefert NUR Variablen-Namen, keine
 * Secret-Werte (sentinel-tested in `api-readiness.service.spec.ts`).
 */
type ProviderReadiness = {
  service: string;
  provider: string;
  mode: 'live' | 'sandbox' | 'mock' | 'contract' | 'disabled';
  status: string;
  configured: boolean;
  runnable: boolean;
  liveVerified: boolean;
  lastLiveStatus: 'not_checked' | 'success' | 'failed' | 'skipped';
  liveSmokeRunnable: boolean;
  missingKeys: string[];
  notes: string[];
  howToConfigure?: string[];
};

type ApiReadinessSnapshot = {
  providerSimulation: {
    fuel: ProviderReadiness;
    routing: ProviderReadiness;
    geocoder: ProviderReadiness;
    push: ProviderReadiness;
    auth: ProviderReadiness;
    payment: ProviderReadiness;
    allowMockInProduction: boolean;
    anyMockActive: boolean;
    anyContractActive: boolean;
    hasLiveVerifiedProviders: boolean;
    hasOnlyMockOrContractProviders: boolean;
    providers: ProviderReadiness[];
  };
};

function statusColor(status: string, liveVerified: boolean, mode: string): string {
  if (liveVerified) return '#16a34a'; // gruen
  if (status === 'live_ready' || status === 'sandbox_ready') return '#eab308'; // gelb (configured but not liveVerified)
  if (status === 'mock_ready' || status === 'contract_ready') return '#f97316'; // orange
  if (status === 'mock_in_production') return '#dc2626'; // rot (Sonderwarn)
  if (status === 'missing_config' || status === 'invalid_config' || status === 'failed') {
    return '#dc2626';
  }
  if (status === 'disabled') return '#94a3b8'; // grau
  return '#64748b';
}

export default function ProviderReadinessPage() {
  const [snapshot, setSnapshot] = useState<ApiReadinessSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('tk_admin_token') : null;
    fetch(`${apiUrl}/api/admin/system/api-readiness`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setSnapshot(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Lade …</p>;
  if (error) return <p style={{ color: '#dc2626' }}>Fehler: {error}</p>;
  if (!snapshot) return <p>Keine Daten.</p>;

  const sim = snapshot.providerSimulation;
  const providers = sim.providers ?? [
    sim.fuel, sim.routing, sim.geocoder, sim.push, sim.auth, sim.payment,
  ];

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>
        Provider-Readiness
      </h1>
      <p style={{ color: '#475569', marginBottom: '12px' }}>
        Wahrheits-Garantie: <code>mock_ready ≠ live_ready</code>,{' '}
        <code>contract_ready ≠ live_verified</code>. Diese Tabelle zeigt nur Variablen-
        Namen, niemals Secret-Werte.
      </p>

      <div
        style={{
          marginBottom: '16px',
          padding: '12px',
          borderRadius: '6px',
          background: sim.hasLiveVerifiedProviders ? '#dcfce7' : '#fef3c7',
          border: '1px solid #94a3b8',
        }}
      >
        <strong>System-Status:</strong>{' '}
        {sim.hasOnlyMockOrContractProviders
          ? 'Demo-Modus (alle aktiven Adapter sind Mock/Contract).'
          : sim.hasLiveVerifiedProviders
            ? 'Mind. ein Adapter ist live verifiziert.'
            : 'Konfiguration vorhanden, aber kein Live-Smoke persistiert.'}
        {' · anyMockActive=' + String(sim.anyMockActive)}
        {' · anyContractActive=' + String(sim.anyContractActive)}
        {' · allowMockInProduction=' + String(sim.allowMockInProduction)}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
            <th style={{ padding: '8px', borderBottom: '1px solid #cbd5e1' }}>Service</th>
            <th style={{ padding: '8px', borderBottom: '1px solid #cbd5e1' }}>Provider</th>
            <th style={{ padding: '8px', borderBottom: '1px solid #cbd5e1' }}>Mode</th>
            <th style={{ padding: '8px', borderBottom: '1px solid #cbd5e1' }}>Status</th>
            <th style={{ padding: '8px', borderBottom: '1px solid #cbd5e1' }}>Live verifiziert</th>
            <th style={{ padding: '8px', borderBottom: '1px solid #cbd5e1' }}>Fehlende Variablen</th>
            <th style={{ padding: '8px', borderBottom: '1px solid #cbd5e1' }}>Letzter Smoke</th>
          </tr>
        </thead>
        <tbody>
          {providers.map((p) => (
            <tr key={p.service} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '8px', fontWeight: 600 }}>{p.service}</td>
              <td style={{ padding: '8px' }}>{p.provider}</td>
              <td style={{ padding: '8px' }}>
                <code>{p.mode}</code>
              </td>
              <td style={{ padding: '8px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: statusColor(p.status, p.liveVerified, p.mode),
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {p.status}
                </span>
              </td>
              <td style={{ padding: '8px' }}>
                {p.liveVerified ? '✅ ja' : '⏸ nein'}
              </td>
              <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '12px' }}>
                {p.missingKeys.length > 0 ? p.missingKeys.join(', ') : '—'}
              </td>
              <td style={{ padding: '8px' }}>{p.lastLiveStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ fontSize: '18px', fontWeight: 600, marginTop: '24px' }}>
        Naechste Schritte pro Adapter
      </h2>
      {providers
        .filter((p) => p.howToConfigure && p.howToConfigure.length > 0)
        .map((p) => (
          <div key={p.service} style={{ marginTop: '12px' }}>
            <strong>{p.service}:</strong>
            <ul style={{ marginTop: '4px', marginLeft: '20px' }}>
              {p.howToConfigure!.map((h, idx) => (
                <li key={idx}>{h}</li>
              ))}
            </ul>
          </div>
        ))}

      <p style={{ marginTop: '24px', color: '#64748b', fontSize: '12px' }}>
        Quelle: <code>GET /api/admin/system/api-readiness</code> · Logik: PR #11 / PR #12 /
        PR #15 · Doku: <code>docs/61</code>, <code>docs/63</code>, <code>docs/65</code>.
      </p>
    </div>
  );
}
