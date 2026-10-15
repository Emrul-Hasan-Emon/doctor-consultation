import { Suspense, type ReactNode } from 'react';
import { AdminShell } from '@/components/layout/admin-shell';
import { Spinner } from '@/components/ui/spinner';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<Spinner />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
