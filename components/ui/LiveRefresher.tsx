'use client';

import { useEffect, useState, useTransition } from 'react';
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      startTransition(() => {
        setIsRefreshing(true);
        router.refresh();
        window.setTimeout(() => setIsRefreshing(false), 800);
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs, router]);

  if (!isRefreshing) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-[var(--card)] border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] shadow-lg pointer-events-none">
      <span className="w-3 h-3 rounded-full border-2 border-current/30 border-t-current animate-spin" />
      Aggiornamento…
    </div>
  );
}
