import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/env/app_env.dart';
import '../../core/models/station.dart';
import '../../core/repositories/stations_repository.dart';
import '../../core/services/location_service.dart';
import '../../core/state/search_state.dart';
import 'map_markers_helper.dart';

class MapScreen extends ConsumerStatefulWidget {
  const MapScreen({super.key});

  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen> {
  static const _markersHelper = MapMarkersHelper();

  /// Initiale Kamera: DE-Mittelpunkt, bis der echte Standort geladen ist.
  static const _germanyCenter = CameraPosition(
    target: LatLng(51.16, 10.45),
    zoom: 5,
  );

  GoogleMapController? _controller;
  bool _busy = false;
  String? _error;
  List<Station> _stations = const [];
  Set<Marker> _markers = const {};

  final bool _keySet = AppEnv.googleMapsApiKey.isNotEmpty;

  void _onMapCreated(GoogleMapController controller) {
    _controller = controller;
    _loadStations();
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
      _markers = _markersHelper.buildMarkers(
        stations: _stations,
        fuelType: prefs.fuelType,
        onTap: _showStationSheet,
      );

      // Kamera auf den Such-Standort zentrieren; wenn keiner verfuegbar ist,
      // auf die erste Station ausweichen.
      final LatLng target = LatLng(pos.latitude, pos.longitude);
      await _controller?.animateCamera(
        CameraUpdate.newCameraPosition(
          CameraPosition(target: target, zoom: 13),
        ),
      );

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
    if (!_keySet) {
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
                  'Google-Maps-API-Key fehlt. Beim Build mit '
                  '--dart-define=GOOGLE_MAPS_API_KEY=AIza... übergeben.',
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 8),
                Text(
                  'Karte funktioniert real, sobald ein Key gesetzt ist. '
                  'Liste und Suche bleiben in dieser App ohne Key uneingeschränkt nutzbar.',
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
          GoogleMap(
            initialCameraPosition: _germanyCenter,
            onMapCreated: _onMapCreated,
            markers: _markers,
            myLocationButtonEnabled: false,
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
