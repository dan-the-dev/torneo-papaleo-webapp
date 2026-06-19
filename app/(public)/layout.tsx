import { Sidebar } from '@/components/ui/Sidebar';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      {/* Offset: sidebar width on desktop, mobile header height on mobile */}
      <div className="md:ml-[220px] pt-14 md:pt-0 flex flex-col min-h-screen">
        <main className="flex-1 px-4 py-6">{children}</main>
        <footer className="border-t border-[var(--border)] py-4 text-center text-xs text-[var(--muted)] px-4">
          Polisportiva Ardor Bollate · Torneo Andrea Papaleo 2026
        </footer>
      </div>
    </div>
  );
}
