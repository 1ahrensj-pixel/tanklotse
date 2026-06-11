import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'auth_repository.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  String? _error;
  bool _busy = false;

  Future<void> _submit() async {
    if (_password.text.length < 12) {
      setState(() => _error = 'Passwort mindestens 12 Zeichen.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(authRepositoryProvider).register(_email.text.trim(), _password.text);
      if (!mounted) return;
      context.go('/home');
    } catch (e) {
      setState(() => _error = 'Registrierung fehlgeschlagen.');
    } finally {
      setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Registrieren')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              TextField(controller: _email, decoration: const InputDecoration(labelText: 'E-Mail')),
              const SizedBox(height: 12),
              TextField(
                controller: _password, obscureText: true,
                decoration: const InputDecoration(labelText: 'Passwort (≥ 12 Zeichen)'),
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: const TextStyle(color: Colors.red)),
              ],
              const SizedBox(height: 16),
              FilledButton(onPressed: _busy ? null : _submit, child: const Text('Konto anlegen')),
            ],
          ),
        ),
      ),
    );
  }
}
