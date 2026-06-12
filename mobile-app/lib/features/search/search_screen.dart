import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/models/recommendation.dart';
import '../../core/models/station.dart';
import '../../core/repositories/stations_repository.dart';
import '../../core/services/location_service.dart';
import '../../core/state/search_state.dart';
import '../../shared/widgets/best_decision_card.dart';
import '../../shared/widgets/offline_banner.dart';
import '../../shared/widgets/tank_amount_selector.dart';
import 'recommendation_card.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  bool _busy = false;
  String? _error;
  List<Station> _stations = const [];
  List<Recommendation> _recs = const [];
  String _attribution = '';

  // Manuelle Suche
  final _placeCtrl = TextEditingController();
  Timer? _debounce;
  List<GeoSearchResult> _placeSuggestions = const [];
  GeoSearchResult? _selectedPlace;

  @override
  void dispose() {
    _placeCtrl.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onPlaceTextChanged(String text) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () async {
      if (text.trim().length < 2) {
        if (mounted) setState(() => _placeSuggestions = const []);
        return;
      }
      try {
        final results = await ref.read(geoRepositoryProvider).search(text);
        if (mounted) setState(() => _placeSuggestions = results);
      } catch (_) {
        if (mounted) setState(() => _placeSuggestions = const []);
      }
    });
  }

  void _selectPlace(GeoSearchResult r) {
    setState(() {
      _selectedPlace = r;
      _placeCtrl.text = r.label;
      _placeSuggestions = const [];
    });
    _runSearchAt(r.lat, r.lng);
  }

  Future<void> _runSearch() async {
    if (_selectedPlace != null) {
      await _runSearchAt(_selectedPlace!.lat, _selectedPlace!.lng);
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    final pos = await ref.read(locationServiceProvider).currentPosition();
    if (pos == null) {
      setState(() {
        _busy = false;
        _error = 'Standort nicht verfügbar — bitte oben einen Ort eingeben.';
      });
      return;
    }
    await _runSearchAt(pos.latitude, pos.longitude);
  }

  Future<void> _runSearchAt(double lat, double lng) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final prefs = ref.read(searchPrefsProvider);
      final repo = ref.read(stationsRepositoryProvider);

      final res = await repo.search(
        lat: lat,
        lng: lng,
        radiusKm: prefs.radiusKm,
        fuelType: prefs.fuelType,
        onlyOpen: prefs.onlyOpen,
      );
      final recs = await repo.bestStation(
        lat: lat,
        lng: lng,
        radiusKm: prefs.radiusKm,
        fuelType: prefs.fuelType,
        consumption: prefs.consumption,
        tankLiters: prefs.tankLiters,
      );
      if (!mounted) return;
      setState(() {
        _stations = res.stations;
        _recs = recs;
        _attribution = res.attribution;
        _busy = false;
      });
      // Ergebnis teilen, damit der Karten-Tab dieselben Stationen am
      // gesuchten Ort anzeigt — ohne erneute (auf Web oft fehlende) GPS-Suche.
      ref.read(lastSearchProvider.notifier).state = LastSearch(
        centerLat: lat,
        centerLng: lng,
        stations: res.stations,
        fuelType: prefs.fuelType,
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _error = 'Fehler: ${e.toString()}';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final prefs = ref.watch(searchPrefsProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Beste Tankstelle finden'),
        actions: [
          IconButton(onPressed: () => context.go('/list'), icon: const Icon(Icons.list)),
        ],
      ),
      body: Column(
        children: [
          const OfflineBanner(),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _runSearch,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Manuelle Ortssuche
                    TextField(
                      controller: _placeCtrl,
                      onChanged: _onPlaceTextChanged,
                      decoration: InputDecoration(
                        labelText: 'Ort, PLZ oder Adresse',
                        prefixIcon: const Icon(Icons.search),
                        suffixIcon: _placeCtrl.text.isEmpty
                            ? null
                            : IconButton(
                                icon: const Icon(Icons.clear),
                                onPressed: () {
                                  setState(() {
                                    _placeCtrl.clear();
                                    _selectedPlace = null;
                                    _placeSuggestions = const [];
                                  });
                                },
                              ),
                      ),
                    ),
                    if (_placeSuggestions.isNotEmpty)
                      ConstrainedBox(
                        constraints: const BoxConstraints(maxHeight: 200),
                        child: ListView.separated(
                          shrinkWrap: true,
                          itemCount: _placeSuggestions.length,
                          separatorBuilder: (_, __) => const Divider(height: 1),
                          itemBuilder: (_, i) {
                            final r = _placeSuggestions[i];
                            return ListTile(
                              dense: true,
                              leading: Icon(_iconFor(r.type)),
                              title: Text(r.label, maxLines: 2, overflow: TextOverflow.ellipsis),
                              onTap: () => _selectPlace(r),
                            );
                          },
                        ),
                      ),
                    OutlinedButton.icon(
                      onPressed: _busy
                          ? null
                          : () async {
                              setState(() {
                                _selectedPlace = null;
                                _placeCtrl.clear();
                                _placeSuggestions = const [];
                              });
                              await _runSearch();
                            },
                      icon: const Icon(Icons.my_location),
                      label: const Text('Meinen Standort verwenden'),
                    ),
                    const Divider(height: 24),
                    const Text('Sorte', style: TextStyle(fontSize: 12)),
                    SegmentedButton<String>(
                      segments: const [
                        ButtonSegment(value: 'E5', label: Text('E5')),
                        ButtonSegment(value: 'E10', label: Text('E10')),
                        ButtonSegment(value: 'DIESEL', label: Text('Diesel')),
                      ],
                      selected: {prefs.fuelType},
                      onSelectionChanged: (s) {
                        ref.read(searchPrefsProvider.notifier).update((p) => p.copyWith(fuelType: s.first));
                      },
                    ),
                    const SizedBox(height: 12),
                    TankAmountSelector(
                      value: prefs.tankLiters,
                      onChanged: (v) => ref
                          .read(searchPrefsProvider.notifier)
                          .update((p) => p.copyWith(tankLiters: v)),
                    ),
                    const SizedBox(height: 12),
                    Text('Radius: ${prefs.radiusKm.toStringAsFixed(0)} km'),
                    Slider(
                      value: prefs.radiusKm,
                      min: 1,
                      max: 25,
                      divisions: 24,
                      onChanged: (v) => ref.read(searchPrefsProvider.notifier).update((p) => p.copyWith(radiusKm: v)),
                    ),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Nur geöffnete Stationen'),
                      value: prefs.onlyOpen,
                      onChanged: (v) => ref.read(searchPrefsProvider.notifier).update((p) => p.copyWith(onlyOpen: v)),
                    ),
                    FilledButton.icon(
                      onPressed: _busy ? null : _runSearch,
                      icon: const Icon(Icons.search),
                      label: Text(_selectedPlace != null ? 'Hier suchen' : 'Suchen'),
                    ),
                  ],
                ),
              ),
            ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: Text(_error!, style: const TextStyle(color: Colors.red)),
              ),
            if (_busy) const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator())),
            if (_recs.isNotEmpty) ...[
              const SizedBox(height: 12),
              BestDecisionCard(
                stationId: _recs.first.station.id,
                stationLabel: '${_recs.first.station.brand} · ${_recs.first.station.name}',
                fuelType: prefs.fuelType,
                targetPrice: _recs.first.price,
                distanceKm: _recs.first.distanceKm,
                tankLiters: prefs.tankLiters,
                consumption: prefs.consumption,
                grossSavingEuro: _recs.first.priceAdvantageEur,
                detourCostEuro: _recs.first.detourFuelCostEur,
                realSavingEuro: _recs.first.realSavingsEur,
                breakEvenLiters: _recs.first.breakEvenLiters,
                recommendation: _recs.first.verdict.apiValue,
              ),
              if (_recs.length > 1) ...[
                const SizedBox(height: 16),
                Text('Weitere gute Entscheidungen', style: Theme.of(context).textTheme.titleSmall),
                ..._recs.skip(1).take(4).map((r) => RecommendationCard(rec: r, compact: true)),
              ],
            ],
            if (_stations.isNotEmpty) ...[
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      '${_stations.length} Tankstellen gefunden',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                  OutlinedButton.icon(
                    onPressed: () => context.go('/map'),
                    icon: const Icon(Icons.map_outlined, size: 18),
                    label: const Text('Auf Karte'),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              ..._stations.map((s) {
                final price = s.prices.forFuel(prefs.fuelType);
                return Card(
                  child: ListTile(
                    title: Text('${s.brand} · ${s.name}'),
                    subtitle: Text(
                      '${s.address.formatted()}\n'
                      '${s.distanceKm?.toStringAsFixed(1) ?? '?'} km · '
                      '${s.isOpen ? 'geöffnet' : 'geschlossen'}',
                    ),
                    isThreeLine: true,
                    trailing: Text(
                      price != null
                          ? '${price.toStringAsFixed(3).replaceAll('.', ',')} €'
                          : '–',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    onTap: () => context.push('/station/${s.id}'),
                  ),
                );
              }),
              const SizedBox(height: 12),
              Text('Datenquelle: $_attribution', style: const TextStyle(fontSize: 11)),
            ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  IconData _iconFor(String type) {
    switch (type) {
      case 'city':
      case 'town':
      case 'village':
        return Icons.location_city;
      case 'postcode':
        return Icons.markunread_mailbox;
      case 'street':
      case 'address':
        return Icons.home;
      default:
        return Icons.place;
    }
  }
}

// PR #23 §3.3: `_RecommendationCard` wurde nach `recommendation_card.dart`
// extrahiert und ist jetzt unter dem Namen `RecommendationCard` importiert.
