import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/api_client.dart';
import '../models/recommendation.dart';
import '../models/station.dart';
import 'stations_api_client.dart';

class StationSearchResult {
  final List<Station> stations;
  final String attribution;
  StationSearchResult({required this.stations, required this.attribution});
}

/// Reine Mapping-/Caching-Schicht fuer Stationen + Empfehlungen.
/// HTTP-Calls werden an `StationsApiClient` (siehe `stations_api_client.dart`)
/// delegiert.
class StationsRepository {
  StationsRepository(this._ref);
  final Ref _ref;

  StationsApiClient get _api => _ref.read(stationsApiClientProvider);

  Future<StationSearchResult> search({
    required double lat,
    required double lng,
    required double radiusKm,
    required String fuelType,
    bool onlyOpen = false,
    String sort = 'price',
  }) async {
    final data = await _api.searchStations(
      lat: lat,
      lng: lng,
      radiusKm: radiusKm,
      fuelType: fuelType,
      onlyOpen: onlyOpen,
      sort: sort,
    );
    final list = (data['stations'] as List).cast<Map<String, dynamic>>();
    return StationSearchResult(
      attribution: data['attribution'] as String,
      stations: list.map(Station.fromJson).toList(),
    );
  }

  Future<Map<String, dynamic>> detail(String id) {
    return _api.stationDetail(id);
  }

  Future<List<Recommendation>> bestStation({
    required double lat,
    required double lng,
    required double radiusKm,
    required String fuelType,
    required double consumption,
    required double tankLiters,
  }) async {
    final data = await _api.bestStation(
      lat: lat,
      lng: lng,
      radiusKm: radiusKm,
      fuelType: fuelType,
      consumption: consumption,
      tankLiters: tankLiters,
    );
    final list = (data['recommendations'] as List).cast<Map<String, dynamic>>();
    return list.map(Recommendation.fromJson).toList();
  }
}

final stationsRepositoryProvider = Provider<StationsRepository>((ref) => StationsRepository(ref));

class FavoritesRepository {
  FavoritesRepository(this._ref);
  final Ref _ref;

  Future<List<Map<String, dynamic>>> list() async {
    final res = await _ref.read(apiClientProvider).get('/favorites');
    return (res.data as List).cast<Map<String, dynamic>>();
  }

  Future<void> add(String stationId, String name) async {
    await _ref.read(apiClientProvider).post('/favorites', data: {
      'stationId': stationId,
      'name': name,
    },);
  }

  Future<void> remove(String stationId) async {
    await _ref.read(apiClientProvider).delete('/favorites/$stationId');
  }
}

final favoritesRepositoryProvider =
    Provider<FavoritesRepository>((ref) => FavoritesRepository(ref));

class VehiclesRepository {
  VehiclesRepository(this._ref);
  final Ref _ref;

  Future<List<Map<String, dynamic>>> list() async {
    final res = await _ref.read(apiClientProvider).get('/vehicles');
    return (res.data as List).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> create({
    required String name,
    required String fuelType,
    required double consumption,
    required double tankLiters,
    bool isDefault = false,
    bool isCommercial = false,
  }) async {
    final res = await _ref.read(apiClientProvider).post('/vehicles', data: {
      'name': name,
      'fuelType': fuelType,
      'consumptionLPer100Km': consumption,
      'typicalTankLiters': tankLiters,
      'isDefault': isDefault,
      'isCommercial': isCommercial,
    },);
    return res.data as Map<String, dynamic>;
  }

  Future<void> remove(String id) async {
    await _ref.read(apiClientProvider).delete('/vehicles/$id');
  }

  /// Holt die unterstuetzten Fahrzeugklassen + Fahrprofile vom Backend.
  Future<Map<String, dynamic>> classes() async {
    final res = await _ref.read(apiClientProvider).get('/vehicles/classes');
    return res.data as Map<String, dynamic>;
  }

  /// Schaetzwert fuer Verbrauch + Tankmenge anhand Klasse + Profil.
  Future<Map<String, dynamic>> estimate({
    required String vehicleClass,
    required String drivingProfile,
  }) async {
    final res = await _ref.read(apiClientProvider).get(
      '/vehicles/estimate',
      queryParameters: {'vehicleClass': vehicleClass, 'drivingProfile': drivingProfile},
    );
    return res.data as Map<String, dynamic>;
  }
}

final vehiclesRepositoryProvider =
    Provider<VehiclesRepository>((ref) => VehiclesRepository(ref));

class SavedRoute {
  final String id;
  final String name;
  final String startLabel;
  final double startLat;
  final double startLng;
  final String endLabel;
  final double endLat;
  final double endLng;
  final String fuelType;
  final double maxDetourKm;
  final bool active;

  SavedRoute({
    required this.id,
    required this.name,
    required this.startLabel,
    required this.startLat,
    required this.startLng,
    required this.endLabel,
    required this.endLat,
    required this.endLng,
    required this.fuelType,
    required this.maxDetourKm,
    required this.active,
  });

  factory SavedRoute.fromJson(Map<String, dynamic> j) => SavedRoute(
        id: j['id'] as String,
        name: j['name'] as String,
        startLabel: j['startLabel'] as String,
        startLat: double.parse(j['startLat'].toString()),
        startLng: double.parse(j['startLng'].toString()),
        endLabel: j['endLabel'] as String,
        endLat: double.parse(j['endLat'].toString()),
        endLng: double.parse(j['endLng'].toString()),
        fuelType: j['fuelType'] as String,
        maxDetourKm: double.parse(j['maxDetourKm'].toString()),
        active: j['active'] as bool,
      );
}

class SavedRoutesRepository {
  SavedRoutesRepository(this._ref);
  final Ref _ref;

  Future<List<SavedRoute>> list() async {
    final res = await _ref.read(apiClientProvider).get('/saved-routes');
    return (res.data as List)
        .cast<Map<String, dynamic>>()
        .map(SavedRoute.fromJson)
        .toList();
  }

  Future<SavedRoute> create({
    required String name,
    required String startLabel,
    required double startLat,
    required double startLng,
    required String endLabel,
    required double endLat,
    required double endLng,
    required String fuelType,
    double maxDetourKm = 3,
  }) async {
    final res = await _ref.read(apiClientProvider).post('/saved-routes', data: {
      'name': name,
      'startLabel': startLabel,
      'startLat': startLat,
      'startLng': startLng,
      'endLabel': endLabel,
      'endLat': endLat,
      'endLng': endLng,
      'fuelType': fuelType,
      'maxDetourKm': maxDetourKm,
    },);
    return SavedRoute.fromJson(res.data as Map<String, dynamic>);
  }

  Future<void> remove(String id) async {
    await _ref.read(apiClientProvider).delete('/saved-routes/$id');
  }

  Future<Map<String, dynamic>> recommendations({
    required String id,
    required double consumptionLPer100Km,
    required double tankLiters,
  }) async {
    final res = await _ref.read(apiClientProvider).post(
      '/saved-routes/$id/recommendations',
      data: {
        'consumptionLPer100Km': consumptionLPer100Km,
        'tankLiters': tankLiters,
      },
    );
    return res.data as Map<String, dynamic>;
  }
}

final savedRoutesRepositoryProvider =
    Provider<SavedRoutesRepository>((ref) => SavedRoutesRepository(ref));

class HighwayRepository {
  HighwayRepository(this._ref);
  final Ref _ref;

  Future<Map<String, dynamic>> exitCheck({
    required double currentLat,
    required double currentLng,
    required String fuelType,
    required double tankLiters,
    required double consumptionLPer100Km,
    double maxExitDetourKm = 5,
  }) async {
    final res = await _ref.read(apiClientProvider).post('/highway/exit-check', data: {
      'currentLat': currentLat,
      'currentLng': currentLng,
      'fuelType': fuelType,
      'tankLiters': tankLiters,
      'consumptionLPer100Km': consumptionLPer100Km,
      'maxExitDetourKm': maxExitDetourKm,
    },);
    return res.data as Map<String, dynamic>;
  }
}

final highwayRepositoryProvider =
    Provider<HighwayRepository>((ref) => HighwayRepository(ref));

class PushRepository {
  PushRepository(this._ref);
  final Ref _ref;

  Future<void> registerToken({
    required String deviceId,
    required String fcmToken,
    required String platform,
  }) async {
    await _ref.read(apiClientProvider).post('/push/register-token', data: {
      'deviceId': deviceId,
      'fcmToken': fcmToken,
      'platform': platform,
    },);
  }

  /// Meldet einen FCM-Token beim Backend ab (DELETE /push/token), z. B. beim
  /// Logout, damit keine Pushes mehr fuer das abgemeldete Konto ankommen.
  Future<void> revokeToken({required String fcmToken}) async {
    await _ref.read(apiClientProvider).delete('/push/token', data: {
      'fcmToken': fcmToken,
    },);
  }
}

final pushRepositoryProvider = Provider<PushRepository>((ref) => PushRepository(ref));

class GeoSearchResult {
  final String label;
  final double lat;
  final double lng;
  final String type;
  final String? countryCode;

  GeoSearchResult({
    required this.label,
    required this.lat,
    required this.lng,
    required this.type,
    this.countryCode,
  });

  factory GeoSearchResult.fromJson(Map<String, dynamic> j) => GeoSearchResult(
        label: j['label'] as String,
        lat: (j['lat'] as num).toDouble(),
        lng: (j['lng'] as num).toDouble(),
        type: j['type'] as String,
        countryCode: j['countryCode'] as String?,
      );
}

class GeoRepository {
  GeoRepository(this._ref);
  final Ref _ref;

  Future<List<GeoSearchResult>> search(String query, {int limit = 5}) async {
    final q = query.trim();
    if (q.isEmpty) return const [];
    final res = await _ref.read(apiClientProvider).get(
      '/geo/search',
      queryParameters: {'q': q, 'limit': limit},
    );
    return (res.data as List)
        .cast<Map<String, dynamic>>()
        .map(GeoSearchResult.fromJson)
        .toList();
  }
}

final geoRepositoryProvider = Provider<GeoRepository>((ref) => GeoRepository(ref));
