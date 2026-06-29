import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Regolamento — Torneo Andrea Papaleo',
};

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-3">
        <span className="text-sm font-bold text-[#e87425] tabular-nums">{number}</span>
        <h2 className="font-bold text-[var(--foreground)] text-sm uppercase tracking-wide">{title}</h2>
      </div>
      <div className="px-5 py-4 text-sm text-[var(--muted)] leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="text-[#e87425] flex-shrink-0 mt-0.5">·</span>
      <span>{children}</span>
    </li>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 pl-4">
      <span className="text-[var(--border)] flex-shrink-0 mt-0.5">–</span>
      <span>{children}</span>
    </li>
  );
}

export default function RegolamentoPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1">Regolamento</h1>
        <p className="text-sm text-[var(--muted)]">Torneo di Calcio a 5 Indoor — 2ª Edizione · Andrea Papaleo</p>
      </div>

      <div className="flex flex-col gap-4">

        <Section number="1" title="Partecipanti e requisiti">
          <ul className="space-y-1.5">
            <Li>Atleti regolarmente iscritti tramite modulo ufficiale</Li>
            <Li>Documento di identità obbligatorio</Li>
            <Li>Nati prima del 31/12/2010</Li>
            <Li>Ogni giocatore può partecipare con una sola squadra</Li>
          </ul>
        </Section>

        <Section number="2" title="Iscrizione e quota di partecipazione">
          <p className="font-semibold text-[var(--foreground)]">Quota di iscrizione: 200 € per squadra</p>
          <p className="mt-2 font-medium text-[var(--foreground)]">Come pagare:</p>
          <ul className="space-y-1.5 mt-1">
            <Li>Contanti presso Polisportiva Ardor Bollate</Li>
            <Li>
              Bonifico bancario — IBAN:{' '}
              <span className="font-mono text-[var(--foreground)]">IT74D0844020100000000043134</span>
              <br />
              Causale: Torneo Papaleo – Nome Squadra
            </Li>
          </ul>
          <ul className="space-y-1.5 mt-3">
            <Li>Quota non rimborsabile</Li>
            <Li>Massimo 10 giocatori per squadra — <span className="text-[var(--foreground)]">+20 € per ogni giocatore aggiuntivo</span></Li>
            <Li>Sostituzioni consentite solo per infortunio (necessario certificato medico)</Li>
          </ul>
        </Section>

        <Section number="3" title="Formula del torneo">
          <p className="font-semibold text-[var(--foreground)] mb-2">16 squadre partecipanti</p>

          <p className="font-medium text-[#e87425] mb-1">Fase a gironi</p>
          <ul className="space-y-1.5 mb-4">
            <Li>Girone unico a 16 squadre — 3 partite per squadra</Li>
            <Li>Vittoria: 3 pt · Pareggio: 1 pt · Sconfitta: 0 pt</Li>
            <Li>
              Criteri di classifica (parità di punti):
              <ul className="mt-1.5 space-y-1">
                <Sub>Differenza reti</Sub>
                <Sub>Gol segnati</Sub>
                <Sub>Gol subiti</Sub>
                <Sub>Sorteggio</Sub>
              </ul>
            </Li>
          </ul>

          <p className="font-medium text-[#e87425] mb-1">Fase a eliminazione diretta</p>
          <ul className="space-y-1.5 mb-4">
            <Li>Tutte le 16 squadre sono qualificate</Li>
            <Li>In caso di parità: rigori (3 per squadra, poi ad oltranza)</Li>
          </ul>

          <p className="font-medium text-[var(--foreground)] mb-1">Ottavi di finale</p>
          <ul className="space-y-1 mb-3">
            <Sub>ODF 1: 1° o 2° classificato vs 15° o 16° classificato</Sub>
            <Sub>ODF 2: 1° o 2° classificato vs 15° o 16° classificato</Sub>
            <Sub>ODF 3: 3° o 4° classificato vs 13° o 14° classificato</Sub>
            <Sub>ODF 4: 3° o 4° classificato vs 13° o 14° classificato</Sub>
            <Sub>ODF 5: 5° o 6° classificato vs 11° o 12° classificato</Sub>
            <Sub>ODF 6: 5° o 6° classificato vs 11° o 12° classificato</Sub>
            <Sub>ODF 7: 7° o 8° classificato vs 9° o 10° classificato</Sub>
            <Sub>ODF 8: 7° o 8° classificato vs 9° o 10° classificato</Sub>
          </ul>

          <p className="font-medium text-[var(--foreground)] mb-1">Quarti di finale</p>
          <ul className="space-y-1 mb-3">
            <Sub>QDF 1: vincente ODF 1 vs vincente ODF 8</Sub>
            <Sub>QDF 2: vincente ODF 2 vs vincente ODF 7</Sub>
            <Sub>QDF 3: vincente ODF 3 vs vincente ODF 6</Sub>
            <Sub>QDF 4: vincente ODF 4 vs vincente ODF 5</Sub>
          </ul>

          <p className="font-medium text-[var(--foreground)] mb-1">Semifinali</p>
          <ul className="space-y-1 mb-3">
            <Sub>SF 1: vincente QDF 1 vs vincente QDF 4</Sub>
            <Sub>SF 2: vincente QDF 2 vs vincente QDF 3</Sub>
          </ul>

          <p className="font-medium text-[var(--foreground)] mb-1">Finali</p>
          <ul className="space-y-1">
            <Sub>Finale 3°/4° posto: perdente SF 1 vs perdente SF 2</Sub>
            <Sub>Finale 1°/2° posto: vincente SF 1 vs vincente SF 2</Sub>
          </ul>
        </Section>

        <Section number="4" title="Date e sede">
          <p className="font-medium text-[var(--foreground)] mb-1">Fase a gironi</p>
          <ul className="space-y-1 mb-3">
            <Li>Lunedi 29 giugno 2026</Li>
            <Li>Mercoledi 1° luglio 2026</Li>
            <Li>Venerdi 3 luglio 2026</Li>
            <Li>Lunedi 6 luglio 2026</Li>
          </ul>
          <p className="font-medium text-[var(--foreground)] mb-1">Fase a eliminazione diretta</p>
          <ul className="space-y-1 mb-3">
            <Li>Venerdi 10 luglio 2026 — Ottavi e Quarti di finale</Li>
            <Li>Sabato 11 luglio 2026 — Semifinali e Finali</Li>
          </ul>
          <p className="font-medium text-[var(--foreground)] mb-1">Sede</p>
          <ul className="space-y-1">
            <Li>Palazzetto Polisportiva Ardor Bollate — Via Repubblica 6</Li>
            <Li>L&apos;organizzazione può modificare date e orari con almeno 24h di preavviso</Li>
          </ul>
        </Section>

        <Section number="5" title="Svolgimento delle partite">
          <ul className="space-y-1.5 mb-4">
            <Li>2 tempi da 12 minuti · Intervallo di 3 minuti</Li>
            <Li>Ultimi 2 minuti del secondo tempo a <span className="text-[var(--foreground)]">tempo effettivo</span></Li>
          </ul>

          <p className="font-medium text-[var(--foreground)] mb-1">Regole tecniche</p>
          <ul className="space-y-1.5 mb-4">
            <Li>Solo scarpe da calcetto o futsal (vietate scarpe da calcio a 11)</Li>
            <Li>Scivolate consentite solo senza contatto</Li>
            <Li>Retropassaggio: il portiere non può usare le mani</Li>
            <Li>Il rinvio del portiere non può superare direttamente la metà campo</Li>
            <Li>Regola dei 4 secondi su tutte le riprese</Li>
            <Li>Rimesse e angoli con i piedi (palla ferma sulla linea)</Li>
            <Li>Gol valido anche da dietro la metà campo</Li>
            <Li>Nessun fuorigioco</Li>
            <Li>Barriera a 4 metri sulle punizioni</Li>
            <Li>Pallone che tocca il soffitto: rimessa laterale a centrocampo per la squadra avversaria</Li>
          </ul>

          <p className="font-medium text-[var(--foreground)] mb-1">Sostituzioni</p>
          <ul className="space-y-1.5 mb-4">
            <Li>Sostituzioni illimitate · Solo a gioco fermo</Li>
            <Li>Entrata solo dopo l&apos;uscita del compagno</Li>
          </ul>

          <p className="font-medium text-[var(--foreground)] mb-1">Disciplina</p>
          <ul className="space-y-1.5">
            <Li>
              Doppio giallo o rosso diretto: espulsione per tutta la durata della partita.
              Dopo 2 minuti o dopo aver subito un gol, la squadra in inferiorità può reintegrare un
              giocatore diverso dall&apos;espulso.
            </Li>
            <Li>Espulsione per fallo di gioco: nessuna squalifica automatica nelle giornate successive</Li>
            <Li>Espulsione comportamentale: almeno una giornata di squalifica (l&apos;organizzazione decide l&apos;entità)</Li>
            <Li>
              Abbandono del terreno di gioco: esclusione immediata dal torneo, nessun rimborso della quota
            </Li>
            <Li>Mancata presentazione a una partita: esclusione dal torneo</Li>
          </ul>
        </Section>

        <Section number="6" title="Equipaggiamento">
          <ul className="space-y-1.5">
            <Li>Ogni squadra deve avere maglie dello stesso colore</Li>
            <Li>Il portiere deve indossare una maglia di colore differente</Li>
            <Li>In caso di colori simili o uguali: pettorine fornite dall&apos;organizzazione</Li>
            <Li>Vietato indossare gioielli</Li>
            <Li>Pallone ufficiale fornito dall&apos;organizzazione (misura 4, a rimbalzo controllato)</Li>
          </ul>
        </Section>

        {/* Premi — highlighted section */}
        <div className="bg-[var(--card)] border border-[#e87425]/40 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e87425]/30 flex items-center gap-3 bg-[#e87425]/10">
            <span className="text-sm font-bold text-[#e87425] tabular-nums">7</span>
            <h2 className="font-bold text-[var(--foreground)] text-sm uppercase tracking-wide">Premi</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            {[
              { pos: '1°', prize: '1.000 €' },
              { pos: '2°', prize: '500 €' },
              { pos: '3°', prize: '200 €' },
            ].map(({ pos, prize }) => (
              <div key={pos} className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--muted)]">{pos} classificato</span>
                <span className="text-lg font-bold text-[#e87425]">buono {prize}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--muted)]">Miglior marcatore</span>
              <span className="text-lg font-bold text-[#e87425]">buono 150 €</span>
            </div>
          </div>
        </div>

        <Section number="8" title="Arbitraggio e disposizioni finali">
          <ul className="space-y-1.5">
            <Li>Le decisioni arbitrali sui fatti di gioco sono insindacabili</Li>
            <Li>Comunicazioni ufficiali tramite canali dell&apos;organizzazione (gruppo WhatsApp con i capitani)</Li>
            <Li>Per quanto non previsto, valgono le regole del calcio a 5</Li>
            <Li>L&apos;iscrizione al torneo implica l&apos;accettazione integrale del presente regolamento</Li>
          </ul>
          <p className="mt-4 text-[var(--foreground)] font-medium">Buon torneo a tutti! — L&apos;Organizzazione</p>
        </Section>

      </div>
    </div>
  );
}
