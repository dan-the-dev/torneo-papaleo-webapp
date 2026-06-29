import { AdminHeader } from '@/components/admin/AdminHeader';
import { AppProviders } from '@/components/navigation/AppProviders';
import { logoutAction } from './actions';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <div className="admin-dark flex flex-col min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <AdminHeader logoutAction={logoutAction} />
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">{children}</main>
      </div>
    </AppProviders>
  );
}
