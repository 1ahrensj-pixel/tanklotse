// PremiumScreen haengt am statischen `InAppPurchase.instance`-Singleton. Damit
// im Test keine echte Android-/iOS-Store-Implementierung registriert wird
// (Method-Channels existieren hier nicht), wird das Singleton einmalig unter
// `TargetPlatform.linux` erzeugt und die Plattform-Schnittstelle durch einen
// Fake ersetzt. `in_app_purchase_platform_interface` ist eine bereits in
// pubspec.lock aufgeloeste transitive Abhaengigkeit von `in_app_purchase`.
// ignore_for_file: depend_on_referenced_packages

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:in_app_purchase_platform_interface/in_app_purchase_platform_interface.dart';
import 'package:mocktail/mocktail.dart';

import 'package:tanklotse/core/api/api_client.dart';
import 'package:tanklotse/features/auth/auth_repository.dart';
import 'package:tanklotse/features/premium/premium_screen.dart';

class _MockDio extends Mock implements Dio {}

class _FakeAuthRepository extends AuthRepository {
  _FakeAuthRepository(super.ref, {required this.loggedIn});

  final bool loggedIn;

  @override
  Future<bool> isAuthenticated() async => loggedIn;
}

/// Store-Fake: verfuegbar, ein Produkt, keine Kauf-Events.
class _FakeIapPlatform extends InAppPurchasePlatform {
  @override
  Future<bool> isAvailable() async => true;

  @override
  Stream<List<PurchaseDetails>> get purchaseStream =>
      const Stream<List<PurchaseDetails>>.empty();

  @override
  Future<ProductDetailsResponse> queryProductDetails(Set<String> identifiers) async {
    return ProductDetailsResponse(
      productDetails: [
        ProductDetails(
          id: premiumProductId,
          title: 'TankLotse Premium',
          description: 'Monatsabo',
          price: '4,99 €',
          rawPrice: 4.99,
          currencyCode: 'EUR',
        ),
      ],
      notFoundIDs: const [],
    );
  }
}

GoRouter _router() => GoRouter(
      routes: [
        GoRoute(path: '/', builder: (_, __) => const PremiumScreen()),
        GoRoute(path: '/login', builder: (_, __) => const Scaffold(body: Text('LOGIN-REACHED'))),
      ],
    );

Widget _wrap(Dio dio, {required bool loggedIn}) => ProviderScope(
      overrides: [
        apiClientProvider.overrideWithValue(dio),
        authRepositoryProvider.overrideWith(
          (ref) => _FakeAuthRepository(ref, loggedIn: loggedIn),
        ),
      ],
      child: MaterialApp.router(routerConfig: _router()),
    );

Response<dynamic> _statusRes(dynamic data) => Response<dynamic>(
      requestOptions: RequestOptions(path: '/subscription/status'),
      statusCode: 200,
      data: data,
    );

void main() {
  setUpAll(() {
    // Erster Zugriff auf InAppPurchase.instance registriert abhaengig von
    // defaultTargetPlatform die echte Store-Implementierung — unter Linux
    // passiert nichts, danach delegiert das Singleton an den Fake unten.
    debugDefaultTargetPlatformOverride = TargetPlatform.linux;
    expect(InAppPurchase.instance, isNotNull);
    debugDefaultTargetPlatformOverride = null;
  });

  setUp(() {
    InAppPurchasePlatform.instance = _FakeIapPlatform();
  });

  group('PremiumScreen', () {
    testWidgets('nicht eingeloggt: Kauf-Klick zeigt Login-Hinweis und öffnet /login', (tester) async {
      final dio = _MockDio();
      await tester.pumpWidget(_wrap(dio, loggedIn: false));
      await tester.pumpAndSettle();

      // Hinweis: FilledButton.icon erzeugt eine private Subklasse, daher
      // ueber den Label-Text statt ueber den Widget-Typ suchen.
      final buyButton = find.text('Premium aktivieren – 4,99 €');
      expect(buyButton, findsOneWidget);

      await tester.ensureVisible(buyButton);
      await tester.tap(buyButton);
      await tester.pumpAndSettle();

      expect(find.textContaining('Bitte melde dich zuerst an'), findsOneWidget);
      expect(find.text('LOGIN-REACHED'), findsOneWidget);
      // Ohne Login darf der Status-Endpoint nie angefragt werden.
      verifyNever(() => dio.get<dynamic>(any()));
    });

    testWidgets('eingeloggt mit aktivem Abo: zeigt „Premium aktiv“ statt Kauf-Button', (tester) async {
      final dio = _MockDio();
      when(() => dio.get<dynamic>('/subscription/status')).thenAnswer(
        (_) async => _statusRes(<String, dynamic>{
          'plan': 'PREMIUM',
          'expiresAt': '2099-06-15T12:00:00Z',
        }),
      );

      await tester.pumpWidget(_wrap(dio, loggedIn: true));
      await tester.pumpAndSettle();

      expect(find.text('Premium aktiv'), findsOneWidget);
      expect(find.textContaining('Aktiv bis'), findsOneWidget);
      expect(find.textContaining('Premium aktivieren'), findsNothing);
      expect(find.text('Käufe wiederherstellen'), findsNothing);
    });

    testWidgets('eingeloggt ohne Abo: zeigt Kauf-Button + „Käufe wiederherstellen“', (tester) async {
      final dio = _MockDio();
      // Backend liefert `null`, wenn kein aktives Abo existiert.
      when(() => dio.get<dynamic>('/subscription/status'))
          .thenAnswer((_) async => _statusRes(null));

      await tester.pumpWidget(_wrap(dio, loggedIn: true));
      await tester.pumpAndSettle();

      expect(find.text('Premium aktivieren – 4,99 €'), findsOneWidget);
      expect(find.text('Käufe wiederherstellen'), findsOneWidget);
      expect(find.text('Premium aktiv'), findsNothing);
    });
  });
}
