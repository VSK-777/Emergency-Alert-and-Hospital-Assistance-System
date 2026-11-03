class UserModel {
  final int? id;
  final String email;
  final String fullName;
  final String phoneNumber;
  final String role; // CITIZEN, RESPONDER, MEDICAL_STAFF, ADMIN
  final String? bloodGroup;
  final String? allergies;
  final String? medicalConditions;
  final String?
  organization; // For responders: NSS, NCC, Red Cross, NGO, Good Samaritan
  final String? verificationStatus; // VERIFIED, PENDING, REJECTED
  final bool isAvailable; // On-Call toggle for responders
  final String? emergencyContactName;
  final String? emergencyContactPhone;

  UserModel({
    this.id,
    required this.email,
    required this.fullName,
    required this.phoneNumber,
    required this.role,
    this.bloodGroup,
    this.allergies,
    this.medicalConditions,
    this.organization,
    this.verificationStatus = 'VERIFIED',
    this.isAvailable = true,
    this.emergencyContactName,
    this.emergencyContactPhone,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] is int
          ? json['id']
          : int.tryParse(json['id']?.toString() ?? ''),
      email: json['email'] ?? '',
      fullName: json['fullName'] ?? '',
      phoneNumber: json['phoneNumber'] ?? '',
      role: json['role'] ?? 'CITIZEN',
      bloodGroup: json['bloodGroup'],
      allergies: json['allergies'],
      medicalConditions: json['medicalConditions'],
      organization: json['organization'],
      verificationStatus: json['verificationStatus'] ?? 'VERIFIED',
      isAvailable: json['isAvailable'] ?? true,
      emergencyContactName: json['emergencyContactName'],
      emergencyContactPhone: json['emergencyContactPhone'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'fullName': fullName,
      'phoneNumber': phoneNumber,
      'role': role,
      'bloodGroup': bloodGroup,
      'allergies': allergies,
      'medicalConditions': medicalConditions,
      'organization': organization,
      'verificationStatus': verificationStatus,
      'isAvailable': isAvailable,
      'emergencyContactName': emergencyContactName,
      'emergencyContactPhone': emergencyContactPhone,
    };
  }

  UserModel copyWith({
    String? fullName,
    String? phoneNumber,
    String? bloodGroup,
    String? allergies,
    String? medicalConditions,
    String? organization,
    String? verificationStatus,
    bool? isAvailable,
    String? emergencyContactName,
    String? emergencyContactPhone,
  }) {
    return UserModel(
      id: id,
      email: email,
      fullName: fullName ?? this.fullName,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      role: role,
      bloodGroup: bloodGroup ?? this.bloodGroup,
      allergies: allergies ?? this.allergies,
      medicalConditions: medicalConditions ?? this.medicalConditions,
      organization: organization ?? this.organization,
      verificationStatus: verificationStatus ?? this.verificationStatus,
      isAvailable: isAvailable ?? this.isAvailable,
      emergencyContactName: emergencyContactName ?? this.emergencyContactName,
      emergencyContactPhone:
          emergencyContactPhone ?? this.emergencyContactPhone,
    );
  }
}
