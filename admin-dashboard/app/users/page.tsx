'use client';

import useSWR from 'swr';
import { Badge, Card, ErrorState, SkeletonRow } from '@tanklotse/ui';
import { swrFetcher } from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';

interface UserRow {
  id: string;
  email: string | null;
  role: string;
  premiumStatus: string;
  createdAt: string;
}

function premiumVariant(status: string): 'success' | 'warning' | 'neutral' {
  if (status === 'active') return 'success';
  if (status === 'past_due' || status === 'grace') return 'warning';
  return 'neutral';
}

const columns: ColumnDef<UserRow>[] = [
  { header: 'E-Mail', accessorKey: 'email' },
  { header: 'Rolle', accessorKey: 'role' },
  {
    header: 'Premium',
    accessorKey: 'premiumStatus',
    cell: (c) => {
      const status = c.getValue<string>();
      return <Badge variant={premiumVariant(status)}>{status}</Badge>;
    },
  },
  { header: 'Angelegt', accessorKey: 'createdAt', cell: (c) => new Date(c.getValue<string>()).toLocaleString('de-DE') },
];

export default function Users() {
  const { data, error, mutate } = useSWR<UserRow[]>('/admin/users?take=100', swrFetcher);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Nutzer</h1>
      {error ? (
        <ErrorState
          message={`Fehler beim Laden der Nutzer: ${error.message}`}
          onRetry={() => mutate()}
        />
      ) : data ? (
        <DataTable data={data} columns={columns} />
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
