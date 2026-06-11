import 'package:geolocator/geolocator.dart' as geo;
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

import '../../core/models/station.dart';

/// Helper, der Tankstellen-Marker auf einer Mapbox-Karte rendert.
///
/// Trennung von `MapScreen`: die ConsumerState-Klasse haelt die UI- und
/// State-Logik, die Marker-Erstellung lebt isoliert hier — leichter zu
/// testen und wiederzuverwenden (z.B. fuer die geplante Route-Karte).
///
/// Farb-Tiers werden via 25. / 75. Perzentil der sichtbaren Preise
/// bestimmt: Top-25% gruen, mittlere 50% gelb, untere 25% rot. Bewusst
/// relativ, weil Absolutwerte sich saisonal verschieben.
class MapMarkersHelper {
  MapMarkersHelper({
    required MapboxMap map,
    required PointAnnotationManager markers,
  })  : _map = map,
        _markers = markers;

  final MapboxMap _map;
  final PointAnnotationManager _markers;

  static const int _greenColor = 0xFF34C759;
  static const int _yellowColor = 0xFFFFCC00;
  static const int _redColor = 0xFFFF3B30;

  Future<void> renderStations({
    required List<Station> stations,
    required String fuelType,
    required geo.Position center,
  }) async {
    await _markers.deleteAll();

    final prices = stations
        .map((s) => s.prices.forFuel(fuelType))
        .whereType<double>()
        .toList();
    if (prices.isEmpty) return;

    final tiers = _PriceTiers.fromPrices(prices);

    for (final s in stations) {
      final price = s.prices.forFuel(fuelType);
      if (price == null) continue;
      await _markers.create(
        PointAnnotationOptions(
          geometry: Point(coordinates: Position(s.lng, s.lat)),
          textField: '${price.toStringAsFixed(3).replaceAll('.', ',')} €',
          textColor: tiers.colorFor(price),
          textHaloColor: 0xFF000000,
          textHaloWidth: 1.0,
          textSize: 12.0,
        ),
      );
    }

    await _map.flyTo(
      CameraOptions(
        center: Point(coordinates: Position(center.longitude, center.latitude)),
        zoom: 13,
      ),
      MapAnimationOptions(duration: 800),
    );
  }
}

class _PriceTiers {
  _PriceTiers._(this.p25, this.p75);
  final double p25;
  final double p75;

  factory _PriceTiers.fromPrices(List<double> prices) {
    final sorted = [...prices]..sort();
    return _PriceTiers._(
      sorted[(sorted.length * 0.25).floor()],
      sorted[(sorted.length * 0.75).floor()],
    );
  }

  int colorFor(double price) {
    if (price <= p25) return MapMarkersHelper._greenColor;
    if (price >= p75) return MapMarkersHelper._redColor;
    return MapMarkersHelper._yellowColor;
  }
}
