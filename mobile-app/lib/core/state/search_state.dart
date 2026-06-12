import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive/hive.dart';

import '../models/station.dart';

class SearchPrefs {
  final String fuelType; // E5 / E10 / DIESEL
  final double radiusKm;
  final double consumption;
  final double tankLiters;
  final bool onlyOpen;

  SearchPrefs({
    required this.fuelType,
    required this.radiusKm,
    required this.consumption,
    required this.tankLiters,
    required this.onlyOpen,
  });

  SearchPrefs copyWith({
    String? fuelType,
    double? radiusKm,
    double? consumption,
    double? tankLiters,
    bool? onlyOpen,
  }) {
    return SearchPrefs(
      fuelType: fuelType ?? this.fuelType,
      radiusKm: radiusKm ?? this.radiusKm,
      consumption: consumption ?? this.consumption,
      tankLiters: tankLiters ?? this.tankLiters,
      onlyOpen: onlyOpen ?? this.onlyOpen,
    );
  }
}

class SearchPrefsNotifier extends StateNotifier<SearchPrefs> {
  SearchPrefsNotifier()
      : super(_load());

  static SearchPrefs _load() {
    final box = Hive.box('settings');
    return SearchPrefs(
      fuelType: box.get('fuelType', defaultValue: 'DIESEL') as String,
      radiusKm: (box.get('radiusKm', defaultValue: 5.0) as num).toDouble(),
      consumption: (box.get('consumption', defaultValue: 7.5) as num).toDouble(),
      tankLiters: (box.get('tankLiters', defaultValue: 50.0) as num).toDouble(),
      onlyOpen: box.get('onlyOpen', defaultValue: true) as bool,
    );
  }

  void update(SearchPrefs Function(SearchPrefs) f) {
    final next = f(state);
    state = next;
    final box = Hive.box('settings');
    box.put('fuelType', next.fuelType);
    box.put('radiusKm', next.radiusKm);
    box.put('consumption', next.consumption);
    box.put('tankLiters', next.tankLiters);
    box.put('onlyOpen', next.onlyOpen);
  }
}

final searchPrefsProvider =
    StateNotifierProvider<SearchPrefsNotifier, SearchPrefs>((ref) => SearchPrefsNotifier());

/// Ergebnis der letzten Suche — geteilt zwischen Such- und Karten-Screen.
///
/// Damit die Karte sofort die Stationen anzeigt, die der Nutzer gerade
/// gesucht hat (am gesuchten Ort zentriert), statt beim Tab-Wechsel eine
/// neue GPS-Suche zu starten. Auf dem Web ohne GPS-Freigabe blieb die Karte
/// sonst leer ("keine Maps gesehen").
class LastSearch {
  final double centerLat;
  final double centerLng;
  final List<Station> stations;
  final String fuelType;

  const LastSearch({
    required this.centerLat,
    required this.centerLng,
    required this.stations,
    required this.fuelType,
  });
}

final lastSearchProvider = StateProvider<LastSearch?>((ref) => null);
