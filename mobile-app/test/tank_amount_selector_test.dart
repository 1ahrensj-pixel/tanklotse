import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tanklotse/shared/widgets/tank_amount_selector.dart';

void main() {
  testWidgets('zeigt alle Schnellwerte und ruft onChanged bei Tap', (tester) async {
    double captured = 0;
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: TankAmountSelector(
          value: 50,
          onChanged: (v) => captured = v,
        ),
      ),
    ),);
    for (final l in const ['20 l', '30 l', '45 l', '55 l', '70 l']) {
      expect(find.text(l), findsOneWidget);
    }
    expect(find.text('Eigener Wert'), findsOneWidget);
    await tester.tap(find.text('45 l'));
    await tester.pump();
    expect(captured, 45.0);
  });
}
