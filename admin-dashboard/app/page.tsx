'use client';

import useSWR from 'swr';
import { Card, ErrorState, Skeleton } from '@tanklotse/ui';
import { swrFetcher } from '@/lib/api';

interface Metrics {
  users: number;
  activeAlerts: number;
  todaysApiCalls: number;
  openComplaints: number;
  premiumActive: number;
}

export default function Dashboard() {
  const { data, error, mutate } = useSWR<Metrics>('/admin/metrics', swrFetcher);

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Übersicht</h1>
        <div className="mt-6">
          <ErrorState
            message={`Fehler beim Laden der Metriken: ${error.message}`}
            onRetry={() => mutate()}
          />
        </div>
      </div>
    );
  }

  const cards: Array<[string, number | null]> = [
    ['Aktive Nutzer', data?.users ?? null],
    ['Aktive Preisalarme', data?.activeAlerts ?? null],
    ['API-Calls (24 h)', data?.todaysApiCalls ?? null],
    ['Offene Beschwerden', data?.openComplaints ?? null],
    ['Aktive Premium-Abos', data?.premiumActive ?? null],
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Übersicht</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-3" aria-busy={!data || undefined}>
        {cards.map(([label, value]) => (
          <Card key={label}>
            <div className="text-sm text-slate-500">{label}</div>
            {value === null ? (
              <Skeleton height="2.25rem" width="6rem" className="mt-1" />
            ) : (
              <div className="text-3xl font-bold">{value}</div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
