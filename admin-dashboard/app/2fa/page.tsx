'use client';

import { useState } from 'react';
import { Alert, Button, Card, Input } from '@tanklotse/ui';
import { api } from '@/lib/api';

export default function TwoFactor() {
  const [setup, setSetup] = useState<{ qrDataUrl: string } | null>(null);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startBusy, setStartBusy] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);

  async function start() {
    setError(null);
    setMsg(null);
    setStartBusy(true);
    try {
      const res = await api<{ qrDataUrl: string }>('/admin/2fa/setup', { method: 'POST' });
      setSetup(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler.');
    } finally {
      setStartBusy(false);
    }
  }

  async function confirm() {
    setError(null);
    setMsg(null);
    setConfirmBusy(true);
    try {
      await api('/admin/2fa/confirm', { method: 'POST', body: JSON.stringify({ token: code }) });
      setMsg('2FA aktiviert.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler.');
    } finally {
      setConfirmBusy(false);
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-4">2-Faktor-Authentifizierung</h1>
      <Card>
        {!setup ? (
          <Button onClick={start} loading={startBusy} aria-label="2FA einrichten">
            2FA einrichten
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm">Scanne den QR-Code mit deiner Authenticator-App.</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={setup.qrDataUrl} alt="2FA QR-Code" className="bg-white p-2 rounded" />
            <Input
              label="6-stelliger Code"
              value={code}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
              aria-label="2FA-Code"
            />
            <Button onClick={confirm} loading={confirmBusy} aria-label="2FA bestätigen">
              Bestätigen
            </Button>
          </div>
        )}
        {msg && (
          <div className="mt-3">
            <Alert variant="success">{msg}</Alert>
          </div>
        )}
        {error && (
          <div className="mt-3">
            <Alert variant="error">{error}</Alert>
          </div>
        )}
      </Card>
    </div>
  );
}
