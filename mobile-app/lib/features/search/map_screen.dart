import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart' as geo;
import 'package:go_router/go_router.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/models/station.dart';
import '../../core/repositories/stations_repository.dart';
import '../../core/services/location_service.dart';
import '../../core/state/search_state.dart';
import 'map_markers_helper.dart';

const _mapboxToken = String.fromEnvironment('MAPBOX_PUBLIC_TOKEN', defaultValue: '');

class MapScreen extends ConsumerStatefulWidget {
  const MapScreen({super.key});

  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen> {
  MapMarkersHelper? _markersHelper;
  bool _busy = false;
  String? _error;
  List<Station> _stations = const [];
  final bool _tokenSet = _mapboxToken.isNotEmpty;

  @override
  void initState() {
    super.initState();
    if (_tokenSet) {
      MapboxOptions.setAccessToken(_mapboxToken);
    }
  }

  Future<void> _onMapCreated(MapboxMap map) async {
    final markers = await map.annotations.createPointAnnotationManager();
    _markersHelper = MapMarkersHelper(map: map, markers: markers);
    await _loadStations();
  }

  Future<void> _loadStations() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final pos = await ref.read(locationServiceProvider).currentPosition();
      if (pos == null) {
        setState(() {
          _busy = false;
          _error = 'Standort nicht verfuegbar';
        });
        return;
      }
      final prefs = ref.read(searchPrefsProvider);
      final res = await ref.read(stationsRepositoryProvider).search(
            lat: pos.latitude,
            lng: pos.longitude,
            radiusKm: prefs.radiusKm,
            fuelType: prefs.fuelType,
            onlyOpen: prefs.onlyOpen,
          );
      _stations = res.stations;
      await _renderMarkers(pos);
      if (!mounted) return;
      setState(() => _busy = false);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _error = e.toString();
      });
    }
  }

  Future<void> _renderMarkers(geo.Position pos) async {
    final helper = _markersHelper;
    if (helper == null) return;
    await helper.renderStations(
      stations: _stations,
      fuelType: ref.read(searchPrefsProvider).fuelType,
      center: pos,
    );
  }

  void _showStationSheet(Station s) {
    final fuel = ref.read(searchPrefsProvider).fuelType;
    final price = s.prices.forFuel(fuel);
    showModalBottomSheet<void>(
      context: context,
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('${s.brand} · ${s.name}', style: Theme.of(ctx).textTheme.titleLarge),
            const SizedBox(height: 4),
            Text(s.address.formatted()),
            const SizedBox(height: 8),
            Wrap(spacing: 8, children: [
              Chip(label: Text(price != null ? '${price.toStringAsFixed(3).replaceAll('.', ',')} €' : '–')),
              Chip(label: Text('${s.distanceKm?.toStringAsFixed(1) ?? '?'} km')),
              Chip(label: Text(s.isOpen ? 'geöffnet' : 'geschlossen')),
            ],),
            const SizedBox(height: 12),
            Wrap(spacing: 8, children: [
              FilledButton.icon(
                icon: const Icon(Icons.info_outline),
                label: const Text('Details'),
                onPressed: () {
                  Navigator.pop(ctx);
                  GoRouter.of(context).push('/station/${s.id}');
                },
              ),
              OutlinedButton.icon(
                icon: const Icon(Icons.navigation),
                label: const Text('Navigation'),
                onPressed: () async {
                  final uri = Uri.parse(
                    'https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}',
                  );
                  if (await canLaunchUrl(uri)) {
                    await launchUrl(uri, mode: LaunchMode.externalApplication);
                  }
                },
              ),
            ],),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (!_tokenSet) {
      return Scaffold(
        appBar: AppBar(title: const Text('Karte')),
        body: const Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.map_outlined, size: 64),
                SizedBox(height: 16),
                Text(
                  'Mapbox-Token fehlt. Beim Build mit '
                  '--dart-define=MAPBOX_PUBLIC_TOKEN=pk.xxx übergeben.',
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 8),
                Text(
                  'Karte funktioniert real, sobald ein Token gesetzt ist. '
                  'Liste und Suche bleiben in dieser App ohne Token uneingeschränkt nutzbar.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12),
                ),
              ],
            ),
          ),
        ),
      );
    }
    return Scaffold(
      appBar: AppBar(
        title: const Text('Karte'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _busy ? null : _loadStations,
          ),
        ],
      ),
      body: Stack(
        children: [
          MapWidget(
            cameraOptions: CameraOptions(
              center: Point(coordinates: Position(10.45, 51.16)), // DE-Mittelpunkt
              zoom: 5,
            ),
            onMapCreated: _onMapCreated,
            onTapListener: (ctx) async {
              // Treffer-Annotation: einfacher Ansatz – das räumlich nächstgelegene
              // Element aus der bekannten Liste suchen.
              final t = ctx.point.coordinates;
              Station? nearest;
              double bestKm = 0.5;
              for (final s in _stations) {
                final d = _haversineKm(t.lat as double, t.lng as double, s.lat, s.lng);
                if (d < bestKm) {
                  bestKm = d;
                  nearest = s;
                }
              }
              if (nearest != null && mounted) _showStationSheet(nearest);
            },
          ),
          if (_busy) const Positioned(top: 16, right: 16, child: CircularProgressIndicator()),
          if (_error != null)
            Positioned(
              left: 16,
              right: 16,
              bottom: 16,
              child: Material(
                color: Colors.red.shade100,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Text('Fehler: $_error'),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

double _haversineKm(double lat1, double lng1, double lat2, double lng2) {
  const r = 6371.0;
  final dLat = _rad(lat2 - lat1);
  final dLng = _rad(lng2 - lng1);
  final a = (dLat / 2).abs() * (dLat / 2).abs() +
      _cos(_rad(lat1)) * _cos(_rad(lat2)) * (dLng / 2).abs() * (dLng / 2).abs();
  return 2 * r * a;
}

double _rad(double d) => d * 3.141592653589793 / 180.0;
double _cos(double x) => (1 - x * x / 2 + x * x * x * x / 24).abs();
