import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/api_client.dart';
import '../../core/state/search_state.dart';
import '../auth/auth_repository.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  /// DSGVO-Datenexport (Art. 20): holt GET /auth/me/export und zeigt das
  /// JSON in einem kopierbaren Dialog an (kein Share-Paket im Projekt).
  Future<void> _exportData(BuildContext context, WidgetRef ref) async {
    final messenger = ScaffoldMessenger.of(context);
    if (!await ref.read(authRepositoryProvider).isAuthenticated()) {
      messenger.showSnackBar(
        const SnackBar(content: Text('Login erforderlich, um deine Daten zu exportieren.')),
      );
      return;
    }
    try {
      final res = await ref.read(apiClientProvider).get('/auth/me/export');
      final json = const JsonEncoder.withIndent('  ').convert(res.data);
      if (!context.mounted) return;
      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Meine Daten'),
          content: SingleChildScrollView(child: SelectableText(json)),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Schließen'),
            ),
          ],
        ),
      );
    } catch (e) {
      messenger.showSnackBar(SnackBar(content: Text('Export fehlgeschlagen: $e')));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final p = ref.watch(searchPrefsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Einstellungen')),
      body: ListView(
        children: [
          ListTile(
            title: const Text('Standardsorte'),
            subtitle: Text(p.fuelType),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/fuel-select'),
          ),
          ListTile(
            title: const Text('Verbrauch & Tankmenge'),
            subtitle: Text('${p.consumption.toStringAsFixed(1)} l/100 km · ${p.tankLiters.toStringAsFixed(0)} l'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/vehicle-setup'),
          ),
          ListTile(
            title: const Text('Fahrzeuge'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/vehicles'),
          ),
          ListTile(
            title: const Text('Meine Wege'),
            subtitle: const Text('Heimweg / Arbeitsweg — Tankstellen entlang Route'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/saved-routes'),
          ),
          ListTile(
            title: const Text('Autobahn-Check'),
            subtitle: const Text('Lohnt sich die nächste Abfahrt?'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/highway'),
          ),
          const Divider(),
          ListTile(
            title: const Text('Premium'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/premium'),
          ),
          ListTile(
            title: const Text('TankLotse für Firmen'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/b2b'),
          ),
          const Divider(),
          ListTile(
            title: const Text('Datenschutz'),
            onTap: () => context.push('/legal/privacy'),
          ),
          ListTile(
            title: const Text('Impressum'),
            onTap: () => context.push('/legal/imprint'),
          ),
          ListTile(
            title: const Text('Datenquelle'),
            onTap: () => context.push('/legal/data-source'),
          ),
          const Divider(),
          ListTile(
            title: const Text('Meine Daten exportieren'),
            subtitle: const Text('DSGVO-Datenexport als JSON'),
            onTap: () => _exportData(context, ref),
          ),
          ListTile(
            title: const Text('Konto löschen'),
            textColor: Colors.red,
            onTap: () => context.push('/account/delete'),
          ),
          ListTile(
            title: const Text('Abmelden'),
            onTap: () async {
              await ref.read(authRepositoryProvider).logout();
              if (context.mounted) context.go('/login');
            },
          ),
        ],
      ),
    );
  }
}
