'use client';

import { useActionState } from 'react';
import { loginAction } from './actions';
import { LoadingButton } from '@/components/ui/LoadingButton';

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--muted)] mb-1.5">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[var(--muted)] focus:outline-none focus:border-[#e87425] transition-colors"
            placeholder="email@esempio.it"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[var(--muted)] mb-1.5">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[var(--muted)] focus:outline-none focus:border-[#e87425] transition-colors"
            placeholder="••••••••"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            {state.error}
          </p>
        )}

        <LoadingButton
          type="submit"
          loading={pending}
          loadingText="Accesso in corso..."
          className="w-full bg-[#e87425] hover:bg-[#c55f0a] text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
        >
          Accedi
        </LoadingButton>
      </div>
    </form>
  );
}
