'use server';

import { login } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function loginAction(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const email = formData.get('email');
  const password = formData.get('password');

  if (typeof email !== 'string' || typeof password !== 'string') {
    return { error: 'Dati non validi' };
  }

  const result = await login(email.trim(), password);
  if (!result.success) {
    return { error: result.error ?? 'Errore di accesso' };
  }

  redirect('/admin');
}
