import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Online/Offline-Status der Mobile-App.
///
/// Quelle: `connectivity_plus`. Liefert beim ersten Aufruf den aktuellen
/// Status und horcht dann auf das `onConnectivityChanged`-Stream-Event.
/// Der API-Client (siehe `api_client.dart`) ergaenzt den Wert defensiv,
/// indem er bei Netzwerk-/Timeout-Fehlern `offlineProvider=true` setzt
/// und bei erfolgreichen Responses wieder `false` — so erkennen wir auch
/// Faelle, in denen `connectivity_plus` ein Funknetz meldet, aber kein
/// echter Internet-Zugang besteht (Captive-Portal).
class ConnectivityService {
  ConnectivityService([Connectivity? connectivity])
      : _connectivity = connectivity ?? Connectivity();

  final Connectivity _connectivity;

  Stream<bool> get onlineStream {
    return _connectivity.onConnectivityChanged.map(_isOnline);
  }

  Future<bool> isOnline() async {
    final results = await _connectivity.checkConnectivity();
    return _isOnline(results);
  }

  static bool _isOnline(List<ConnectivityResult> results) {
    return results.any((r) => r != ConnectivityResult.none);
  }
}

final connectivityServiceProvider = Provider<ConnectivityService>((ref) {
  return ConnectivityService();
});

/// Reiner Status-Provider — wird vom `connectivity_plus`-Stream UND vom
/// API-Client-Interceptor geschrieben. UI liest nur.
final offlineProvider = StateProvider<bool>((ref) => false);

/// Initialisiert die Stream-Subscription. In `main.dart` einmal aufrufen.
final connectivityWatcherProvider = Provider<StreamSubscription<bool>>((ref) {
  final service = ref.read(connectivityServiceProvider);
  final sub = service.onlineStream.listen((online) {
    ref.read(offlineProvider.notifier).state = !online;
  });
  ref.onDispose(sub.cancel);
  return sub;
});
