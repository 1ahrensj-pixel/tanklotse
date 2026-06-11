import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'auth_repository.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});
  @override
  ConsumerState<ForgotPasswordScreen> createState() => _S();
}

class _S extends ConsumerState<ForgotPasswordScreen> {
  final _email = TextEditingController();
  bool _done = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Passwort zurücksetzen')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: _done
            ? const Center(child: Text('Wenn dein Konto existiert, haben wir dir eine E-Mail gesendet.'))
            : Column(
                children: [
                  TextField(controller: _email, decoration: const InputDecoration(labelText: 'E-Mail')),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: () async {
                      await ref.read(authRepositoryProvider).forgotPassword(_email.text.trim());
                      setState(() => _done = true);
                    },
                    child: const Text('Reset-Link senden'),
                  ),
                ],
              ),
      ),
    );
  }
}
