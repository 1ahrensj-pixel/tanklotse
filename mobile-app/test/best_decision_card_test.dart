import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:tanklotse/shared/widgets/best_decision_card.dart';

void main() {
  Widget wrap(Widget child) {
    final router = GoRouter(routes: [
      GoRoute(path: '/', builder: (_, __) => Scaffold(body: child)),
      GoRoute(path: '/station/:id', builder: (_, __) => const Scaffold(body: Text('Station'))),
    ],);
    return ProviderScope(child: MaterialApp.router(routerConfig: router));
  }

  testWidgets('zeigt Brand · Name + alle Pflichtwerte', (tester) async {
    await tester.pumpWidget(wrap(
      const BestDecisionCard(
        stationId: 'abc',
        stationLabel: 'JET · Köln-Rodenkirchen',
        fuelType: 'DIESEL',
        targetPrice: 1.629,
        distanceKm: 1.8,
        tankLiters: 55,
        consumption: 8.0,
        grossSavingEuro: 3.85,
        detourCostEuro: 0.31,
        realSavingEuro: 3.54,
        breakEvenLiters: 4.4,
        recommendation: 'LOHNT_SICH',
      ),
    ),);
    expect(find.text('Beste Entscheidung heute'), findsOneWidget);
    expect(find.text('JET · Köln-Rodenkirchen'), findsOneWidget);
    expect(find.textContaining('1,629'), findsOneWidget);
    expect(find.textContaining('3,85'), findsOneWidget);
    expect(find.textContaining('0,31'), findsOneWidget);
    expect(find.textContaining('3,54'), findsOneWidget);
    expect(find.textContaining('lohnt sich'), findsOneWidget);
  });

  testWidgets('LOHNT_SICH_NICHT zeigt rote Empfehlung', (tester) async {
    await tester.pumpWidget(wrap(
      const BestDecisionCard(
        stationId: 'abc',
        stationLabel: 'X · Y',
        fuelType: 'DIESEL',
        targetPrice: 1.7,
        distanceKm: 5,
        tankLiters: 30,
        consumption: 8,
        grossSavingEuro: 0.5,
        detourCostEuro: 1.5,
        realSavingEuro: -1.0,
        breakEvenLiters: null,
        recommendation: 'LOHNT_SICH_NICHT',
      ),
    ),);
    expect(find.textContaining('lohnt sich nicht'), findsOneWidget);
  });

  testWidgets('ERST_AB_X_LITERN zeigt deutschen Empfehlungstext', (tester) async {
    await tester.pumpWidget(wrap(
      const BestDecisionCard(
        stationId: 'abc',
        stationLabel: 'X · Y',
        fuelType: 'DIESEL',
        targetPrice: 1.6,
        distanceKm: 8,
        tankLiters: 5,
        consumption: 8,
        grossSavingEuro: 0.5,
        detourCostEuro: 1.0,
        realSavingEuro: -0.5,
        breakEvenLiters: 30,
        recommendation: 'ERST_AB_X_LITERN',
      ),
    ),);
    expect(find.textContaining('Tankmenge'), findsOneWidget);
  });
}
