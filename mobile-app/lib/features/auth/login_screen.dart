import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

import 'auth_repository.dart';

const _googleClientId = String.fromEnvironment('GOOGLE_OAUTH_CLIENT_ID', defaultValue: '');

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  String? _error;
  bool _busy = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(authRepositoryProvider).login(_email.text.trim(), _password.text);
      if (!mounted) return;
      context.go('/home');
    } catch (e) {
      setState(() => _error = 'Login fehlgeschlagen.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _appleLogin() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      // Apple Sign-In ist nur auf iOS / macOS verfuegbar (und auf Web mit zusaetzlicher Konfig).
      if (!Platform.isIOS && !Platform.isMacOS) {
        throw const SignInWithAppleNotSupportedException(message: 'Apple Sign-In nur auf Apple-Plattformen.');
      }
      final credential = await SignInWithApple.getAppleIDCredential(
        scopes: [AppleIDAuthorizationScopes.email, AppleIDAuthorizationScopes.fullName],
      );
      final token = credential.identityToken;
      if (token == null) throw Exception('Kein Apple Identity-Token erhalten.');
      await ref.read(authRepositoryProvider).loginWithApple(token);
      if (!mounted) return;
      context.go('/home');
    } catch (e) {
      setState(() => _error = 'Apple-Login: ${_describe(e)}');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _googleLogin() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      if (_googleClientId.isEmpty) {
        throw Exception(
          'Kein GOOGLE_OAUTH_CLIENT_ID gesetzt. Beim Build via --dart-define=GOOGLE_OAUTH_CLIENT_ID=... übergeben.',
        );
      }
      final google = GoogleSignIn(serverClientId: _googleClientId, scopes: ['email', 'openid']);
      final account = await google.signIn();
      if (account == null) throw Exception('Abgebrochen.');
      final auth = await account.authentication;
      final idToken = auth.idToken;
      if (idToken == null) throw Exception('Kein Google ID-Token erhalten.');
      await ref.read(authRepositoryProvider).loginWithGoogle(idToken);
      if (!mounted) return;
      context.go('/home');
    } catch (e) {
      setState(() => _error = 'Google-Login: ${_describe(e)}');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  String _describe(Object e) {
    final s = e.toString();
    return s.length > 200 ? '${s.substring(0, 200)}…' : s;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Anmelden')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: ListView(
            children: [
              TextField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: 'E-Mail'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _password,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'Passwort'),
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: const TextStyle(color: Colors.red)),
              ],
              const SizedBox(height: 16),
              FilledButton(onPressed: _busy ? null : _submit, child: const Text('Login')),
              const SizedBox(height: 12),
              const Divider(),
              const SizedBox(height: 8),
              Text('oder', style: Theme.of(context).textTheme.bodySmall),
              const SizedBox(height: 8),
              if (Platform.isIOS || Platform.isMacOS)
                OutlinedButton.icon(
                  icon: const Icon(Icons.apple),
                  label: const Text('Mit Apple anmelden'),
                  onPressed: _busy ? null : _appleLogin,
                ),
              const SizedBox(height: 4),
              OutlinedButton.icon(
                icon: const Icon(Icons.g_mobiledata, size: 28),
                label: const Text('Mit Google anmelden'),
                onPressed: _busy ? null : _googleLogin,
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => context.go('/register'),
                child: const Text('Noch kein Konto? Registrieren'),
              ),
              TextButton(
                onPressed: () => context.go('/forgot'),
                child: const Text('Passwort vergessen?'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
