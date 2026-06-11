import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/api_client.dart';
import '../../core/services/consent_service.dart';
import '../../core/services/push_service.dart';

class AuthRepository {
  AuthRepository(this._ref);
  final Ref _ref;

  Future<void> login(String email, String password) async {
    final dio = _ref.read(apiClientProvider);
    final res = await dio.post('/auth/login', data: {'email': email, 'password': password});
    final storage = _ref.read(secureStorageProvider);
    await storage.write(key: 'access_token', value: res.data['accessToken']);
    await storage.write(key: 'refresh_token', value: res.data['refreshToken']);
    _afterAuthSuccess();
  }

  Future<void> register(String email, String password) async {
    final dio = _ref.read(apiClientProvider);
    final res = await dio.post('/auth/register', data: {'email': email, 'password': password});
    final storage = _ref.read(secureStorageProvider);
    await storage.write(key: 'access_token', value: res.data['accessToken']);
    await storage.write(key: 'refresh_token', value: res.data['refreshToken']);
    _afterAuthSuccess();
  }

  Future<void> loginWithApple(String identityToken) async {
    final dio = _ref.read(apiClientProvider);
    final res = await dio.post('/auth/login/apple', data: {'identityToken': identityToken});
    final storage = _ref.read(secureStorageProvider);
    await storage.write(key: 'access_token', value: res.data['accessToken']);
    await storage.write(key: 'refresh_token', value: res.data['refreshToken']);
    _afterAuthSuccess();
  }

  Future<void> loginWithGoogle(String idToken) async {
    final dio = _ref.read(apiClientProvider);
    final res = await dio.post('/auth/login/google', data: {'idToken': idToken});
    final storage = _ref.read(secureStorageProvider);
    await storage.write(key: 'access_token', value: res.data['accessToken']);
    await storage.write(key: 'refresh_token', value: res.data['refreshToken']);
    _afterAuthSuccess();
  }

  /// Hintergrund-Aufgaben nach erfolgreichem Login/Registrierung:
  /// Push-Token registrieren (sonst kommen Preisalarme nie an) und lokal
  /// erteilte Einwilligungen ans Backend melden (DSGVO-Nachweis). Beides
  /// laeuft fire-and-forget und schluckt Fehler — der Login blockiert nie.
  void _afterAuthSuccess() {
    unawaited(_ref.read(pushServiceProvider).registerForCurrentUser());
    unawaited(_ref.read(consentServiceProvider).reportLocalConsents());
  }

  Future<void> forgotPassword(String email) async {
    await _ref.read(apiClientProvider).post('/auth/forgot-password', data: {'email': email});
  }

  Future<void> logout() async {
    final storage = _ref.read(secureStorageProvider);
    // Push-Token abmelden, solange das Access-Token noch gueltig ist.
    // Schluckt Fehler intern — Logout darf daran nie scheitern.
    await _ref.read(pushServiceProvider).unregister();
    final refresh = await storage.read(key: 'refresh_token');
    try {
      await _ref.read(apiClientProvider).post('/auth/logout', data: {'refreshToken': refresh});
    } catch (_) {}
    await storage.deleteAll();
  }

  Future<bool> isAuthenticated() async {
    final t = await _ref.read(secureStorageProvider).read(key: 'access_token');
    return t != null;
  }
}

final authRepositoryProvider = Provider<AuthRepository>((ref) => AuthRepository(ref));
