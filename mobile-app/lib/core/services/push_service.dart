import 'dart:async';
import 'dart:io' show Platform;
import 'dart:math';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive/hive.dart';

import '../repositories/stations_repository.dart';

/// Defensive FCM-Initialisierung.
///
/// Bricht den App-Start nicht ab, wenn `google-services.json` /
/// `GoogleService-Info.plist` fehlt — der App-Code kann ohne Push betrieben
/// werden, Push wird in dem Fall einfach nicht aktiv.
class PushService {
  PushService(this._ref);
  final Ref _ref;

  bool _initialized = false;
  String? _lastToken;

  /// Initialisiert Firebase + FCM. Idempotent. Wirft NICHT.
  Future<bool> initIfPossible() async {
    if (_initialized) return true;
    try {
      await Firebase.initializeApp();
      _initialized = true;
      return true;
    } catch (e) {
      if (kDebugMode) {
        debugPrint('[push] Firebase-Init nicht moeglich: $e');
      }
      return false;
    }
  }

  /// Registriert Push fuer den aktuell eingeloggten Nutzer mit einer stabilen,
  /// lokal generierten Geraete-ID. Schluckt ALLE Fehler — Push ist optional
  /// und darf Login/Alarm-Anlage nie blockieren.
  Future<void> registerForCurrentUser() async {
    try {
      await requestAndRegister(deviceId: _stableDeviceId());
    } catch (e) {
      if (kDebugMode) {
        debugPrint('[push] Registrierung nach Login/Alarm fehlgeschlagen: $e');
      }
    }
  }

  /// Meldet den zuletzt registrierten Token beim Backend ab (z. B. beim
  /// Logout), damit das Geraet keine Pushes fuer das abgemeldete Konto mehr
  /// bekommt. Schluckt ALLE Fehler — Logout darf daran nie scheitern.
  Future<void> unregister() async {
    try {
      final box = Hive.box('settings');
      final token = _lastToken ?? box.get('push_fcm_token') as String?;
      if (token == null || token.isEmpty) return;
      await _ref.read(pushRepositoryProvider).revokeToken(fcmToken: token);
      await box.delete('push_fcm_token');
      _lastToken = null;
    } catch (e) {
      if (kDebugMode) {
        debugPrint('[push] Token-Abmeldung fehlgeschlagen: $e');
      }
    }
  }

  /// Stabile Geraete-ID: beim ersten Aufruf generiert und in Hive gecacht
  /// (kein uuid-Paket im Projekt — Zeitstempel + Zufall reichen hier).
  String _stableDeviceId() {
    final box = Hive.box('settings');
    final existing = box.get('device_id');
    if (existing is String && existing.isNotEmpty) return existing;
    final rnd = Random();
    final id = 'dev-${DateTime.now().microsecondsSinceEpoch.toRadixString(16)}'
        '-${rnd.nextInt(1 << 32).toRadixString(16)}'
        '-${rnd.nextInt(1 << 32).toRadixString(16)}';
    box.put('device_id', id);
    return id;
  }

  /// Fragt die Push-Berechtigung an und registriert den FCM-Token beim Backend.
  /// Wird nur ausgefuehrt, wenn der Nutzer dem zugestimmt hat.
  Future<bool> requestAndRegister({required String deviceId}) async {
    if (!await initIfPossible()) return false;
    try {
      final messaging = FirebaseMessaging.instance;
      final settings = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );
      if (settings.authorizationStatus == AuthorizationStatus.denied) {
        return false;
      }
      final token = await messaging.getToken();
      if (token == null) return false;
      _lastToken = token;
      final platform = Platform.isIOS ? 'IOS' : (Platform.isAndroid ? 'ANDROID' : 'WEB');
      await _ref.read(pushRepositoryProvider).registerToken(
            deviceId: deviceId,
            fcmToken: token,
            platform: platform,
          );
      // Letzten Token persistieren, damit `unregister()` ihn auch nach einem
      // App-Neustart noch beim Backend abmelden kann.
      await Hive.box('settings').put('push_fcm_token', token);
      // Token-Refresh hooken
      messaging.onTokenRefresh.listen((newToken) async {
        _lastToken = newToken;
        await _ref.read(pushRepositoryProvider).registerToken(
              deviceId: deviceId,
              fcmToken: newToken,
              platform: platform,
            );
        await Hive.box('settings').put('push_fcm_token', newToken);
      });
      return true;
    } catch (e) {
      if (kDebugMode) {
        debugPrint('[push] Registrierung fehlgeschlagen: $e');
      }
      return false;
    }
  }

  String? get lastToken => _lastToken;
  bool get isInitialized => _initialized;
}

final pushServiceProvider = Provider<PushService>((ref) => PushService(ref));
