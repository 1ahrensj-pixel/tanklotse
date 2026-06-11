import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tanklotse/shared/widgets/vehicle_consumption_assistant.dart';

void main() {
  testWidgets('rendert Header, alle Klassen und alle Fahrprofile', (tester) async {
    await tester.pumpWidget(ProviderScope(
      child: MaterialApp(
        home: Scaffold(
          body: VehicleConsumptionAssistant(
            onResult: (_, __, ___) {},
            initialConsumption: 7.5,
          ),
        ),
      ),
    ),);
    expect(find.text('Verbrauchs-Assistent'), findsOneWidget);
    // 6 Fahrzeugklassen
    expect(find.text('Kleinwagen'), findsOneWidget);
    expect(find.text('Kompaktwagen'), findsOneWidget);
    expect(find.text('Kombi / Mittelklasse'), findsOneWidget);
    expect(find.text('SUV'), findsOneWidget);
    expect(find.text('Transporter'), findsOneWidget);
    expect(find.text('Wohnmobil / großes Fahrzeug'), findsOneWidget);
    // 3 Profile
    expect(find.text('Viel Stadtverkehr'), findsOneWidget);
    expect(find.text('Gemischt'), findsOneWidget);
    expect(find.text('Viel Autobahn'), findsOneWidget);
    // Übernehmen-Button vorhanden
    expect(find.text('Übernehmen'), findsOneWidget);
  });
}
