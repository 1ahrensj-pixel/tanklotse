'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError, clearToken, setToken } from '@/lib/api';
import { Button, Input } from '@tanklotse/ui';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [need2fa, setNeed2fa] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (!tempToken) {
        // Neuer Kontrakt: bei aktiviertem 2FA liefert das Backend KEINEN
        // vollen Token, sondern { totpRequired: true, preAuthToken }.
        const res = await api<{
          accessToken?: string;
          totpRequired?: boolean;
          preAuthToken?: string;
        }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        if (res.totpRequired && res.preAuthToken) {
          setTempToken(res.preAuthToken);
          setNeed2fa(true);
          return;
        }
        if (res.accessToken) setToken(res.accessToken);
        // Probe: hat das Konto ueberhaupt eine Admin-Rolle?
        try {
          await api('/admin/metrics');
          router.replace('/');
        } catch (probeErr) {
          clearToken();
          if (probeErr instanceof ApiError && probeErr.code === 'TOTP_REQUIRED') {
            // Defensive: Backend verlangt Step-up (sollte schon der
            // Login-Response signalisiert haben).
            setTempToken(res.accessToken ?? null);
            setNeed2fa(true);
          } else if (probeErr instanceof ApiError && probeErr.status === 403) {
            setErr('Dieses Konto hat keine Admin-Berechtigung.');
          } else {
            throw probeErr;
          }
        }
      } else {
        setToken(tempToken);
        const res = await api<{ ok: boolean; accessToken?: string }>('/admin/2fa/verify', {
          method: 'POST',
          body: JSON.stringify({ token: totp }),
        });
        // Verify stellt den vollwertigen Token aus — Pre-Auth-Token ersetzen.
        if (res.accessToken) setToken(res.accessToken);
        router.replace('/');
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Unbekannter Fehler.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={submit}
        aria-label="Admin-Login-Formular"
        className="w-full max-w-sm rounded-xl border bg-white p-6 space-y-4"
      >
        <h1 className="text-xl font-semibold">Admin-Login</h1>
        {!need2fa ? (
          <>
            <Input
              label="E-Mail"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              error={err}
            />
            <Input
              label="Passwort"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            />
          </>
        ) : (
          <Input
            label="2FA-Code"
            type="text"
            required
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            value={totp}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTotp(e.target.value)}
            hint="Sechsstelliger Code aus der Authenticator-App."
            error={err}
          />
        )}
        <Button type="submit" loading={busy} className="w-full">
          {need2fa ? 'Verifizieren' : 'Anmelden'}
        </Button>
      </form>
    </div>
  );
}
