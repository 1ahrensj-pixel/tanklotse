'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (pathname === '/login') {
      setOk(true);
      return;
    }
    const token = window.localStorage.getItem('tk_admin_token');
    if (!token) {
      router.replace('/login');
    } else {
      setOk(true);
    }
  }, [pathname, router]);

  if (!ok) return null;
  return <>{children}</>;
}
