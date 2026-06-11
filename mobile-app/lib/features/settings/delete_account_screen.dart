import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/api_client.dart';

class DeleteAccountScreen extends ConsumerWidget {
  const DeleteAccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Konto löschen')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const Text(
              'Mit dem Löschen entfernen wir dein Konto, deine Favoriten, Fahrzeugprofile und Preisalarme dauerhaft. Diese Aktion ist nicht umkehrbar.',
            ),
            const SizedBox(height: 24),
            FilledButton.tonal(
              style: ButtonStyle(backgroundColor: WidgetStatePropertyAll(Colors.red.shade100)),
              onPressed: () async {
                final ok = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Wirklich löschen?'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Abbrechen')),
                      FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Löschen')),
                    ],
                  ),
                );
                if (ok == true) {
                  await ref.read(apiClientProvider).delete('/auth/me');
                  if (context.mounted) context.go('/onboarding');
                }
              },
              child: const Text('Konto endgültig löschen'),
            ),
          ],
        ),
      ),
    );
  }
}
