// =============================================================================
// BETREIBER-IDENTITÄT — VOR LIVE-LAUNCH AUSFÜLLEN! (Live-Blocker L1)
// =============================================================================
// Einzige Stelle der App mit der Anbieter-Identität; der Impressum-Screen
// liest von hier. Werte sind bewusst erkennbare Platzhalter.
// Website-Pendant: landingpage/lib/legal-identity.ts — beide synchron halten.
// =============================================================================

class LegalIdentity {
  static const companyName = 'TradeRiver GmbH';
  static const street = 'Kölner Str. 1';
  static const zipCity = '51379 Leverkusen';
  static const country = 'Deutschland';
  static const email = '1ahrensj@gmail.com';
  static const phone = '';
  static const representative = 'Leon Schneider';
  static const representativeRole = 'Geschäftsführer';

  static const addressBlock =
      '$companyName\n$street\n$zipCity\n$country';
  static const identityLine = '$companyName, $street, $zipCity';
}
