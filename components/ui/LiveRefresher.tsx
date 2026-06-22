'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const DEFAULT_INTERVAL_MS = 30_000;

export function LiveRefresher({
  enabled = true,
  intervalMs = DEFAULT_INTERVAL_MS,
}: {
  enabled?: boolean;
  intervalMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs, router]);

  return null;
}
