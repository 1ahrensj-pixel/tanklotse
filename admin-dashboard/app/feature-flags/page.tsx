'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Alert, Badge, Button, Card, ErrorState, Skeleton } from '@tanklotse/ui';
import { api, swrFetcher } from '@/lib/api';

interface Flag {
  key: string;
  enabled: boolean;
  description: string | null;
}

export default function FlagsPage() {
  const { data, error, mutate } = useSWR<Flag[]>('/admin/feature-flags', swrFetcher);
  const [toggleError, setToggleError] = useState<string | null>(null);

  async function toggle(f: Flag) {
    setToggleError(null);
    try {
      await api('/admin/feature-flags', {
        method: 'POST',
        body: JSON.stringify({ key: f.key, enabled: !f.enabled }),
      });
      mutate();
    } catch (e) {
      // Z. B. 403 fuer SUPPORT/DEVELOPER/READONLY (POST nur ADMIN/SUPERADMIN)
      // oder Netz-/Serverfehler — sichtbar machen statt stumm verschlucken.
      setToggleError(e instanceof Error ? e.message : 'Unbekannter Fehler.');
    }
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Feature-Flags</h1>
        <ErrorState
          message={`Fehler beim Laden der Feature-Flags: ${error.message}`}
          onRetry={() => mutate()}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Feature-Flags</h1>
        <div className="space-y-2" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <Skeleton height="1.25rem" width="40%" />
              <Skeleton height="0.875rem" width="70%" className="mt-2" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Feature-Flags</h1>
      {toggleError && (
        <div className="mb-4">
          <Alert variant="error">{`Fehler beim Umschalten: ${toggleError}`}</Alert>
        </div>
      )}
      <ul className="space-y-2" role="list">
        {data.map((f) => (
          <li key={f.key}>
            <Card>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{f.key}</div>
                  {f.description && <div className="text-sm text-slate-500">{f.description}</div>}
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={f.enabled ? 'success' : 'neutral'}>
                    {f.enabled ? 'Aktiv' : 'Aus'}
                  </Badge>
                  <Button
                    variant={f.enabled ? 'secondary' : 'primary'}
                    onClick={() => toggle(f)}
                    aria-label={`${f.key} ${f.enabled ? 'deaktivieren' : 'aktivieren'}`}
                  >
                    {f.enabled ? 'Deaktivieren' : 'Aktivieren'}
                  </Button>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
