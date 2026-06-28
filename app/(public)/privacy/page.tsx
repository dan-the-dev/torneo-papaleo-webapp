import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy — Torneo Andrea Papaleo',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Privacy</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Informativa sintetica sul trattamento dei dati per questo sito.
        </p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl px-5 py-4 text-sm text-[var(--muted)] leading-relaxed space-y-4">
        <p>
          Questo sito raccoglie in modo <strong className="text-[var(--foreground)]">anonimo</strong> quante
          persone lo visitano e quali pagine vengono consultate, tramite Vercel Web Analytics. Non usiamo
          cookie di profilazione e non raccogliamo dati personali identificabili con questo strumento.
        </p>
        <p>
          I dati servono solo a capire l&apos;interesse verso il torneo e a migliorare il sito. Non vengono
          venduti né condivisi con terze parti per finalità commerciali.
        </p>
        <p>
          Per domande puoi contattare la Polisportiva Ardor Bollate, organizzatrice del torneo.
        </p>
      </div>
    </div>
  );
}
