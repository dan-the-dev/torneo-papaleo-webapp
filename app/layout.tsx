import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Torneo Andrea Papaleo 2026',
  description: 'Torneo di Calcio a 5 Andrea Papaleo — 2ª Edizione | Polisportiva Ardor Bollate',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className="h-full" suppressHydrationWarning>
      <head>
        {/* Sync theme from localStorage before React hydrates to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='light')document.documentElement.classList.add('light');}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
