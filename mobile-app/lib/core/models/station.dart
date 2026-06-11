class StationAddress {
  final String street;
  final String? houseNumber;
  final String postCode;
  final String place;
  StationAddress({required this.street, this.houseNumber, required this.postCode, required this.place});
  factory StationAddress.fromJson(Map<String, dynamic> j) => StationAddress(
        street: j['street'] as String,
        houseNumber: j['houseNumber'] as String?,
        postCode: j['postCode'] as String,
        place: j['place'] as String,
      );

  String formatted() {
    final hn = houseNumber ?? '';
    return '$street $hn, $postCode $place'.replaceAll('  ', ' ');
  }
}

class StationPrices {
  final double? e5;
  final double? e10;
  final double? diesel;
  StationPrices({this.e5, this.e10, this.diesel});
  factory StationPrices.fromJson(Map<String, dynamic> j) => StationPrices(
        e5: (j['e5'] as num?)?.toDouble(),
        e10: (j['e10'] as num?)?.toDouble(),
        diesel: (j['diesel'] as num?)?.toDouble(),
      );

  double? forFuel(String fuel) {
    switch (fuel.toUpperCase()) {
      case 'E5':
        return e5;
      case 'E10':
        return e10;
      case 'DIESEL':
        return diesel;
    }
    return null;
  }
}

class Station {
  final String id;
  final String name;
  final String brand;
  final StationAddress address;
  final double lat;
  final double lng;
  final double? distanceKm;
  final bool isOpen;
  final StationPrices prices;
  final double? selectedPrice;

  Station({
    required this.id,
    required this.name,
    required this.brand,
    required this.address,
    required this.lat,
    required this.lng,
    required this.distanceKm,
    required this.isOpen,
    required this.prices,
    required this.selectedPrice,
  });

  factory Station.fromJson(Map<String, dynamic> j) => Station(
        id: j['id'] as String,
        name: j['name'] as String,
        brand: j['brand'] as String,
        address: StationAddress.fromJson(j['address'] as Map<String, dynamic>),
        lat: (j['lat'] as num).toDouble(),
        lng: (j['lng'] as num).toDouble(),
        distanceKm: (j['distanceKm'] as num?)?.toDouble(),
        isOpen: j['isOpen'] as bool,
        prices: StationPrices.fromJson(j['prices'] as Map<String, dynamic>),
        selectedPrice: (j['selectedPrice'] as num?)?.toDouble(),
      );
}
