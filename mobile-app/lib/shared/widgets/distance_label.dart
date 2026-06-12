/// Audit 2026-05-06 §13 Aufgabe 4 / §17 Phase 2:
///
/// Wahrheits-getreuer Label-Text fuer eine Distanz-Aussage. Mobile-UI darf
/// nicht „exakter Umweg" anzeigen, wenn das Backend nur die Strecke zur
/// Tankstelle berechnet hat (`point_to_station`) — das ist eine echte
/// Strecke, aber kein Umweg.
///
/// Mapping (precise_routing × routingMode):
///   precise + point_to_station    → "Exakte Strecke zur Tankstelle"
///   precise + route_via_station   → "Exakter Zusatzumweg"
///   estimated + point_to_station  → "Geschaetzte Entfernung"
///   estimated + route_via_station → "Geschaetzter Zusatzumweg"
class DistanceLabel {
  /// `true` wenn `distanceEstimateMode === 'precise_routing'`.
  final bool isPrecise;

  /// `true` wenn `routingMode === 'route_via_station'` (Saved-Route-Flow).
  /// `false` bei `point_to_station` (lokale Suche).
  final bool isRouteContext;

  const DistanceLabel({
    required this.isPrecise,
    required this.isRouteContext,
  });

  /// Kurz-Suffix fuer Pills (z.B. „(exakter Zusatzumweg)").
  String get shortSuffix {
    if (isPrecise && isRouteContext) return ' (exakter Zusatzumweg)';
    if (isPrecise && !isRouteContext) return ' (exakte Strecke)';
    if (isRouteContext) return ' (geschätzter Zusatzumweg)';
    return ' (geschätzte Fahrstrecke)';
  }

  /// Voll-Satz fuer Footnotes / Verdict-Texte.
  String get longLabel {
    if (isPrecise && isRouteContext) {
      return 'Werte basieren auf einem exakt berechneten Zusatzumweg auf der Route.';
    }
    if (isPrecise && !isRouteContext) {
      return 'Werte basieren auf der exakten Fahrstrecke vom Startpunkt zur Tankstelle '
          '(ohne Reiseziel — kein vollständiger Umweg).';
    }
    if (isRouteContext) {
      return 'Werte basieren auf einer geschätzten Distanz entlang der Route — '
          'der reale Fahrweg kann abweichen.';
    }
    return 'Entfernung geschätzt: Luftlinie hochgerechnet auf eine typische '
        'Straßen-Fahrstrecke (×1,3). Der echte Fahrweg kann abweichen.';
  }
}
