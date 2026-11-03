class HospitalModel {
  final int id;
  final String name;
  final String address;
  final double latitude;
  final double longitude;
  final String phoneNumber;
  final int emergencyCapacity;
  final int availableIcus;
  final int availableAmbulances;
  final double? distanceKm;

  HospitalModel({
    required this.id,
    required this.name,
    required this.address,
    required this.latitude,
    required this.longitude,
    required this.phoneNumber,
    required this.emergencyCapacity,
    required this.availableIcus,
    required this.availableAmbulances,
    this.distanceKm,
  });

  factory HospitalModel.fromJson(Map<String, dynamic> json) {
    return HospitalModel(
      id: json['id'] is int
          ? json['id']
          : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      name: json['name'] ?? '',
      address: json['address'] ?? '',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
      phoneNumber: json['phoneNumber'] ?? '',
      emergencyCapacity: json['emergencyCapacity'] ?? 20,
      availableIcus: json['availableIcus'] ?? 5,
      availableAmbulances: json['availableAmbulances'] ?? 2,
      distanceKm: (json['distanceKm'] as num?)?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'address': address,
      'latitude': latitude,
      'longitude': longitude,
      'phoneNumber': phoneNumber,
      'emergencyCapacity': emergencyCapacity,
      'availableIcus': availableIcus,
      'availableAmbulances': availableAmbulances,
      'distanceKm': distanceKm,
    };
  }
}
