'use client';

import useSWR from 'swr';
import { Badge, Card, ErrorState, SkeletonRow } from '@tanklotse/ui';
import { swrFetcher } from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';

interface ErrRow {
  id: string;
  provider: string;
  endpoint: string;
  statusCode: number;
  errorMessage: string | null;
  createdAt: string;
}

const cols: ColumnDef<ErrRow>[] = [
  { header: 'Provider', accessorKey: 'provider' },
  { header: 'Endpoint', accessorKey: 'endpoint' },
  {
    header: 'Status',
    accessorKey: 'statusCode',
    cell: (c) => <Badge variant="error">{c.getValue<number>()}</Badge>,
  },
  { header: 'Fehler', accessorKey: 'errorMessage' },
  { header: 'Wann', accessorKey: 'createdAt', cell: (c) => new Date(c.getValue<string>()).toLocaleString('de-DE') },
];

export default function ErrorsPage() {
  const { data, error, mutate } = useSWR<ErrRow[]>('/admin/errors?take=200', swrFetcher);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Fehler</h1>
      {error ? (
        <ErrorState
          message={`Fehler beim Laden des Fehlerprotokolls: ${error.message}`}
          onRetry={() => mutate()}
        />
      ) : data ? (
        <DataTable data={data} columns={cols} />
      ) : (
        <Card aria-busy="true">
          <SkeletonRow cols={5} />
          <SkeletonRow cols={5} />
          <SkeletonRow cols={5} />
        </Card>
      )}
    </div>
  );
}
