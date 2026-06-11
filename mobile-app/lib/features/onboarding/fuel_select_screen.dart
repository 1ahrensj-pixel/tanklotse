import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/state/search_state.dart';

class FuelSelectScreen extends ConsumerWidget {
  const FuelSelectScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final prefs = ref.watch(searchPrefsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Welche Sorte tankst du?')),
      body: ListView(
        children: [
          for (final f in const ['E5', 'E10', 'DIESEL'])
            RadioListTile<String>(
              value: f,
              groupValue: prefs.fuelType,
              title: Text(f),
              onChanged: (v) {
                if (v == null) return;
                ref.read(searchPrefsProvider.notifier).update((s) => s.copyWith(fuelType: v));
              },
            ),
          const SizedBox(height: 12),
          Padding(
            padding: const EdgeInsets.all(16),
            child: FilledButton(
              onPressed: () => context.go('/vehicle-setup'),
              child: const Text('Weiter'),
            ),
          ),
        ],
      ),
    );
  }
}
