import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tanklotse/features/legal/imprint_screen.dart';
import 'package:tanklotse/features/legal/privacy_screen.dart';
import 'package:tanklotse/features/legal/data_source_screen.dart';

Widget _wrap(Widget child) => MaterialApp(home: child);

void main() {
  group('Legal-Screens (DSGVO-Pflichtseiten)', () {
    testWidgets('ImprintScreen rendert AppBar + § 5 DDG-Pflichtangaben', (tester) async {
      await tester.pumpWidget(_wrap(const ImprintScreen()));
      expect(find.text('Impressum'), findsOneWidget);
      // Pflicht-Stichworte
      expect(find.textContaining('§ 5 DDG'), findsOneWidget);
      expect(find.textContaining('§ 18 MStV'), findsOneWidget);
    });

    testWidgets('PrivacyScreen rendert + zentrale DSGVO-Hinweise', (tester) async {
      await tester.pumpWidget(_wrap(const PrivacyScreen()));
      expect(find.text('Datenschutz'), findsOneWidget);
      // Kerneraussagen — Stichworte einzeln, da der Text Umbrueche enthaelt.
      expect(find.textContaining('IP gekürzt'), findsOneWidget);
      expect(find.textContaining('Bewegungsprofile'), findsOneWidget);
      expect(find.textContaining('Wir verkaufen keine Daten'), findsOneWidget);
    });

    testWidgets('DataSourceScreen nennt Tankerkoenig + CC BY 4.0', (tester) async {
      await tester.pumpWidget(_wrap(const DataSourceScreen()));
      // Tankerkoenig taucht sowohl im Erklaer-Text als auch im Link-Label auf.
      expect(find.textContaining('Tankerkönig'), findsWidgets);
      expect(find.textContaining('CC BY 4.0'), findsWidgets);
    });
  });
}
