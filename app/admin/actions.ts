'use server';

import { logout } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function logoutAction(): Promise<never> {
  await logout();
  redirect('/login');
}
