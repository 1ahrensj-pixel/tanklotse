/**
 * PR #24 §5.4 — Blog-Skeleton fuer SEO.
 *
 * Einfache Markdown-freie Loesung: Posts sind als Module-Konstanten
 * gehalten. Wer ein echtes Markdown-System (contentlayer / next-mdx-remote)
 * will, kann diese Datei spaeter ersetzen, ohne URLs zu brechen.
 *
 * Vorgegebene Themen aus dem Auftrag §5.4:
 *  - „Wie der Lohnt-sich-Check funktioniert"
 *  - „Spritpreise verstehen"
 *  - „Tankstrategie auf der Autobahn"
 */

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  readingMinutes: number;
  /** Inhalt als Array von Paragraphen (Heading/Body). */
  content: Array<
    | { type: 'h2'; text: string }
    | { type: 'p'; text: string }
    | { type: 'ul'; items: string[] }
  >;
}

export const posts: BlogPost[] = [
  {
    slug: 'lohnt-sich-check',
    title: 'Wie der Lohnt-sich-Check funktioniert',
    description:
      'TankLotse rechnet nicht nur Preise, sondern auch den Umweg. So entsteht eine echte Spar-Empfehlung.',
    publishedAt: '2026-05-11',
    readingMinutes: 4,
    content: [
      {
        type: 'p',
        text: 'Eine billigere Tankstelle ist nicht automatisch die günstigere. Wenn der Umweg zu groß ist, frisst der Mehrverbrauch die Ersparnis auf. TankLotse rechnet das ehrlich nach.',
      },
      { type: 'h2', text: 'Was wir vergleichen' },
      {
        type: 'p',
        text: 'Wir nehmen drei Werte: den Preis pro Liter, deinen Verbrauch und den zusätzlichen Fahrweg zur Tankstelle. Daraus berechnen wir die echte Ersparnis für dein konkretes Auto + Tankgröße.',
      },
      { type: 'h2', text: 'Wann lohnt sich der Umweg?' },
      {
        type: 'ul',
        items: [
          'Wenn der Preisunterschied größer ist als die Mehrkosten durch Mehrfahrt.',
          'Wenn die Tankstelle ohnehin auf der Strecke liegt.',
          'Wenn du eh tanken musst und der Mehraufwand klein ist.',
        ],
      },
      { type: 'h2', text: 'Was wir nicht versprechen' },
      {
        type: 'p',
        text: 'Wir kennen nicht den realen Verkehr. Eine 3 km kurze Strecke kann durch Stau teurer werden als gerechnet. Unser Wert ist ein guter Anhaltspunkt, kein Garantieprodukt.',
      },
    ],
  },
  {
    slug: 'spritpreise-verstehen',
    title: 'Spritpreise verstehen',
    description:
      'Warum schwanken die Preise so stark? Wer profitiert davon? Ein kurzer Einblick in die Mechanik.',
    publishedAt: '2026-05-11',
    readingMinutes: 5,
    content: [
      {
        type: 'p',
        text: 'In Deutschland bewegen sich die Spritpreise mehrmals am Tag. Das ist Absicht: Mineralölkonzerne nutzen dynamisches Pricing, um ihre Marge je nach Tageszeit zu optimieren.',
      },
      { type: 'h2', text: 'Die drei wichtigsten Faktoren' },
      {
        type: 'ul',
        items: [
          'Rohöl- und Großhandelspreise (tägliche Schwankungen, über den ARA-Markt).',
          'Steuern (Energiesteuer + MwSt, in Deutschland besonders hoch).',
          'Lokale Konkurrenz-Lage (eine freie Tankstelle in der Nähe drückt Preise von Marken-Tankstellen).',
        ],
      },
      { type: 'h2', text: 'Wann tanken am günstigsten?' },
      {
        type: 'p',
        text: 'Studien zeigen: zwischen 18:00 und 22:00 Uhr sind die Preise im Schnitt am niedrigsten. Morgens zwischen 06:00 und 08:00 am höchsten. Wer planen kann, spart deutlich.',
      },
      { type: 'h2', text: 'Datenquelle' },
      {
        type: 'p',
        text: 'TankLotse zeigt die Preise der Markttransparenzstelle Kraftstoffe (MTS-K), aktuell über den Tankerkönig-API-Zugang. Die Daten sind öffentlich, lizenziert unter CC BY 4.0.',
      },
    ],
  },
  {
    slug: 'tankstrategie-autobahn',
    title: 'Tankstrategie auf der Autobahn',
    description:
      'Autobahn-Tankstellen sind teuer. Wann lohnt es sich, früher abzufahren?',
    publishedAt: '2026-05-11',
    readingMinutes: 3,
    content: [
      {
        type: 'p',
        text: 'Autobahn-Tankstellen liegen im Durchschnitt 20-30 Cent pro Liter über dem Preis im Ort. Bei 50 Litern sind das 10-15 Euro Aufschlag pro Tankung.',
      },
      { type: 'h2', text: 'Die einfache Faustregel' },
      {
        type: 'p',
        text: 'Wenn die Tankstelle im Ort 2-3 km von der Autobahn-Abfahrt entfernt liegt, lohnt sich der Umweg fast immer. Bei modernem Verbrauch kostet dich der Umweg rund 30-40 Cent — die Tankstelle ist 10 Euro günstiger.',
      },
      { type: 'h2', text: 'Wann doch Autobahn?' },
      {
        type: 'ul',
        items: [
          'Wenn du eine große Strecke ohne Pause fahren willst.',
          'Wenn der Tank fast leer ist und du dir den Umweg nicht leisten kannst.',
          'Wenn du sowieso eine Rast brauchst.',
        ],
      },
      { type: 'h2', text: 'Was TankLotse hier kann' },
      {
        type: 'p',
        text: 'Mit dem Routing-Modus berechnet TankLotse den Umweg für jede Kandidaten-Tankstelle entlang deiner Strecke. Du siehst direkt, ob sich die Ausfahrt lohnt — bevor du sie nimmst.',
      },
    ],
  },
];

export function getPost(slug: string): BlogPost | null {
  return posts.find((p) => p.slug === slug) ?? null;
}
