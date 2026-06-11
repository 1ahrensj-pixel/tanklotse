'use client';

import useSWR from 'swr';
import { Badge, Card, ErrorState, SkeletonRow } from '@tanklotse/ui';
import { swrFetcher } from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';

interface ComplaintRow {
  id: string;
  complaintType: string;
  status: string;
  correction: string | null;
  station: { name: string; brand: string };
  createdAt: string;
}

function statusVariant(status: string): 'success' | 'warning' | 'error' | 'neutral' {
  const s = status.toLowerCase();
  if (s === 'resolved' || s === 'accepted') return 'success';
  if (s === 'open' || s === 'pending') return 'warning';
  if (s === 'rejected') return 'error';
  return 'neutral';
}

const cols: ColumnDef<ComplaintRow>[] = [
  { header: 'Tankstelle', accessorFn: (r) => `${r.station?.brand} ${r.station?.name}`, id: 'station' },
  { header: 'Typ', accessorKey: 'complaintType' },
  { header: 'Korrektur', accessorKey: 'correction' },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: (c) => {
      const status = c.getValue<string>();
      return <Badge variant={statusVariant(status)}>{status}</Badge>;
    },
  },
  { header: 'Wann', accessorKey: 'createdAt', cell: (c) => new Date(c.getValue<string>()).toLocaleString('de-DE') },
];

export default function ComplaintsPage() {
  const { data, error, mutate } = useSWR<ComplaintRow[]>('/admin/complaints?take=200', swrFetcher);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Beschwerden</h1>
      {error ? (
        <ErrorState
          message={`Fehler beim Laden der Beschwerden: ${error.message}`}
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
