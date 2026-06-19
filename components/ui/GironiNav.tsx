'use client';

import { BackToTop } from './BackToTop';

export function GironiNav({ groups }: { groups: string[] }) {
  return (
    <>
      {/* ─── Table of contents ─────────────────────────────────── */}
      <div className="md:hidden flex gap-2 mb-6 overflow-x-auto pb-0.5">
        {groups.map((g) => (
          <a
            key={g}
            href={`#girone-${g}`}
            className="flex-shrink-0 px-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-sm font-semibold text-[var(--foreground)] hover:border-[#e87425]/60 active:bg-[#e87425]/10 transition-colors"
          >
            Girone {g}
          </a>
        ))}
      </div>
      <BackToTop />
    </>
  );
}
