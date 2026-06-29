'use client';

import { useFormStatus } from 'react-dom';
import { Spinner } from '@/components/ui/Spinner';

function LogoutSubmit() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="text-xs text-[var(--muted)] hover:text-white transition-colors disabled:opacity-60 inline-flex items-center gap-1.5"
    >
      {pending ? (
        <>
          <Spinner size="xs" />
          Uscita…
        </>
      ) : (
        'Esci'
      )}
    </button>
  );
}

export function LogoutButton({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action}>
      <LogoutSubmit />
    </form>
  );
}
