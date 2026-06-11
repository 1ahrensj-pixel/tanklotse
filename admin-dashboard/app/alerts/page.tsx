'use client';

import useSWR from 'swr';
import { Badge, Card, ErrorState, SkeletonRow } from '@tanklotse/ui';
import { swrFetcher } from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';

interface AlertRow {
  id: string;
  fuelType: string;
  maxPrice: string;
  active: boolean;
  createdAt: string;
}

const cols: ColumnDef<AlertRow>[] = [
  { header: 'Sorte', accessorKey: 'fuelType' },
  { header: 'Max. Preis', accessorKey: 'maxPrice', cell: (c) => `${Number(c.getValue<string>()).toFixed(3)} €/L` },
  {
    header: 'Aktiv',
    accessorKey: 'active',
    cell: (c) =>
      c.getValue<boolean>() ? (
        <Badge variant="success">aktiv</Badge>
      ) : (
        <Badge variant="neutral">aus</Badge>
      ),
  },
  { header: 'Angelegt', accessorKey: 'createdAt', cell: (c) => new Date(c.getValue<string>()).toLocaleString('de-DE') },
];

export default function AlertsPage() {
  const { data, error, mutate } = useSWR<AlertRow[]>('/admin/alerts?take=100', swrFetcher);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Preisalarme</h1>
      {error ? (
        <ErrorState
          message={`Fehler beim Laden der Preisalarme: ${error.message}`}
          onRetry={() => mutate()}
        />
      ) : data ? (
        <DataTable data={data} columns={cols} />
      ) : (
        <Card aria-busy="true">
          <SkeletonRow cols={4} />
          <SkeletonRow cols={4} />
          <SkeletonRow cols={4} />
        </Card>
      )}
    </div>
  );
}
