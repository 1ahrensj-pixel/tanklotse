import type { Metadata } from 'next';

import { legalIdentity } from '@/lib/legal-identity';

export const metadata: Metadata = {
  title: 'Impressum',
  description: 'Anbieterkennzeichnung gemäß § 5 DDG.',
};

// Betreiber-Identität kommt zentral aus lib/legal-identity.ts —
// vor Live-Launch DORT die echten Werte eintragen (eine Stelle statt drei).
export default function ImprintPage() {
  return (
    <article className="container-tk py-16 max-w-3xl space-y-4">
      <h1 className="text-3xl font-bold">Impressum</h1>
      <p>Anbieterkennzeichnung gemäß § 5 DDG / § 18 MStV.</p>

      <section>
        <h2 className="font-semibold mt-6">Anbieter</h2>
        <p>
          {legalIdentity.companyName}<br />
          {legalIdentity.street}<br />
          {legalIdentity.zipCity}<br />
          {legalIdentity.country}
        </p>
      </section>

      <section>
        <h2 className="font-semibold mt-6">Kontakt</h2>
        <p>
          E-Mail: {legalIdentity.email}
          {legalIdentity.phone ? (
            <>
              <br />
              Telefon: {legalIdentity.phone}
            </>
          ) : null}
        </p>
      </section>

      {legalIdentity.registerInfo ? (
        <section>
          <h2 className="font-semibold mt-6">Registereintrag</h2>
          <p>{legalIdentity.registerInfo}</p>
        </section>
      ) : null}

      <section>
        <h2 className="font-semibold mt-6">Vertretungsberechtigte Person</h2>
        <p>{legalIdentity.representative} ({legalIdentity.representativeRole})</p>
      </section>

      <section>
        <h2 className="font-semibold mt-6">Verantwortlich nach § 18 Abs. 2 MStV</h2>
        <p>{legalIdentity.representative}, {legalIdentity.street}, {legalIdentity.zipCity}</p>
      </section>

      <section>
        <h2 className="font-semibold mt-6">Hinweis</h2>
        <p>
          Die Inhalte dieser Website werden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und
          Aktualität der externen Spritpreisdaten kann jedoch keine Gewähr übernommen werden — Datenquelle siehe Seite
          „Datenquelle &amp; Lizenz“.
        </p>
      </section>
    </article>
  );
}
