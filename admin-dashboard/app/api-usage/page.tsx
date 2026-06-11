'use client';

import useSWR from 'swr';
import { Badge, Card, ErrorState, SkeletonRow } from '@tanklotse/ui';
import { swrFetcher } from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';

interface ApiRow {
  id: string;
  provider: string;
  endpoint: string;
  statusCode: number;
  ok: boolean;
  durationMs: number;
  createdAt: string;
}

function statusVariant(code: number): 'success' | 'warning' | 'error' | 'neutral' {
  if (code >= 500) return 'error';
  if (code >= 400) return 'warning';
  if (code >= 200 && code < 300) return 'success';
  return 'neutral';
}

const cols: ColumnDef<ApiRow>[] = [
  { header: 'Provider', accessorKey: 'provider' },
  { header: 'Endpoint', accessorKey: 'endpoint' },
  {
    header: 'Status',
    accessorKey: 'statusCode',
    cell: (c) => {
      const code = c.getValue<number>();
      return <Badge variant={statusVariant(code)}>{code}</Badge>;
    },
  },
  {
    header: 'OK',
    accessorKey: 'ok',
    cell: (c) =>
      c.getValue<boolean>() ? (
        <Badge variant="success" aria-label="erfolgreich">
          ✓
        </Badge>
      ) : (
        <Badge variant="error" aria-label="fehlgeschlagen">
          ✗
        </Badge>
      ),
  },
  { header: 'Dauer', accessorKey: 'durationMs', cell: (c) => `${c.getValue<number>()} ms` },
  { header: 'Wann', accessorKey: 'createdAt', cell: (c) => new Date(c.getValue<string>()).toLocaleString('de-DE') },
];

export default function ApiUsagePage() {
  const { data, error, mutate } = useSWR<ApiRow[]>('/admin/api-usage?take=200', swrFetcher);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">API-Nutzung</h1>
      {error ? (
        <ErrorState
          message={`Fehler beim Laden der API-Nutzung: ${error.message}`}
          onRetry={() => mutate()}
        />
      ) : data ? (
        <DataTable data={data} columns={cols} />
      ) : (
        <Card aria-busy="true">
          <SkeletonRow cols={6} />
          <SkeletonRow cols={6} />
          <SkeletonRow cols={6} />
        </Card>
      )}
    </div>
  );
}
