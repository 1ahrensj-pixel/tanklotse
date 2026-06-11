// =============================================================================
// BETREIBER-IDENTITÄT — VOR LIVE-LAUNCH AUSFÜLLEN! (Live-Blocker L1)
// =============================================================================
// Diese Datei ist die EINZIGE Stelle der Website, an der die Anbieter-
// Identität steht. Impressum + Datenschutzerklärung lesen von hier.
//
// Die aktuellen Werte sind bewusst als Platzhalter erkennbar
// ("Musterstraße", "Max Mustermann"). Ohne echte Angaben drohen ab dem
// ersten Live-Tag Abmahnungen (§ 5 DDG Impressumspflicht).
//
// Mobile-App: gleiche Angaben in
//   mobile-app/lib/core/legal/legal_identity.dart
// =============================================================================

export const legalIdentity = {
  /** Firmierung bzw. voller Name des Betreibers. */
  companyName: 'TradeRiver GmbH',
  /** Ladungsfähige Anschrift — Straße + Hausnummer. */
  street: 'Kölner Str. 1',
  /** PLZ + Ort. */
  zipCity: '51379 Leverkusen',
  country: 'Deutschland',
  /** Erreichbarkeit. */
  email: '1ahrensj@gmail.com',
  phone: '',
  /** Vertretungsberechtigte natürliche Person. */
  representative: 'Leon Schneider',
  representativeRole: 'Geschäftsführer',
  /**
   * TODO VOR LAUNCH PRÜFEN: Registergericht + HRB-Nummer sind fuer eine
   * GmbH Pflichtangaben (§ 5 Abs. 1 Nr. 4 DDG) — bitte ergaenzen!
   */
  registerInfo: '',
} as const;

/** Einzeiler "Name, Straße, PLZ Ort" für Fließtext (Datenschutz, § 18 MStV). */
export const legalIdentityLine = `${legalIdentity.companyName}, ${legalIdentity.street}, ${legalIdentity.zipCity}`;
