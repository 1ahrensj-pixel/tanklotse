import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:tanklotse/features/error/error_screen.dart';

GoRouter _testRouter() => GoRouter(
      initialLocation: '/error',
      routes: [
        GoRoute(path: '/error', builder: (_, __) => const ErrorScreen()),
        GoRoute(path: '/home', builder: (_, __) => const Scaffold(body: Text('HOME-REACHED'))),
      ],
    );

void main() {
  group('ErrorScreen', () {
    testWidgets('zeigt Icon + Erklaerungs-Text + Retry-Button', (tester) async {
      await tester.pumpWidget(MaterialApp.router(routerConfig: _testRouter()));

      expect(find.byIcon(Icons.cloud_off), findsOneWidget);
      expect(find.textContaining('Server nicht erreichbar'), findsOneWidget);
      expect(find.widgetWithText(FilledButton, 'Zur Suche'), findsOneWidget);
    });

    testWidgets('Retry-Button navigiert nach /home', (tester) async {
      await tester.pumpWidget(MaterialApp.router(routerConfig: _testRouter()));

      await tester.tap(find.widgetWithText(FilledButton, 'Zur Suche'));
      await tester.pumpAndSettle();

      expect(find.text('HOME-REACHED'), findsOneWidget);
    });
  });
}
