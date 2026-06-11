import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class ErrorScreen extends StatelessWidget {
  const ErrorScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Etwas ging schief')),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off, size: 56),
            const SizedBox(height: 12),
            const Text('Verbindung verloren oder Server nicht erreichbar.'),
            const SizedBox(height: 12),
            FilledButton(onPressed: () => context.go('/home'), child: const Text('Zur Suche')),
          ],
        ),
      ),
    );
  }
}
