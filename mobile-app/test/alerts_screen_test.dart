import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:tanklotse/core/api/api_client.dart';
import 'package:tanklotse/features/alerts/alerts_screen.dart';

class _MockDio extends Mock implements Dio {}

Response<dynamic> _res(String path, dynamic data) => Response<dynamic>(
      requestOptions: RequestOptions(path: path),
      statusCode: 200,
      data: data,
    );

Widget _wrap(Dio dio) => ProviderScope(
      overrides: [apiClientProvider.overrideWithValue(dio)],
      child: const MaterialApp(home: AlertsScreen()),
    );

void main() {
  late _MockDio dio;

  final alert = <String, dynamic>{
    'id': 'a1',
    'fuelType': 'DIESEL',
    'maxPrice': 1.79,
    'active': true,
  };

  setUp(() {
    dio = _MockDio();
    when(() => dio.get<dynamic>('/alerts'))
        .thenAnswer((_) async => _res('/alerts', [alert]));
  });

  group('AlertsScreen', () {
    testWidgets('rendert Alarm-Liste mit Switch + Lösch-Button', (tester) async {
      await tester.pumpWidget(_wrap(dio));
      await tester.pumpAndSettle();

      expect(find.text('DIESEL ≤ 1.79 €'), findsOneWidget);
      expect(find.text('aktiv'), findsOneWidget);
      expect(find.byType(Switch), findsOneWidget);
      expect(find.byIcon(Icons.delete_outline), findsOneWidget);
    });

    testWidgets('Empty-State ohne Alarme', (tester) async {
      when(() => dio.get<dynamic>('/alerts'))
          .thenAnswer((_) async => _res('/alerts', <Map<String, dynamic>>[]));

      await tester.pumpWidget(_wrap(dio));
      await tester.pumpAndSettle();

      expect(find.textContaining('Noch keine Preisalarme'), findsOneWidget);
    });

    testWidgets('Lösch-Button: Abbrechen löscht nicht, Bestätigen ruft DELETE', (tester) async {
      when(() => dio.delete<dynamic>(any()))
          .thenAnswer((_) async => _res('/alerts/a1', null));

      await tester.pumpWidget(_wrap(dio));
      await tester.pumpAndSettle();

      await tester.tap(find.byIcon(Icons.delete_outline));
      await tester.pumpAndSettle();
      expect(find.text('Preisalarm löschen?'), findsOneWidget);

      await tester.tap(find.text('Abbrechen'));
      await tester.pumpAndSettle();
      verifyNever(() => dio.delete<dynamic>(any()));

      await tester.tap(find.byIcon(Icons.delete_outline));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Löschen'));
      await tester.pumpAndSettle();

      verify(() => dio.delete<dynamic>('/alerts/a1')).called(1);
    });

    testWidgets('Switch-Toggle ruft PUT /alerts/:id mit active=false', (tester) async {
      when(() => dio.put<dynamic>(any(), data: any(named: 'data')))
          .thenAnswer((_) async => _res('/alerts/a1', null));

      await tester.pumpWidget(_wrap(dio));
      await tester.pumpAndSettle();

      await tester.tap(find.byType(Switch));
      await tester.pumpAndSettle();

      verify(() => dio.put<dynamic>('/alerts/a1', data: {'active': false})).called(1);
    });
  });
}
