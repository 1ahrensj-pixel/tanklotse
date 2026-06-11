import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tanklotse/shared/widgets/break_even_badge.dart';

void main() {
  Widget wrap(Widget child) => MaterialApp(home: Scaffold(body: child));

  testWidgets('zeigt "lohnt sich nicht" bei breakEven=null', (tester) async {
    await tester.pumpWidget(wrap(const BreakEvenBadge(breakEvenLiters: null, tankLiters: 50)));
    expect(find.textContaining('Lohnt sich nicht'), findsOneWidget);
  });

  testWidgets('zeigt "lohnt sich sofort" bei breakEven=0', (tester) async {
    await tester.pumpWidget(wrap(const BreakEvenBadge(breakEvenLiters: 0, tankLiters: 50)));
    expect(find.textContaining('Lohnt sich sofort'), findsOneWidget);
  });

  testWidgets('zeigt "lohnt sich (ab X)" wenn tankLiters >= breakEven', (tester) async {
    await tester.pumpWidget(wrap(const BreakEvenBadge(breakEvenLiters: 20, tankLiters: 50)));
    expect(find.textContaining('Lohnt sich'), findsOneWidget);
    expect(find.textContaining('20'), findsOneWidget);
  });

  testWidgets('zeigt "lohnt sich erst ab X" wenn tankLiters < breakEven', (tester) async {
    await tester.pumpWidget(wrap(const BreakEvenBadge(breakEvenLiters: 67, tankLiters: 40)));
    expect(find.textContaining('erst ab 67'), findsOneWidget);
  });

  // Audit 2026-05-06 §14 Aufgabe 6 + §13 Aufgabe 4: Distanz-Suffix
  // unterscheidet 4 Faelle.
  testWidgets('Default (estimated + point_to_station) → "(geschätzte Entfernung)"', (tester) async {
    await tester.pumpWidget(wrap(
      const BreakEvenBadge(breakEvenLiters: 20, tankLiters: 50),
    ),);
    expect(find.textContaining('(geschätzte Entfernung)'), findsOneWidget);
  });

  testWidgets('estimated + isRouteContext=true → "(geschätzter Zusatzumweg)"', (tester) async {
    await tester.pumpWidget(wrap(
      const BreakEvenBadge(
        breakEvenLiters: 20,
        tankLiters: 50,
        isRouteContext: true,
      ),
    ),);
    expect(find.textContaining('(geschätzter Zusatzumweg)'), findsOneWidget);
  });

  testWidgets('precise + point_to_station → "(exakte Strecke)" — KEIN "Umweg"', (tester) async {
    await tester.pumpWidget(wrap(
      const BreakEvenBadge(
        breakEvenLiters: 20,
        tankLiters: 50,
        isDistanceEstimated: false,
        isRouteContext: false,
      ),
    ),);
    expect(find.textContaining('(geschätzt'), findsNothing);
    expect(find.textContaining('(exakte Strecke)'), findsOneWidget);
    // Wahrheit: bei lokaler Suche darf die App KEINEN „Umweg" behaupten.
    expect(find.textContaining('Umweg'), findsNothing);
  });

  testWidgets('precise + route_via_station → "(exakter Zusatzumweg)"', (tester) async {
    await tester.pumpWidget(wrap(
      const BreakEvenBadge(
        breakEvenLiters: 20,
        tankLiters: 50,
        isDistanceEstimated: false,
        isRouteContext: true,
      ),
    ),);
    expect(find.textContaining('(exakter Zusatzumweg)'), findsOneWidget);
  });
}
