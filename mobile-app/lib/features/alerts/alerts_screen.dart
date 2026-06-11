import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/api_client.dart';

class AlertsScreen extends ConsumerStatefulWidget {
  const AlertsScreen({super.key});

  @override
  ConsumerState<AlertsScreen> createState() => _S();
}

class _S extends ConsumerState<AlertsScreen> {
  late Future<List<Map<String, dynamic>>> _f = _load();

  Future<List<Map<String, dynamic>>> _load() async {
    try {
      final res = await ref.read(apiClientProvider).get('/alerts');
      return (res.data as List).cast<Map<String, dynamic>>();
    } on DioException {
      return const [];
    }
  }

  /// PUT /alerts/:id — Alarm aktivieren/pausieren, ohne ihn zu löschen.
  Future<void> _setActive(String id, bool active) async {
    try {
      await ref.read(apiClientProvider).put('/alerts/$id', data: {'active': active});
    } on DioException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Fehler: ${e.message ?? e}')),
      );
    }
    // Block-Body statt Arrow: setState darf kein Future zurueckgeben.
    if (mounted) {
      setState(() {
        _f = _load();
      });
    }
  }

  /// DELETE /alerts/:id mit Bestätigungs-Dialog (analog saved_routes_screen).
  Future<void> _delete(Map<String, dynamic> a) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Preisalarm löschen?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Abbrechen')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Löschen')),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ref.read(apiClientProvider).delete('/alerts/${a['id']}');
    } on DioException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Fehler: ${e.message ?? e}')),
      );
    }
    // Block-Body statt Arrow: setState darf kein Future zurueckgeben.
    if (mounted) {
      setState(() {
        _f = _load();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Preisalarme')),
      floatingActionButton: FloatingActionButton.extended(
        icon: const Icon(Icons.add),
        label: const Text('Neu'),
        onPressed: () => context.push('/alerts/new'),
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _f,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final items = snap.data ?? const [];
          if (items.isEmpty) {
            return const Center(child: Padding(
              padding: EdgeInsets.all(24),
              child: Text('Noch keine Preisalarme. Tippe „Neu“, um einen zu erstellen.', textAlign: TextAlign.center),
            ),);
          }
          return RefreshIndicator(
            onRefresh: () async => setState(() {
              _f = _load();
            }),
            child: ListView.builder(
              itemCount: items.length,
              itemBuilder: (context, i) {
                final a = items[i];
                return Card(
                  child: ListTile(
                    title: Text('${a['fuelType']} ≤ ${a['maxPrice']} €'),
                    subtitle: Text(a['active'] == true ? 'aktiv' : 'inaktiv'),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Switch(
                          value: a['active'] == true,
                          onChanged: (v) => _setActive(a['id'] as String, v),
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete_outline),
                          onPressed: () => _delete(a),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
