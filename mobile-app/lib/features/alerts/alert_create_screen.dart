import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/api_client.dart';
import '../../core/services/location_service.dart';
import '../../core/services/push_service.dart';
import '../../core/state/search_state.dart';
import '../../shared/widgets/tank_amount_selector.dart';

class AlertCreateScreen extends ConsumerStatefulWidget {
  const AlertCreateScreen({super.key, this.stationId});

  /// Optional: Alarm fuer genau diese Tankstelle (statt Umkreis um den
  /// eigenen Standort). Kommt aus der Stationsdetail-Seite.
  final String? stationId;

  @override
  ConsumerState<AlertCreateScreen> createState() => _S();
}

class _S extends ConsumerState<AlertCreateScreen> {
  late String fuelType = ref.read(searchPrefsProvider).fuelType;
  String alertType = 'MAX_PRICE';
  double maxPrice = 1.6;
  double radius = 5;
  double minRealSaving = 5.0;
  double maxExtraDistance = 5.0;
  late double tankLiters = ref.read(searchPrefsProvider).tankLiters;
  late double consumption = ref.read(searchPrefsProvider).consumption;
  Set<int> days = {1, 2, 3, 4, 5, 6, 7};
  bool _busy = false;
  String? _error;

  Future<void> _save() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      // Backend-Kontrakt: ENTWEDER stationId ODER (lat, lng, radiusKm).
      final Map<String, dynamic> base;
      if (widget.stationId != null) {
        base = {
          'alertType': alertType,
          'fuelType': fuelType,
          'stationId': widget.stationId,
          'daysOfWeek': days.toList()..sort(),
        };
      } else {
        final pos = await ref.read(locationServiceProvider).currentPosition();
        if (pos == null) {
          setState(() {
            _error = 'Kein Standort verfügbar. Bitte Standort freigeben '
                'oder den Alarm von einer Tankstelle aus erstellen.';
            _busy = false;
          });
          return;
        }
        base = {
          'alertType': alertType,
          'fuelType': fuelType,
          'lat': pos.latitude,
          'lng': pos.longitude,
          'radiusKm': radius,
          'daysOfWeek': days.toList()..sort(),
        };
      }
      Map<String, dynamic> data;
      if (alertType == 'MAX_PRICE') {
        data = {...base, 'maxPrice': maxPrice};
      } else {
        data = {
          ...base,
          'minRealSavingEur': minRealSaving,
          'tankLiters': tankLiters,
          'consumptionLPer100Km': consumption,
          'maxExtraDistanceKm': maxExtraDistance,
          'onlyOpen': true,
        };
      }
      await ref.read(apiClientProvider).post('/alerts', data: data);
      // Ohne registrierten Push-Token kann das Backend den Alarm nie
      // zustellen — daher hier (fire-and-forget) registrieren. Schluckt
      // Fehler intern, blockiert das Speichern nicht.
      unawaited(ref.read(pushServiceProvider).registerForCurrentUser());
      if (!mounted) return;
      context.pop();
    } catch (e) {
      setState(() => _error = 'Fehler: $e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Preisalarm anlegen')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'MAX_PRICE', label: Text('Preisalarm'), icon: Icon(Icons.euro)),
              ButtonSegment(value: 'REAL_SAVING', label: Text('Ersparnis'), icon: Icon(Icons.savings)),
            ],
            selected: {alertType},
            onSelectionChanged: (s) => setState(() => alertType = s.first),
          ),
          const SizedBox(height: 16),
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
          const SizedBox(height: 16),
          if (alertType == 'MAX_PRICE') ...[
            Text('Max. Preis: ${maxPrice.toStringAsFixed(3).replaceAll('.', ',')} €/L'),
            Slider(
              value: maxPrice,
              min: 1.0,
              max: 2.5,
              divisions: 150,
              onChanged: (v) => setState(() => maxPrice = v),
            ),
          ] else ...[
            Text('Mindest-Ersparnis: ${minRealSaving.toStringAsFixed(2).replaceAll('.', ',')} €'),
            Slider(
              value: minRealSaving,
              min: 1.0,
              max: 30.0,
              divisions: 58,
              onChanged: (v) => setState(() => minRealSaving = v),
            ),
            const SizedBox(height: 8),
            Text('Max. Umweg: ${maxExtraDistance.toStringAsFixed(0)} km'),
            Slider(
              value: maxExtraDistance,
              min: 0.5,
              max: 15,
              divisions: 29,
              onChanged: (v) => setState(() => maxExtraDistance = v),
            ),
            const SizedBox(height: 12),
            TankAmountSelector(value: tankLiters, onChanged: (v) => setState(() => tankLiters = v)),
            const SizedBox(height: 12),
            Text('Verbrauch: ${consumption.toStringAsFixed(1)} l/100 km'),
            Slider(
              value: consumption,
              min: 3,
              max: 18,
              divisions: 30,
              onChanged: (v) => setState(() => consumption = v),
            ),
          ],
          const SizedBox(height: 12),
          if (widget.stationId != null)
            // Stationsgebundener Alarm: kein Suchradius noetig.
            const Text('Alarm gilt für die ausgewählte Tankstelle.')
          else ...[
            Text('Suchradius: ${radius.toStringAsFixed(0)} km'),
            Slider(
              value: radius,
              min: 1,
              max: 25,
              divisions: 24,
              onChanged: (v) => setState(() => radius = v),
            ),
          ],
          const SizedBox(height: 12),
          const Text('Wochentage'),
          Wrap(
            spacing: 6,
            children: List.generate(7, (i) {
              final d = i + 1;
              final on = days.contains(d);
              const labels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
              return ChoiceChip(
                selected: on,
                label: Text(labels[i]),
                onSelected: (sel) => setState(() => sel ? days.add(d) : days.remove(d)),
              );
            }),
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: Colors.red)),
          ],
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _busy ? null : _save,
            child: const Text('Speichern'),
          ),
        ],
      ),
    );
  }
}
