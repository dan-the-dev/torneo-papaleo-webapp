'use client';

import type { ReactNode } from 'react';
import { LoadingLink } from '@/components/navigation/LoadingLink';

export function AdminBackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <LoadingLink href={href} showSpinner className="text-[var(--muted)] hover:text-white transition-colors">
      {children}
    </LoadingLink>
  );
}
