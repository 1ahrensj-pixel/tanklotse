import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/services/location_service.dart';

class LocationPermissionScreen extends ConsumerWidget {
  const LocationPermissionScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Standortfreigabe')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Wir benutzen deinen Standort nur für die Tankstellensuche und speichern keine Standorthistorie.',
            ),
            const Spacer(),
            FilledButton(
              onPressed: () async {
                final ok = await ref.read(locationServiceProvider).requestPermission();
                if (!context.mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(ok ? 'Standort erlaubt.' : 'Standort verweigert.')),
                );
                context.go('/fuel-select');
              },
              child: const Text('Standort erlauben'),
            ),
            TextButton(
              onPressed: () => context.go('/fuel-select'),
              child: const Text('Ohne Standort fortfahren'),
            ),
          ],
        ),
      ),
    );
  }
}
