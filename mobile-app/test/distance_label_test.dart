import 'package:flutter_test/flutter_test.dart';

import 'package:tanklotse/shared/widgets/distance_label.dart';

void main() {
  group('DistanceLabel — Audit §13 Aufgabe 4', () {
    test('precise + route_via_station → "exakter Zusatzumweg"', () {
      const l = DistanceLabel(isPrecise: true, isRouteContext: true);
      expect(l.shortSuffix, contains('exakter Zusatzumweg'));
      expect(l.longLabel, contains('exakt berechneten Zusatzumweg'));
    });

    test('precise + point_to_station → "exakte Strecke" (kein Umweg!)', () {
      const l = DistanceLabel(isPrecise: true, isRouteContext: false);
      expect(l.shortSuffix, contains('exakte Strecke'));
      expect(l.shortSuffix, isNot(contains('Umweg')));
      expect(l.longLabel, contains('Fahrstrecke vom Startpunkt zur Tankstelle'));
      expect(l.longLabel, contains('kein vollständiger Umweg'));
    });

    test('estimated + route_via_station → "geschätzter Zusatzumweg"', () {
      const l = DistanceLabel(isPrecise: false, isRouteContext: true);
      expect(l.shortSuffix, contains('geschätzter Zusatzumweg'));
      expect(l.longLabel, contains('geschätzten Distanz entlang der Route'));
    });

    test('estimated + point_to_station → "geschätzte Fahrstrecke"', () {
      const l = DistanceLabel(isPrecise: false, isRouteContext: false);
      expect(l.shortSuffix, contains('geschätzte Fahrstrecke'));
      expect(l.longLabel, contains('Straßen-Fahrstrecke'));
    });
  });
}
