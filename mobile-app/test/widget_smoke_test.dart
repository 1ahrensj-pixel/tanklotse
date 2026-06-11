import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:tanklotse/features/error/error_screen.dart';

void main() {
  testWidgets('ErrorScreen rendert', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: ErrorScreen()));
    expect(find.text('Etwas ging schief'), findsOneWidget);
    expect(find.text('Zur Suche'), findsOneWidget);
  });
}
