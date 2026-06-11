import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/repositories/stations_repository.dart';

class SavedRoutesScreen extends ConsumerStatefulWidget {
  const SavedRoutesScreen({super.key});
  @override
  ConsumerState<SavedRoutesScreen> createState() => _S();
}

class _S extends ConsumerState<SavedRoutesScreen> {
  late Future<List<SavedRoute>> _f = ref.read(savedRoutesRepositoryProvider).list();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Meine Wege')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          await context.push('/saved-routes/new');
          if (mounted) setState(() => _f = ref.read(savedRoutesRepositoryProvider).list());
        },
        icon: const Icon(Icons.add),
        label: const Text('Neu'),
      ),
      body: FutureBuilder<List<SavedRoute>>(
        future: _f,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError) return Center(child: Text('Fehler: ${snap.error}'));
          final list = snap.data ?? const [];
          if (list.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'Noch keine gespeicherten Wege. Lege einen an, um Tankstellen entlang der Strecke zu sehen.',
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }
          return ListView(
            children: [
              for (final r in list)
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.local_gas_station),
                    title: Text(r.name),
                    subtitle: Text('${r.startLabel} → ${r.endLabel}\nMax. Umweg: ${r.maxDetourKm.toStringAsFixed(0)} km · ${r.fuelType}'),
                    isThreeLine: true,
                    // Kernnutzen der Route: Empfehlungen entlang der Strecke
                    // (POST /saved-routes/:id/recommendations).
                    onTap: () => context.push(
                      Uri(
                        path: '/saved-routes/${r.id}/recommendations',
                        queryParameters: {'name': r.name},
                      ).toString(),
                    ),
                    trailing: IconButton(
                      icon: const Icon(Icons.delete_outline),
                      onPressed: () async {
                        final ok = await showDialog<bool>(
                          context: context,
                          builder: (ctx) => AlertDialog(
                            title: Text('Route „${r.name}" löschen?'),
                            actions: [
                              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Abbrechen')),
                              FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Löschen')),
                            ],
                          ),
                        );
                        if (ok == true) {
                          await ref.read(savedRoutesRepositoryProvider).remove(r.id);
                          if (mounted) setState(() => _f = ref.read(savedRoutesRepositoryProvider).list());
                        }
                      },
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}
