import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../core/models/station.dart';

/// Helper, der Tankstellen-Marker fuer eine Google-Maps-Karte erzeugt.
///
/// Trennung von `MapScreen`: die ConsumerState-Klasse haelt die UI- und
/// State-Logik, die Marker-Erstellung lebt isoliert hier — leichter zu
/// testen und wiederzuverwenden (z.B. fuer die geplante Route-Karte).
///
/// Farb-Tiers werden via 25. / 75. Perzentil der sichtbaren Preise
/// bestimmt: Top-25% gruen, mittlere 50% gelb, untere 25% rot. Bewusst
/// relativ, weil Absolutwerte sich saisonal verschieben.
///
/// Da Google Maps keine frei einfaerbbaren Text-Annotationen wie Mapbox
/// bietet, nutzen wir `BitmapDescriptor.defaultMarkerWithHue` als
/// pragmatischen Ersatz: HueGreen / HueYellow / HueRed bilden die drei
/// Preis-Tiers ab. Der Preis selbst landet im InfoWindow (Tap auf Marker).
class MapMarkersHelper {
  const MapMarkersHelper();

  /// Hue-Werte (0–360) der Google-Maps-Standardmarker je Tier.
  static const double _greenHue = BitmapDescriptor.hueGreen;
  static const double _yellowHue = BitmapDescriptor.hueYellow;
  static const double _redHue = BitmapDescriptor.hueRed;

  /// Erzeugt das Marker-Set fuer die uebergebenen Stationen.
  ///
  /// [onTap] wird aufgerufen, wenn der Nutzer auf einen Marker tippt — das
  /// erlaubt dem Screen, sein Bottom-Sheet zu zeigen. Zusaetzlich traegt
  /// jeder Marker ein InfoWindow mit Stationsname + Preis.
  Set<Marker> buildMarkers({
    required List<Station> stations,
    required String fuelType,
    void Function(Station station)? onTap,
  }) {
    final prices = stations
        .map((s) => s.prices.forFuel(fuelType))
        .whereType<double>()
        .toList();
    if (prices.isEmpty) return <Marker>{};

    final tiers = _PriceTiers.fromPrices(prices);

    final markers = <Marker>{};
    for (final s in stations) {
      final price = s.prices.forFuel(fuelType);
      if (price == null) continue;
      final priceLabel = '${price.toStringAsFixed(3).replaceAll('.', ',')} €';
      markers.add(
        Marker(
          markerId: MarkerId(s.id),
          position: LatLng(s.lat, s.lng),
          icon: BitmapDescriptor.defaultMarkerWithHue(tiers.hueFor(price)),
          infoWindow: InfoWindow(
            title: '${s.brand} · ${s.name}',
            snippet: priceLabel,
          ),
          onTap: onTap == null ? null : () => onTap(s),
        ),
      );
    }
    return markers;
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

  double hueFor(double price) {
    if (price <= p25) return MapMarkersHelper._greenHue;
    if (price >= p75) return MapMarkersHelper._redHue;
    return MapMarkersHelper._yellowHue;
  }
}
