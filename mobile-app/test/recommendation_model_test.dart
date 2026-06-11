import 'package:flutter_test/flutter_test.dart';

import 'package:tanklotse/core/models/recommendation.dart';

void main() {
  group('Recommendation', () {
    test('parst Backend-Antwort und mapped Verdict korrekt', () {
      final r = Recommendation.fromJson({
        'price': 1.629,
        'distanceKm': 4.8,
        'priceAdvantageEur': 3.0,
        'detourFuelCostEur': 0.63,
        'timeCostEur': 0.0,
        'realSavingsEur': 2.37,
        'verdict': 'lohnt_sich',
        'explanation': 'Test',
        'station': {
          'id': '11111111-1111-1111-1111-111111111111',
          'name': 'JET',
          'brand': 'JET',
          'street': 'A',
          'houseNumber': '1',
          'postCode': '50996',
          'place': 'Köln',
          'lat': 50.93,
          'lng': 6.95,
          'isOpen': true,
          'prices': {'e5': 1.79, 'e10': 1.73, 'diesel': 1.629},
        },
      });

      expect(r.verdict, Verdict.lohnt_sich);
      expect(r.realSavingsEur, closeTo(2.37, 0.001));
      expect(r.station.brand, 'JET');
    });

    test('Verdict.german gibt deutsche Strings zurück', () {
      expect(Verdict.lohnt_sich.german, 'Lohnt sich');
      expect(Verdict.nur_wenn_vorbei.german, 'Nur, wenn du sowieso vorbeifährst');
    });
  });
}
