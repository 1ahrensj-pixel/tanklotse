import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tanklotse/shared/widgets/recommendation_verdict_text.dart';

void main() {
  Widget wrap(Widget child) => MaterialApp(home: Scaffold(body: child));

  testWidgets('zeigt "Gute Wahl" bei realSavingEuro >= 2', (tester) async {
    await tester.pumpWidget(wrap(
      const RecommendationVerdictText(
        tankLiters: 50,
        realSavingEuro: 4.8,
        breakEvenLiters: 12,
      ),
    ),);
    expect(find.textContaining('Gute Wahl'), findsOneWidget);
    expect(find.textContaining('50 Litern'), findsOneWidget);
    expect(find.textContaining('4,80 €'), findsOneWidget);
  });

  testWidgets('zeigt "lohnt sich knapp" bei 0.5 <= realSaving < 2', (tester) async {
    await tester.pumpWidget(wrap(
      const RecommendationVerdictText(
        tankLiters: 30,
        realSavingEuro: 1.2,
        breakEvenLiters: 18,
      ),
    ),);
    expect(find.textContaining('knapp'), findsOneWidget);
  });

  testWidgets('zeigt "Lohnt sich erst ab X Litern" bei zu kleiner Tankmenge', (tester) async {
    await tester.pumpWidget(wrap(
      const RecommendationVerdictText(
        tankLiters: 20,
        realSavingEuro: -0.4,
        breakEvenLiters: 32,
      ),
    ),);
    expect(find.textContaining('Lohnt sich erst ab 32 Litern'), findsOneWidget);
    expect(find.textContaining('20 Litern'), findsOneWidget);
  });

  testWidgets('zeigt klaren "nicht günstiger"-Satz wenn breakEvenLiters=null', (tester) async {
    await tester.pumpWidget(wrap(
      const RecommendationVerdictText(
        tankLiters: 50,
        realSavingEuro: -1.0,
        breakEvenLiters: null,
      ),
    ),);
    expect(find.textContaining('nicht günstiger'), findsOneWidget);
  });

  testWidgets('Footnote: estimated + point_to_station → Straßen-Fahrstrecke', (tester) async {
    await tester.pumpWidget(wrap(
      const RecommendationVerdictText(
        tankLiters: 50,
        realSavingEuro: 3.0,
        breakEvenLiters: 12,
      ),
    ),);
    expect(find.textContaining('Straßen-Fahrstrecke'), findsOneWidget);
  });

  testWidgets('Footnote: precise + point_to_station → "kein vollständiger Umweg"', (tester) async {
    await tester.pumpWidget(wrap(
      const RecommendationVerdictText(
        tankLiters: 50,
        realSavingEuro: 3.0,
        breakEvenLiters: 12,
        isDistanceEstimated: false,
      ),
    ),);
    // Audit §13 Aufgabe 4: bei lokaler Suche darf die App keinen
    // exakten „Umweg" behaupten — nur die exakte Strecke zur Tankstelle.
    expect(find.textContaining('Fahrstrecke vom Startpunkt zur Tankstelle'), findsOneWidget);
    expect(find.textContaining('kein vollständiger Umweg'), findsOneWidget);
  });

  testWidgets('Footnote: precise + route_via_station → "exakt berechneten Zusatzumweg"', (tester) async {
    await tester.pumpWidget(wrap(
      const RecommendationVerdictText(
        tankLiters: 50,
        realSavingEuro: 3.0,
        breakEvenLiters: 12,
        isDistanceEstimated: false,
        isRouteContext: true,
      ),
    ),);
    expect(find.textContaining('exakt berechneten Zusatzumweg'), findsOneWidget);
  });

  testWidgets('Footnote: estimated + route_via_station → "geschätzten Distanz entlang der Route"', (tester) async {
    await tester.pumpWidget(wrap(
      const RecommendationVerdictText(
        tankLiters: 50,
        realSavingEuro: 3.0,
        breakEvenLiters: 12,
        isRouteContext: true,
      ),
    ),);
    expect(find.textContaining('geschätzten Distanz entlang der Route'), findsOneWidget);
  });
}
