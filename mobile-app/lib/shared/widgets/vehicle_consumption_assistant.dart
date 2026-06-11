import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Verbrauchs-Assistent (USP §8): hilft Nutzern, die ihren Verbrauch nicht
/// kennen. Schritt 1: Klasse waehlen, Schritt 2: Fahrprofil, Schritt 3:
/// Vorschlagswert mit Override-Moeglichkeit.
class VehicleConsumptionAssistant extends ConsumerStatefulWidget {
  const VehicleConsumptionAssistant({
    super.key,
    required this.onResult,
    this.initialConsumption,
  });

  /// Wird aufgerufen wenn der Nutzer auf "Übernehmen" klickt.
  final void Function(double consumptionLPer100Km, String? vehicleClass, String? drivingProfile) onResult;
  final double? initialConsumption;

  @override
  ConsumerState<VehicleConsumptionAssistant> createState() => _State();

  /// Hilfsfunktion: zeigt das Widget als Bottom-Sheet.
  static Future<void> show(
    BuildContext context, {
    required void Function(double consumption, String? vehicleClass, String? drivingProfile) onResult,
    double? initialConsumption,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (_) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: VehicleConsumptionAssistant(
          onResult: onResult,
          initialConsumption: initialConsumption,
        ),
      ),
    );
  }
}

class _State extends ConsumerState<VehicleConsumptionAssistant> {
  String? _selectedClass;
  String _selectedProfile = 'mixed';
  double? _suggestedConsumption;
  late double _finalConsumption = widget.initialConsumption ?? 7.5;
  bool _busy = false;

  // Backend-Replikation der Klassen — ohne Auth-/Netz-Abhaengigkeit, da der
  // Nutzer evtl. noch nicht eingeloggt ist (z. B. im Onboarding).
  static const _classes = [
    {'id': 'compact_small', 'label': 'Kleinwagen', 'baseConsumption': 5.5},
    {'id': 'compact', 'label': 'Kompaktwagen', 'baseConsumption': 6.5},
    {'id': 'midsize', 'label': 'Kombi / Mittelklasse', 'baseConsumption': 7.5},
    {'id': 'suv', 'label': 'SUV', 'baseConsumption': 9.5},
    {'id': 'van', 'label': 'Transporter', 'baseConsumption': 11.5},
    {'id': 'rv', 'label': 'Wohnmobil / großes Fahrzeug', 'baseConsumption': 13.5},
  ];

  static const _profiles = [
    {'id': 'city', 'label': 'Viel Stadtverkehr', 'factor': 1.15},
    {'id': 'mixed', 'label': 'Gemischt', 'factor': 1.0},
    {'id': 'highway', 'label': 'Viel Autobahn', 'factor': 0.92},
  ];

  void _recompute() {
    if (_selectedClass == null) return;
    final cls = _classes.firstWhere((c) => c['id'] == _selectedClass);
    final prof = _profiles.firstWhere((p) => p['id'] == _selectedProfile);
    final raw = (cls['baseConsumption'] as double) * (prof['factor'] as double);
    _suggestedConsumption = (raw * 10).round() / 10;
    _finalConsumption = _suggestedConsumption!;
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Verbrauchs-Assistent', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 4),
          const Text(
            'Wir schätzen einen realistischen Verbrauch — du kannst ihn jederzeit anpassen.',
            style: TextStyle(fontSize: 12),
          ),
          const SizedBox(height: 16),
          const Text('Fahrzeugklasse'),
          const SizedBox(height: 6),
          Wrap(
            spacing: 6,
            children: [
              for (final c in _classes)
                ChoiceChip(
                  selected: _selectedClass == c['id'],
                  label: Text(c['label'] as String),
                  onSelected: (_) => setState(() {
                    _selectedClass = c['id'] as String;
                    _recompute();
                  }),
                ),
            ],
          ),
          const SizedBox(height: 12),
          const Text('Fahrprofil'),
          const SizedBox(height: 6),
          Wrap(
            spacing: 6,
            children: [
              for (final p in _profiles)
                ChoiceChip(
                  selected: _selectedProfile == p['id'],
                  label: Text(p['label'] as String),
                  onSelected: (_) => setState(() {
                    _selectedProfile = p['id'] as String;
                    _recompute();
                  }),
                ),
            ],
          ),
          const SizedBox(height: 16),
          if (_suggestedConsumption != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primaryContainer.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Vorschlag: ${_suggestedConsumption!.toStringAsFixed(1)} l / 100 km',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Schätzwert. Du kannst ihn überschreiben.',
                    style: TextStyle(fontSize: 11),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Text('Verbrauch: ${_finalConsumption.toStringAsFixed(1)} l/100 km'),
            Slider(
              value: _finalConsumption,
              min: 3,
              max: 18,
              divisions: 30,
              label: _finalConsumption.toStringAsFixed(1),
              onChanged: (v) => setState(() => _finalConsumption = v),
            ),
          ],
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Abbrechen'),
              ),
              const SizedBox(width: 8),
              FilledButton(
                onPressed: _busy || _selectedClass == null
                    ? null
                    : () {
                        setState(() => _busy = true);
                        widget.onResult(_finalConsumption, _selectedClass, _selectedProfile);
                        Navigator.pop(context);
                      },
                child: const Text('Übernehmen'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
