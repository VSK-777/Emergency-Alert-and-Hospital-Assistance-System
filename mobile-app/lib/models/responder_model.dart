class ResponderModel {
  final int id;
  final String fullName;
  final String phoneNumber;
  final String email;
  final String organization; // NSS, NCC, Red Cross, NGO, Community Volunteer
  final String verificationStatus; // VERIFIED, PENDING, REJECTED
  final bool isAvailable; // On-Call toggle
  final List<String> skills; // CPR Certified, First Aid, AED, EMT
  final double latitude;
  final double longitude;
  final double? distanceKm;
  final String? activeIncidentId;

  ResponderModel({
    required this.id,
    required this.fullName,
    required this.phoneNumber,
    required this.email,
    this.organization = 'NSS - National Service Scheme',
    this.verificationStatus = 'VERIFIED',
    this.isAvailable = true,
    this.skills = const ['CPR Certified', 'First Aid Responder', 'Triage'],
    required this.latitude,
    required this.longitude,
    this.distanceKm,
    this.activeIncidentId,
  });

  factory ResponderModel.fromJson(Map<String, dynamic> json) {
    return ResponderModel(
      id: json['id'] is int
          ? json['id']
          : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      fullName: json['fullName'] ?? json['name'] ?? '',
      phoneNumber: json['phoneNumber'] ?? json['phone'] ?? '',
      email: json['email'] ?? '',
      organization: json['organization'] ?? 'Community Good Samaritan',
      verificationStatus: json['verificationStatus'] ?? 'VERIFIED',
      isAvailable: json['isAvailable'] ?? json['available'] ?? true,
      skills:
          (json['skills'] as List?)?.map((e) => e.toString()).toList() ??
          ['CPR Certified', 'Basic Life Support'],
      latitude: (json['latitude'] as num?)?.toDouble() ?? 16.3533,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 80.5238,
      distanceKm: (json['distanceKm'] as num?)?.toDouble(),
      activeIncidentId: json['activeIncidentId']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullName': fullName,
      'phoneNumber': phoneNumber,
      'email': email,
      'organization': organization,
      'verificationStatus': verificationStatus,
      'isAvailable': isAvailable,
      'skills': skills,
      'latitude': latitude,
      'longitude': longitude,
      'distanceKm': distanceKm,
      'activeIncidentId': activeIncidentId,
    };
  }

  ResponderModel copyWith({
    bool? isAvailable,
    String? verificationStatus,
    String? activeIncidentId,
    double? distanceKm,
  }) {
    return ResponderModel(
      id: id,
      fullName: fullName,
      phoneNumber: phoneNumber,
      email: email,
      organization: organization,
      verificationStatus: verificationStatus ?? this.verificationStatus,
      isAvailable: isAvailable ?? this.isAvailable,
      skills: skills,
      latitude: latitude,
      longitude: longitude,
      distanceKm: distanceKm ?? this.distanceKm,
      activeIncidentId: activeIncidentId ?? this.activeIncidentId,
    );
  }
}
