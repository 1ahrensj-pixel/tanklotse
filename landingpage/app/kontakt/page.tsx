import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kontakt',
  description: 'Kontaktiere das TankLotse-Team.',
};

export default function ContactPage() {
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@tanklotse.de';
  return (
    <section className="container-tk py-16 max-w-2xl">
      <h1 className="text-3xl font-bold">Kontakt</h1>
      <p className="mt-3">
        Schreib uns an <a className="underline" href={`mailto:${email}`}>{email}</a>. Wir antworten in der Regel
        innerhalb von zwei Werktagen.
      </p>
      <p className="mt-3 text-sm text-brand-700 dark:text-brand-100">
        Für Datenschutzanfragen nutze bitte denselben Kanal mit dem Stichwort „DSGVO“ in der Betreffzeile.
      </p>
    </section>
  );
}
