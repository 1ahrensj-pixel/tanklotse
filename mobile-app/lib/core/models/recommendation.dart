// ignore_for_file: constant_identifier_names
// Backend liefert UPPERCASE-Recommendation-Strings; wir mappen sie hier auf
// einen Dart-Enum mit lowerCamelCase-Aliasen.

import 'station.dart';

enum Verdict {
  lohnt_sich,
  lohnt_sich_knapp,
  lohnt_sich_nicht,
  nur_wenn_vorbei,
  erst_ab_x_litern,
  daten_unsicher,
}

Verdict verdictFromString(String s) {
  switch (s) {
    // UPPERCASE (neue Antwort)
    case 'LOHNT_SICH':
    case 'lohnt_sich':
      return Verdict.lohnt_sich;
    case 'LOHNT_SICH_KNAPP':
    case 'lohnt_sich_knapp':
      return Verdict.lohnt_sich_knapp;
    case 'NUR_WENN_AUF_ROUTE':
    case 'nur_wenn_vorbei':
      return Verdict.nur_wenn_vorbei;
    case 'ERST_AB_X_LITERN':
      return Verdict.erst_ab_x_litern;
    case 'DATEN_UNSICHER':
      return Verdict.daten_unsicher;
    case 'LOHNT_SICH_NICHT':
    case 'lohnt_sich_nicht':
    default:
      return Verdict.lohnt_sich_nicht;
  }
}

extension VerdictX on Verdict {
  String get german {
    switch (this) {
      case Verdict.lohnt_sich:
        return 'Lohnt sich';
      case Verdict.lohnt_sich_knapp:
        return 'Lohnt sich knapp';
      case Verdict.nur_wenn_vorbei:
        return 'Nur, wenn du sowieso vorbeifährst';
      case Verdict.erst_ab_x_litern:
        return 'Lohnt sich erst bei größerer Tankmenge';
      case Verdict.daten_unsicher:
        return 'Datenlage unsicher';
      case Verdict.lohnt_sich_nicht:
        return 'Lohnt sich nicht';
    }
  }

  /// UPPERCASE-Repräsentation für Backend-Roundtrips und Widget-Switches.
  String get apiValue {
    switch (this) {
      case Verdict.lohnt_sich:
        return 'LOHNT_SICH';
      case Verdict.lohnt_sich_knapp:
        return 'LOHNT_SICH_KNAPP';
      case Verdict.nur_wenn_vorbei:
        return 'NUR_WENN_AUF_ROUTE';
      case Verdict.erst_ab_x_litern:
        return 'ERST_AB_X_LITERN';
      case Verdict.daten_unsicher:
        return 'DATEN_UNSICHER';
      case Verdict.lohnt_sich_nicht:
        return 'LOHNT_SICH_NICHT';
    }
  }
}

class Recommendation {
  final Station station;
  final double price;
  final double distanceKm;
  final double priceAdvantageEur;
  final double detourFuelCostEur;
  final double timeCostEur;
  final double realSavingsEur;
  final double? breakEvenLiters;
  final Verdict verdict;
  final String explanation;

  Recommendation({
    required this.station,
    required this.price,
    required this.distanceKm,
    required this.priceAdvantageEur,
    required this.detourFuelCostEur,
    required this.timeCostEur,
    required this.realSavingsEur,
    required this.breakEvenLiters,
    required this.verdict,
    required this.explanation,
  });

  factory Recommendation.fromJson(Map<String, dynamic> j) {
    final stationJson = j['station'] as Map<String, dynamic>?;
    // Neue Antwort hat top-level Felder + station-Objekt; alte (Detour)
    // hatte nur die station-flachen Felder.
    final priceAdv = (j['grossSavingEuro'] ?? j['priceAdvantageEur'] ?? 0).toDouble();
    final detourCost = (j['detourCostEuro'] ?? j['detourFuelCostEur'] ?? 0).toDouble();
    final timeCost = (j['timeCostEuro'] ?? j['timeCostEur'] ?? 0).toDouble();
    final realSaving = (j['realSavingEuro'] ?? j['realSavingsEur'] ?? 0).toDouble();
    final price = (j['targetPrice'] ?? j['price'] ?? 0).toDouble();
    final distance = (j['extraDistanceKm'] ?? j['distanceKm'] ?? 0).toDouble();
    final verdictStr = (j['recommendation'] ?? j['verdict'] ?? 'LOHNT_SICH_NICHT') as String;
    final breakEven = j['breakEvenLiters'] == null ? null : (j['breakEvenLiters'] as num).toDouble();

    return Recommendation(
      station: Station(
        id: (stationJson?['id'] ?? j['stationId']) as String,
        name: (stationJson?['name'] ?? j['stationName']) as String,
        brand: (stationJson?['brand'] ?? j['brand']) as String,
        address: StationAddress(
          street: (stationJson?['street'] as String?) ?? '',
          houseNumber: stationJson?['houseNumber'] as String?,
          postCode: (stationJson?['postCode'] as String?) ?? '',
          place: (stationJson?['place'] as String?) ?? '',
        ),
        lat: ((stationJson?['lat'] ?? 0) as num).toDouble(),
        lng: ((stationJson?['lng'] ?? 0) as num).toDouble(),
        distanceKm: (stationJson?['distanceKm'] as num?)?.toDouble() ?? distance,
        isOpen: stationJson?['isOpen'] as bool? ?? true,
        prices: StationPrices.fromJson(
          (stationJson?['prices'] as Map<String, dynamic>?) ?? {},
        ),
        selectedPrice: price,
      ),
      price: price,
      distanceKm: distance,
      priceAdvantageEur: priceAdv,
      detourFuelCostEur: detourCost,
      timeCostEur: timeCost,
      realSavingsEur: realSaving,
      breakEvenLiters: breakEven,
      verdict: verdictFromString(verdictStr),
      explanation: (j['explanation'] ?? '') as String,
    );
  }
}
