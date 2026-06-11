import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive/hive.dart';

import '../api/api_client.dart';

/// Version der in der App angezeigten Rechtstexte. Bei inhaltlichen
/// Aenderungen hochzaehlen — dann werden die Einwilligungen erneut gemeldet.
const String consentVersion = '1.0';

/// Meldet die im Onboarding lokal erteilten Einwilligungen (Hive-Keys
/// `consent_privacy` / `consent_location`) nach Login/Registrierung an
/// POST /users/me/consents — Nachweispflicht nach Art. 7 Abs. 1 DSGVO.
/// In Hive wird vermerkt, was bereits gemeldet wurde, damit nichts doppelt
/// gesendet wird. Schluckt ALLE Fehler — die Meldung ist Pflege im
/// Hintergrund und darf den Login nie blockieren.
class ConsentService {
  ConsentService(this._ref);
  final Ref _ref;

  Future<void> reportLocalConsents() async {
    try {
      final box = Hive.box('settings');
      await _reportIfNeeded(box, type: 'PRIVACY', hiveKey: 'consent_privacy');
      await _reportIfNeeded(box, type: 'LOCATION', hiveKey: 'consent_location');
    } catch (e) {
      if (kDebugMode) {
        debugPrint('[consent] Meldung an Backend fehlgeschlagen: $e');
      }
    }
  }

  Future<void> _reportIfNeeded(
    Box<dynamic> box, {
    required String type,
    required String hiveKey,
  }) async {
    final value = box.get(hiveKey);
    // Consent-Screen noch nicht durchlaufen → nichts zu melden.
    if (value is! bool) return;
    final reportedKey = 'consent_reported_${type.toLowerCase()}_v$consentVersion';
    // Bereits mit identischem Wert in dieser Version gemeldet.
    if (box.get(reportedKey) == value) return;
    await _ref.read(apiClientProvider).post('/users/me/consents', data: {
      'type': type,
      'accepted': value,
      'version': consentVersion,
    },);
    await box.put(reportedKey, value);
  }
}

final consentServiceProvider = Provider<ConsentService>((ref) => ConsentService(ref));
