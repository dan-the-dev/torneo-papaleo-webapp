import { LoginForm } from './LoginForm';
import { Logo } from '@/components/ui/Logo';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect('/admin');

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Logo className="h-14 w-auto" />
          </div>
          <h1 className="text-xl font-bold text-white">Area amministrativa</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Torneo Andrea Papaleo 2026</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
