'use client';

import type { ReactNode } from 'react';
import { LoadingLink } from './LoadingLink';

export function MatchDetailLink({
  matchId,
  className,
  children,
}: {
  matchId: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <LoadingLink href={`/gironi/${matchId}`} className={className}>
      {children}
    </LoadingLink>
  );
}
