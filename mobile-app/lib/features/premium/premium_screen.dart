import 'dart:async';
import 'dart:io' show Platform;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:in_app_purchase/in_app_purchase.dart';

import '../../core/api/api_client.dart';
import '../auth/auth_repository.dart';

const String premiumProductId = 'tanklotse.premium.monthly';

class PremiumScreen extends ConsumerStatefulWidget {
  const PremiumScreen({super.key});

  @override
  ConsumerState<PremiumScreen> createState() => _S();
}

class _S extends ConsumerState<PremiumScreen> {
  final InAppPurchase _iap = InAppPurchase.instance;
  StreamSubscription<List<PurchaseDetails>>? _sub;
  bool _available = false;
  bool _busy = true;
  String? _error;
  ProductDetails? _product;
  bool _premiumActive = false;
  DateTime? _premiumUntil;

  @override
  void initState() {
    super.initState();
    _init();
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

  Future<void> _init() async {
    try {
      // Erst den Server-Status holen: ein bereits zahlender Kunde soll
      // "Premium aktiv" sehen — auch wenn der Store gerade zickt.
      await _loadPremiumStatus();
      _available = await _iap.isAvailable();
      if (!_available) {
        setState(() {
          _busy = false;
          _error = 'Store nicht verfügbar (Sandbox/Konfiguration).';
        });
        return;
      }
      // Stream vor dem Produkt-Abruf abonnieren, damit "Käufe
      // wiederherstellen" (PurchaseStatus.restored) auch dann verarbeitet
      // wird, wenn die Produktdetails nicht geladen werden konnten.
      _sub = _iap.purchaseStream.listen(_onPurchaseUpdate, onError: (e) {
        if (mounted) setState(() => _error = '$e');
      },);
      final response = await _iap.queryProductDetails({premiumProductId});
      if (response.error != null) {
        setState(() {
          _busy = false;
          _error = response.error!.message;
        });
        return;
      }
      if (response.productDetails.isEmpty) {
        setState(() {
          _busy = false;
          _error = 'Premium-Produkt im Store nicht hinterlegt: $premiumProductId';
        });
        return;
      }
      _product = response.productDetails.first;
      setState(() => _busy = false);
    } catch (e) {
      setState(() {
        _busy = false;
        _error = e.toString();
      });
    }
  }

  /// GET /subscription/status (nur eingeloggt): Backend liefert das aktive
  /// Abo (ACTIVE/GRACE) oder null. Fehler werden geschluckt — die
  /// Status-Anzeige darf den Kauf-Flow nie blockieren.
  Future<void> _loadPremiumStatus() async {
    try {
      final loggedIn = await ref.read(authRepositoryProvider).isAuthenticated();
      if (!loggedIn) return;
      final res = await ref.read(apiClientProvider).get('/subscription/status');
      final data = res.data;
      if (data is Map<String, dynamic>) {
        _premiumActive = true;
        final expiresAt = data['expiresAt'];
        _premiumUntil = expiresAt is String ? DateTime.tryParse(expiresAt) : null;
      } else {
        _premiumActive = false;
        _premiumUntil = null;
      }
    } catch (_) {
      // still — ohne Status zeigt der Screen einfach den Kauf-Button.
    }
  }

  Future<void> _buy() async {
    if (_product == null) return;
    // Ohne Login wuerde der Store-Kauf zwar durchgehen, aber die
    // Server-Validierung (/subscription/*/verify, JWT-Pflicht) mit 401
    // scheitern — Geld weg, Premium nie aktiv. Daher vorher pruefen.
    final loggedIn = await ref.read(authRepositoryProvider).isAuthenticated();
    if (!loggedIn) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Bitte melde dich zuerst an, damit Premium deinem Konto zugeordnet werden kann.'),
        ),
      );
      context.push('/login');
      return;
    }
    setState(() => _busy = true);
    try {
      final purchaseParam = PurchaseParam(productDetails: _product!);
      await _iap.buyNonConsumable(purchaseParam: purchaseParam);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _error = e.toString();
      });
    }
  }

  /// Stößt die Wiederherstellung frueherer Käufe an (Pflicht fuer den
  /// iOS-Review, noetig nach Neuinstallation/Gerätewechsel). Das Ergebnis
  /// kommt asynchron als PurchaseStatus.restored über den purchaseStream
  /// und wird dort wie ein Kauf am Backend validiert.
  Future<void> _restore() async {
    // Wie beim Kauf: ohne Login kann die Server-Validierung den
    // wiederhergestellten Kauf keinem Konto zuordnen.
    final loggedIn = await ref.read(authRepositoryProvider).isAuthenticated();
    if (!loggedIn) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Bitte melde dich zuerst an, damit Premium deinem Konto zugeordnet werden kann.'),
        ),
      );
      context.push('/login');
      return;
    }
    setState(() => _busy = true);
    try {
      await _iap.restorePurchases();
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      // Gibt es nichts wiederherzustellen, feuert der Stream u. U. nie —
      // daher den Busy-Zustand hier immer zuruecksetzen.
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _onPurchaseUpdate(List<PurchaseDetails> purchases) async {
    for (final p in purchases) {
      if (p.status == PurchaseStatus.purchased || p.status == PurchaseStatus.restored) {
        await _verifyOnBackend(p);
      } else if (p.status == PurchaseStatus.error) {
        if (mounted) setState(() => _error = p.error?.message ?? 'Kaufabbruch');
      }
      if (p.pendingCompletePurchase) {
        await _iap.completePurchase(p);
      }
    }
    if (mounted) setState(() => _busy = false);
  }

  Future<void> _verifyOnBackend(PurchaseDetails p) async {
    try {
      if (Platform.isIOS) {
        await ref.read(apiClientProvider).post(
          '/subscription/apple/verify',
          data: {'receiptData': p.verificationData.serverVerificationData},
        );
      } else if (Platform.isAndroid) {
        await ref.read(apiClientProvider).post(
          '/subscription/google/verify',
          data: {
            'productId': p.productID,
            'purchaseToken': p.verificationData.serverVerificationData,
          },
        );
      } else {
        return;
      }
      // Frisch validiert → Status neu laden, damit der Screen sofort
      // "Premium aktiv" statt des Kauf-Buttons zeigt.
      await _loadPremiumStatus();
      if (!mounted) return;
      setState(() {});
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Premium aktiv. Danke!')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Validierung fehlgeschlagen: $e')),
      );
    }
  }

  /// Deutsches Datumsformat (TT.MM.JJJJ) ohne intl-Abhängigkeit.
  static String _formatDate(DateTime d) {
    final local = d.toLocal();
    final day = local.day.toString().padLeft(2, '0');
    final month = local.month.toString().padLeft(2, '0');
    return '$day.$month.${local.year}';
  }

  @override
  Widget build(BuildContext context) {
    // Konsistent zur Preise-Seite der Website: keine „Werbefrei"-Claims
    // (es gibt nirgends Drittanbieter-Werbung) und keine erfundenen
    // Gratis-Limits — Premium ergänzt, es schaltet nichts frei.
    final perks = const [
      'Erweiterte Sparstatistik',
      'Tankstellen entlang ganzer Routen',
      'Mehrere Fahrzeugprofile',
      'Prioritäts-Support',
    ];
    return Scaffold(
      appBar: AppBar(title: const Text('Premium')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text('TankLotse Premium', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          const Text('Alle Funktionen kostenlos. Premium fügt Komfort & Tiefe hinzu.'),
          const SizedBox(height: 16),
          ...perks.map((p) => ListTile(leading: const Icon(Icons.check_circle_outline), title: Text(p))),
          const SizedBox(height: 16),
          if (_busy) const Center(child: CircularProgressIndicator()),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Text(_error!, style: const TextStyle(color: Colors.red)),
            ),
          if (_premiumActive)
            // Zahlende Kunden sehen ihren Status statt des Kauf-Buttons.
            Card(
              color: Theme.of(context).colorScheme.primaryContainer,
              child: ListTile(
                leading: const Icon(Icons.verified),
                title: const Text('Premium aktiv'),
                subtitle: Text(
                  _premiumUntil != null
                      ? 'Aktiv bis ${_formatDate(_premiumUntil!)}.'
                      : 'Dein Abo ist aktiv.',
                ),
              ),
            )
          else if (_product != null) ...[
            Text(
              'Preis: ${_product!.price}',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: _busy ? null : _buy,
              icon: const Icon(Icons.shopping_cart),
              label: Text('Premium aktivieren – ${_product!.price}'),
            ),
          ],
          if (!_premiumActive && _available) ...[
            const SizedBox(height: 8),
            TextButton.icon(
              onPressed: _busy ? null : _restore,
              icon: const Icon(Icons.restore),
              label: const Text('Käufe wiederherstellen'),
            ),
          ],
          if (!_premiumActive && _product == null && !_busy)
            const Text(
              'Hinweis: Premium-Produkt ist im App-Store/Play-Store noch nicht eingerichtet. '
              'Backend-Verify-Endpoints sind bereit.',
              style: TextStyle(fontSize: 12),
            ),
        ],
      ),
    );
  }
}
