import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Torneo Andrea Papaleo 2026',
  description: 'Torneo di Calcio a 5 Andrea Papaleo — 2ª Edizione | Polisportiva Ardor Bollate',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
