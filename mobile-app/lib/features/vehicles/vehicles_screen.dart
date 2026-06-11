import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/repositories/stations_repository.dart';

class VehiclesScreen extends ConsumerStatefulWidget {
  const VehiclesScreen({super.key});
  @override
  ConsumerState<VehiclesScreen> createState() => _S();
}

class _S extends ConsumerState<VehiclesScreen> {
  late Future<List<Map<String, dynamic>>> _f = _load();

  Future<List<Map<String, dynamic>>> _load() {
    return ref.read(vehiclesRepositoryProvider).list();
  }

  Future<void> _add() async {
    final created = await showDialog<bool>(
      context: context,
      builder: (_) => const _VehicleDialog(),
    );
    if (created == true && mounted) {
      setState(() {
        _f = _load();
      });
    }
  }

  Future<void> _delete(String id) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Löschen?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Abbrechen')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Löschen')),
        ],
      ),
    );
    if (ok == true) {
      await ref.read(vehiclesRepositoryProvider).remove(id);
      if (mounted) {
        setState(() {
          _f = _load();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Fahrzeuge')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _add,
        icon: const Icon(Icons.add),
        label: const Text('Neu'),
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _f,
        builder: (context, snap) {
          if (!snap.hasData) {
            if (snap.hasError) return Center(child: Text('Fehler: ${snap.error}'));
            return const Center(child: CircularProgressIndicator());
          }
          final list = snap.data!;
          if (list.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'Noch keine Fahrzeuge angelegt. Tippe auf „Neu“, um eines hinzuzufügen.',
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () async {
              setState(() {
                _f = _load();
              });
            },
            child: ListView(
              children: [
                for (final v in list)
                  Card(
                    child: ListTile(
                      title: Text(v['name'] as String),
                      subtitle: Text(
                        '${v['fuelType']} · ${v['consumptionLPer100Km']} l/100km · ${v['typicalTankLiters']} l',
                      ),
                      trailing: Wrap(
                        spacing: 4,
                        children: [
                          if (v['isDefault'] == true) const Chip(label: Text('Standard')),
                          IconButton(
                            icon: const Icon(Icons.delete_outline),
                            onPressed: () => _delete(v['id'] as String),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _VehicleDialog extends ConsumerStatefulWidget {
  const _VehicleDialog();
  @override
  ConsumerState<_VehicleDialog> createState() => _VehicleDialogState();
}

class _VehicleDialogState extends ConsumerState<_VehicleDialog> {
  final _name = TextEditingController();
  String fuelType = 'DIESEL';
  double consumption = 7.5;
  double tankLiters = 50;
  bool isDefault = false;
  bool _busy = false;

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Neues Fahrzeug'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: _name, decoration: const InputDecoration(labelText: 'Name')),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: fuelType,
              items: const [
                DropdownMenuItem(value: 'E5', child: Text('E5')),
                DropdownMenuItem(value: 'E10', child: Text('E10')),
                DropdownMenuItem(value: 'DIESEL', child: Text('Diesel')),
              ],
              onChanged: (v) => setState(() => fuelType = v!),
              decoration: const InputDecoration(labelText: 'Sorte'),
            ),
            const SizedBox(height: 12),
            Text('Verbrauch: ${consumption.toStringAsFixed(1)} l/100 km'),
            Slider(
              value: consumption,
              min: 3,
              max: 15,
              divisions: 24,
              onChanged: (v) => setState(() => consumption = v),
            ),
            Text('Tankmenge: ${tankLiters.toStringAsFixed(0)} l'),
            Slider(
              value: tankLiters,
              min: 10,
              max: 120,
              divisions: 22,
              onChanged: (v) => setState(() => tankLiters = v),
            ),
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              value: isDefault,
              onChanged: (v) => setState(() => isDefault = v ?? false),
              title: const Text('Standardfahrzeug'),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Abbrechen')),
        FilledButton(
          onPressed: _busy
              ? null
              : () async {
                  if (_name.text.trim().isEmpty) return;
                  setState(() => _busy = true);
                  final messenger = ScaffoldMessenger.of(context);
                  final navigator = Navigator.of(context);
                  try {
                    await ref.read(vehiclesRepositoryProvider).create(
                          name: _name.text.trim(),
                          fuelType: fuelType,
                          consumption: consumption,
                          tankLiters: tankLiters,
                          isDefault: isDefault,
                        );
                    if (mounted) navigator.pop(true);
                  } catch (e) {
                    if (mounted) {
                      messenger.showSnackBar(SnackBar(content: Text('Fehler: $e')));
                    }
                  } finally {
                    if (mounted) setState(() => _busy = false);
                  }
                },
          child: const Text('Speichern'),
        ),
      ],
    );
  }
}
