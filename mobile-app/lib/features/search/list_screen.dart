import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/repositories/stations_repository.dart';
import '../../core/services/location_service.dart';
import '../../core/state/search_state.dart';

class ListScreen extends ConsumerStatefulWidget {
  const ListScreen({super.key});
  @override
  ConsumerState<ListScreen> createState() => _S();
}

class _S extends ConsumerState<ListScreen> {
  late Future<StationSearchResult> _f = _load();

  Future<StationSearchResult> _load() async {
    final pos = await ref.read(locationServiceProvider).currentPosition();
    if (pos == null) {
      throw Exception('Standort nicht verfügbar');
    }
    final prefs = ref.read(searchPrefsProvider);
    return ref.read(stationsRepositoryProvider).search(
          lat: pos.latitude, lng: pos.longitude,
          radiusKm: prefs.radiusKm, fuelType: prefs.fuelType,
          onlyOpen: prefs.onlyOpen, sort: 'price',
        );
  }

  @override
  Widget build(BuildContext context) {
    final fuel = ref.watch(searchPrefsProvider).fuelType;
    return Scaffold(
      appBar: AppBar(title: const Text('Tankstellen-Liste')),
      body: FutureBuilder<StationSearchResult>(
        future: _f,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError) {
            return Center(child: Text('Fehler: ${snap.error}'));
          }
          final stations = snap.data!.stations;
          if (stations.isEmpty) {
            return const Center(child: Text('Keine Tankstellen gefunden.'));
          }
          return RefreshIndicator(
            onRefresh: () async {
              setState(() {
                _f = _load();
              });
            },
            child: ListView.builder(
              itemCount: stations.length + 1,
              itemBuilder: (context, i) {
                if (i == 0) {
                  return Padding(
                    padding: const EdgeInsets.all(12),
                    child: Text('Datenquelle: ${snap.data!.attribution}', style: const TextStyle(fontSize: 11)),
                  );
                }
                final s = stations[i - 1];
                final price = s.prices.forFuel(fuel);
                return Card(
                  child: ListTile(
                    title: Text('${s.brand} · ${s.name}'),
                    subtitle: Text('${s.address.formatted()}\n${s.distanceKm?.toStringAsFixed(1) ?? '?'} km · ${s.isOpen ? 'geöffnet' : 'geschlossen'}'),
                    isThreeLine: true,
                    trailing: Text(price != null ? '${price.toStringAsFixed(3).replaceAll('.', ',')} €' : '–',
                        style: const TextStyle(fontWeight: FontWeight.bold),),
                    onTap: () => GoRouter.of(context).push('/station/${s.id}'),
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
