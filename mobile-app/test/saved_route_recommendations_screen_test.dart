import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hive/hive.dart';

import 'package:tanklotse/core/repositories/stations_repository.dart';
import 'package:tanklotse/features/saved_routes/saved_route_recommendations_screen.dart';

/// Fake-Repository: liefert vorbereitete Antworten statt echter HTTP-Calls.
class _FakeSavedRoutesRepository extends SavedRoutesRepository {
  _FakeSavedRoutesRepository(super.ref, this._loader);

  final Future<Map<String, dynamic>> Function() _loader;

  @override
  Future<Map<String, dynamic>> recommendations({
    required String id,
    required double consumptionLPer100Km,
    required double tankLiters,
  }) =>
      _loader();
}

/// Antwort-Fixture im Format des Backend-`BestStationResult`.
Map<String, dynamic> _payload() => {
      'recommendations': [
        {
          'station': {
            'id': 's1',
            'name': 'Köln-Rodenkirchen',
            'brand': 'JET',
            'street': 'Hauptstr.',
            'postCode': '50997',
            'place': 'Köln',
            'lat': 50.9,
            'lng': 6.99,
            'distanceKm': 1.2,
            'isOpen': true,
            'prices': {'diesel': 1.62},
          },
          'targetPrice': 1.629,
          'extraDistanceKm': 1.2,
          'grossSavingEuro': 3.85,
          'detourCostEuro': 0.31,
          'timeCostEuro': 0.5,
          'realSavingEuro': 3.54,
          'breakEvenLiters': 4.4,
          'recommendation': 'LOHNT_SICH',
          'explanation': 'Spart real 3,54 € gegenüber dem Durchschnitt.',
        },
      ],
      'attribution': 'Tankerkönig',
      'disclaimer': 'Preise ohne Gewähr.',
    };

Widget _wrap(Future<Map<String, dynamic>> Function() loader) {
  return ProviderScope(
    overrides: [
      savedRoutesRepositoryProvider.overrideWith(
        (ref) => _FakeSavedRoutesRepository(ref, loader),
      ),
    ],
    child: const MaterialApp(
      home: SavedRouteRecommendationsScreen(routeId: 'r1', routeName: 'Pendelstrecke'),
    ),
  );
}

void main() {
  setUpAll(() async {
    // searchPrefsProvider liest die Hive-Box 'settings' — eine In-Memory-Box
    // genuegt (Defaults: DIESEL, 7,5 l/100 km, 50 l).
    await Hive.openBox('settings', bytes: Uint8List(0));
  });

  group('SavedRouteRecommendationsScreen', () {
    testWidgets('zeigt erst Ladezustand, dann Empfehlungen mit Attribution', (tester) async {
      await tester.pumpWidget(_wrap(() async => _payload()));

      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      await tester.pumpAndSettle();

      expect(find.text('Pendelstrecke'), findsOneWidget); // AppBar = Routen-Name
      expect(find.text('JET · Köln-Rodenkirchen'), findsOneWidget);
      expect(find.text('Lohnt sich'), findsOneWidget);
      expect(find.text('Datenquelle: Tankerkönig'), findsOneWidget);
      expect(find.text('Preise ohne Gewähr.'), findsOneWidget);
    });

    testWidgets('Empty-State ohne Empfehlungen', (tester) async {
      await tester.pumpWidget(
        _wrap(
          () async => <String, dynamic>{
            'recommendations': <Map<String, dynamic>>[],
            'attribution': 'Tankerkönig',
          },
        ),
      );
      await tester.pumpAndSettle();

      expect(find.textContaining('Keine geöffneten Tankstellen'), findsOneWidget);
    });

    testWidgets('Fehlerzustand zeigt Meldung', (tester) async {
      await tester.pumpWidget(_wrap(() async => throw Exception('Backend down')));
      await tester.pumpAndSettle();

      expect(find.textContaining('Fehler:'), findsOneWidget);
      expect(find.textContaining('Backend down'), findsOneWidget);
    });
  });
}
