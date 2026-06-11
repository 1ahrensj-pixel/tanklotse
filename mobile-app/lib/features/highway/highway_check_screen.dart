import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/repositories/stations_repository.dart';
import '../../core/services/location_service.dart';
import '../../core/state/search_state.dart';

class HighwayCheckScreen extends ConsumerStatefulWidget {
  const HighwayCheckScreen({super.key});
  @override
  ConsumerState<HighwayCheckScreen> createState() => _S();
}

class _S extends ConsumerState<HighwayCheckScreen> {
  bool _busy = false;
  String? _error;
  Map<String, dynamic>? _result;

  Future<void> _run() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final pos = await ref.read(locationServiceProvider).currentPosition();
      if (pos == null) {
        setState(() {
          _busy = false;
          _error = 'Standort nicht verfügbar.';
        });
        return;
      }
      final prefs = ref.read(searchPrefsProvider);
      final r = await ref.read(highwayRepositoryProvider).exitCheck(
            currentLat: pos.latitude,
            currentLng: pos.longitude,
            fuelType: prefs.fuelType,
            tankLiters: prefs.tankLiters,
            consumptionLPer100Km: prefs.consumption,
            maxExitDetourKm: 5,
          );
      setState(() {
        _result = r;
        _busy = false;
      });
    } catch (e) {
      setState(() {
        _busy = false;
        _error = e.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Autobahn-Check')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text(
            'Lohnt sich die nächste Abfahrt zum Tanken? Wir vergleichen Autobahn-Preis mit Tankstellen abseits der Strecke und rechnen die Umwegkosten dazu.',
          ),
          const SizedBox(height: 16),
          if (_busy) const Center(child: CircularProgressIndicator()),
          if (_error != null) Text(_error!, style: const TextStyle(color: Colors.red)),
          if (_result != null) _buildResult(_result!),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: _busy ? null : _run,
            icon: const Icon(Icons.search),
            label: const Text('Jetzt prüfen'),
          ),
        ],
      ),
    );
  }

  Widget _buildResult(Map<String, dynamic> r) {
    final status = r['status'] as String;
    if (status == 'PREPARED') {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(Icons.construction),
                  SizedBox(width: 8),
                  Text(
                    'Autobahn-Check vorbereitet',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(r['message'] as String, style: const TextStyle(fontSize: 13)),
              const SizedBox(height: 8),
              const Text(
                'Sobald ein Routenanalyse-Provider eingebunden ist, zeigt TankLotse hier konkrete Empfehlungen mit echter Ersparnis.',
                style: TextStyle(fontSize: 12),
              ),
            ],
          ),
        ),
      );
    }
    if (status == 'NOT_FOUND') {
      return const Card(
        child: ListTile(
          leading: Icon(Icons.search_off),
          title: Text('Keine Tankstellen im Abfahrt-Radius gefunden.'),
        ),
      );
    }
    final recs = (r['recommendations'] as List?)?.cast<Map<String, dynamic>>() ?? const [];
    if (recs.isEmpty) {
      return const Card(child: ListTile(title: Text('Keine Empfehlungen.')));
    }
    return Column(
      children: [
        for (final rec in recs)
          Card(
            child: ListTile(
              title: Text('${rec['brand']} · ${rec['stationName']}'),
              subtitle: Text(
                'Preis ${(rec['pricePerLiter'] as num).toStringAsFixed(3).replaceAll('.', ',')} € · '
                'Umweg ${(rec['exitDetourKm'] as num).toStringAsFixed(1)} km · '
                'Reale Ersparnis ${(rec['realSavingEuro'] as num).toStringAsFixed(2).replaceAll('.', ',')} €',
              ),
              trailing: Chip(label: Text(_short(rec['recommendation'] as String))),
            ),
          ),
      ],
    );
  }

  static String _short(String r) {
    switch (r) {
      case 'LOHNT_SICH':
        return 'Lohnt';
      case 'LOHNT_SICH_KNAPP':
        return 'Knapp';
      case 'NUR_WENN_AUF_ROUTE':
        return 'Nur Route';
      case 'ERST_AB_X_LITERN':
        return 'Mehr l';
      default:
        return 'Nein';
    }
  }
}
