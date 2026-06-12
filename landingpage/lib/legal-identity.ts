// =============================================================================
// BETREIBER-IDENTITÄT — bestätigt aus Handelsregisterauszug (HRB 78219).
// =============================================================================
// Diese Datei ist die EINZIGE Stelle der Website, an der die Anbieter-
// Identität steht. Impressum + Datenschutzerklärung lesen von hier.
//
// Mobile-App: gleiche Angaben in
//   mobile-app/lib/core/legal/legal_identity.dart
// =============================================================================

export const legalIdentity = {
  /** Firmierung bzw. voller Name des Betreibers. */
  companyName: 'TradeRiver GmbH',
  /** Ladungsfähige Anschrift — Straße + Hausnummer. */
  street: 'Kölner Straße 1',
  /** PLZ + Ort. */
  zipCity: '51379 Leverkusen',
  country: 'Deutschland',
  /** Erreichbarkeit. */
  email: 'info@ahrens-re.de',
  phone: '',
  /** Vertretungsberechtigte natürliche Person (laut Handelsregister). */
  representative: 'Jonathan Ahrens',
  representativeRole: 'Geschäftsführer',
  /** Registergericht + Registernummer — § 5 Abs. 1 Nr. 4 DDG Pflichtangabe. */
  registerInfo: 'Amtsgericht Köln, HRB 78219',
} as const;

/** Einzeiler "Name, Straße, PLZ Ort" für Fließtext (Datenschutz, § 18 MStV). */
export const legalIdentityLine = `${legalIdentity.companyName}, ${legalIdentity.street}, ${legalIdentity.zipCity}`;
