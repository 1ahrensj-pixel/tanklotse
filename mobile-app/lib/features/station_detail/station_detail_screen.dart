import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/repositories/stations_repository.dart';

class StationDetailScreen extends ConsumerStatefulWidget {
  const StationDetailScreen({super.key, required this.stationId});
  final String stationId;

  @override
  ConsumerState<StationDetailScreen> createState() => _S();
}

class _S extends ConsumerState<StationDetailScreen> {
  late final Future<Map<String, dynamic>> _f =
      ref.read(stationsRepositoryProvider).detail(widget.stationId);
  bool? _isFavorite;
  bool _favBusy = false;

  @override
  void initState() {
    super.initState();
    _checkFavorite();
  }

  Future<void> _checkFavorite() async {
    try {
      final list = await ref.read(favoritesRepositoryProvider).list();
      if (!mounted) return;
      setState(() => _isFavorite = list.any((e) => e['stationId'] == widget.stationId));
    } on DioException {
      if (mounted) setState(() => _isFavorite = null);
    }
  }

  Future<void> _toggleFavorite(String name) async {
    if (_isFavorite == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Login erforderlich, um Favoriten zu speichern.')),
      );
      return;
    }
    setState(() => _favBusy = true);
    try {
      final repo = ref.read(favoritesRepositoryProvider);
      if (_isFavorite!) {
        await repo.remove(widget.stationId);
      } else {
        await repo.add(widget.stationId, name);
      }
      if (!mounted) return;
      setState(() => _isFavorite = !_isFavorite!);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Fehler: $e')));
      }
    } finally {
      if (mounted) setState(() => _favBusy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tankstelle'),
        actions: [
          IconButton(
            icon: Icon(
              _isFavorite == true ? Icons.star : Icons.star_outline,
              color: _isFavorite == true ? Colors.amber : null,
            ),
            tooltip: _isFavorite == true ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen',
            onPressed: _favBusy
                ? null
                : () async {
                    final data = await _f;
                    final s = data['station'] as Map<String, dynamic>;
                    await _toggleFavorite('${s['brand']} · ${s['name']}');
                  },
          ),
        ],
      ),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _f,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError) return Center(child: Text('Fehler: ${snap.error}'));
          final s = snap.data!['station'] as Map<String, dynamic>;
          final attribution = snap.data!['attribution'] as String;
          final prices = (s['prices'] ?? {}) as Map<String, dynamic>;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text('${s['brand']} · ${s['name']}', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 4),
              Text('${s['street']} ${s['houseNumber'] ?? ''}, ${s['postCode']} ${s['place']}'),
              const SizedBox(height: 16),
              _PriceRow('E5', prices['e5']),
              _PriceRow('E10', prices['e10']),
              _PriceRow('Diesel', prices['diesel']),
              const SizedBox(height: 12),
              Wrap(spacing: 8, children: [
                Chip(label: Text(s['isOpen'] == true ? 'geöffnet' : 'geschlossen')),
                if (s['lastUpdated'] != null) Chip(label: Text('aktualisiert ${s['lastUpdated']}')),
              ],),
              const SizedBox(height: 16),
              Wrap(spacing: 8, runSpacing: 4, children: [
                FilledButton.icon(
                  onPressed: () async {
                    final uri = Uri.parse(
                        'https://www.google.com/maps/dir/?api=1&destination=${s['lat']},${s['lng']}',);
                    if (await canLaunchUrl(uri)) {
                      await launchUrl(uri, mode: LaunchMode.externalApplication);
                    }
                  },
                  icon: const Icon(Icons.navigation),
                  label: const Text('Navigieren'),
                ),
                OutlinedButton.icon(
                  // Stationskontext mitgeben — der Alarm gilt dann fuer genau
                  // diese Tankstelle und braucht keinen Standort (lat/lng).
                  onPressed: () => context.push('/alerts/new?stationId=${widget.stationId}'),
                  icon: const Icon(Icons.notifications_outlined),
                  label: const Text('Preisalarm'),
                ),
                OutlinedButton.icon(
                  onPressed: () => context.push('/station/${widget.stationId}/complaint'),
                  icon: const Icon(Icons.report_outlined),
                  label: const Text('Fehler melden'),
                ),
              ],),
              const SizedBox(height: 24),
              Text('Datenquelle: $attribution', style: const TextStyle(fontSize: 11)),
            ],
          );
        },
      ),
    );
  }
}

class _PriceRow extends StatelessWidget {
  const _PriceRow(this.label, this.value);
  final String label;
  final dynamic value;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(children: [
        Expanded(child: Text(label)),
        Text(value is num ? '${(value as num).toStringAsFixed(3).replaceAll('.', ',')} €' : '–',
            style: const TextStyle(fontWeight: FontWeight.bold),),
      ],),
    );
  }
}
