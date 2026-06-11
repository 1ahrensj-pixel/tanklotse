import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/api_client.dart';

/// Duenne HTTP-Schicht fuer Stations- und Recommendation-Endpunkte.
///
/// Trennung von Verantwortlichkeiten (entkoppelt von Cache/Mapping):
///   * `StationsApiClient` kennt nur `Dio` + URLs + Query-Parameter.
///   * `StationsRepository` (siehe `stations_repository.dart`) ruft die
///     `StationsApiClient`-Methoden auf und mappt die rohen Maps in
///     `Station`- / `Recommendation`-Modelle. Erlaubt es Tests, den
///     Client zu mocken, ohne Modell-Logik nachbauen zu muessen.
class StationsApiClient {
  StationsApiClient(this._dio);
  final Dio _dio;

  Future<Map<String, dynamic>> searchStations({
    required double lat,
    required double lng,
    required double radiusKm,
    required String fuelType,
    bool onlyOpen = false,
    String sort = 'price',
  }) async {
    final res = await _dio.get('/stations/search', queryParameters: {
      'lat': lat,
      'lng': lng,
      'radius': radiusKm,
      'fuelType': fuelType,
      'sort': sort,
      if (onlyOpen) 'onlyOpen': true,
    },);
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> stationDetail(String id) async {
    final res = await _dio.get('/stations/$id');
    return res.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> bestStation({
    required double lat,
    required double lng,
    required double radiusKm,
    required String fuelType,
    required double consumption,
    required double tankLiters,
  }) async {
    final res = await _dio.post('/recommendations/best-station', data: {
      'lat': lat,
      'lng': lng,
      'radius': radiusKm,
      'fuelType': fuelType,
      'consumptionLPer100Km': consumption,
      'tankLiters': tankLiters,
    },);
    return res.data as Map<String, dynamic>;
  }
}

final stationsApiClientProvider = Provider<StationsApiClient>((ref) {
  return StationsApiClient(ref.read(apiClientProvider));
});
