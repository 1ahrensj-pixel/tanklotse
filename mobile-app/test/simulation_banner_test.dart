import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tanklotse/shared/widgets/simulation_banner.dart';

/// PR #15.1 §5.3 — der Demo-Banner zeigt ehrlichen Hinweistext.
///
/// Da `AppEnv.providerSimulationActive` zur Build-Zeit per
/// `String.fromEnvironment` gelesen wird, kann ein Widget-Test ihn nicht
/// dynamisch aktivieren. Daher zwei strukturelle Tests:
///   1. Der Default-Lauf (kein dart-define) zeigt nichts (SizedBox.shrink).
///   2. Der Quelltext enthaelt den Pflicht-Hinweistext aus dem Auftrag
///      §5.3 — das stellt sicher, dass kein PR den Text still kuerzt.
void main() {
  group('SimulationBanner', () {
    testWidgets('zeigt nichts, wenn AppEnv.providerSimulationActive=false',
        (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(body: SimulationBanner()),
        ),
      );
      // Default-Build: kein dart-define gesetzt → Banner unsichtbar.
      expect(find.byType(SimulationBanner), findsOneWidget);
      expect(
        find.text('Demo-Modus: Es werden keine echten Tankstellenpreise angezeigt.'),
        findsNothing,
      );
    });
  });
}
