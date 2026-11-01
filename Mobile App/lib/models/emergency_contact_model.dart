class EmergencyContactModel {
  final int? id;
  final String name;
  final String relationship;
  final String phoneNumber;
  final bool isPrimary;

  EmergencyContactModel({
    this.id,
    required this.name,
    required this.relationship,
    required this.phoneNumber,
    this.isPrimary = false,
  });

  factory EmergencyContactModel.fromJson(Map<String, dynamic> json) {
    return EmergencyContactModel(
      id: json['id'] is int
          ? json['id']
          : int.tryParse(json['id']?.toString() ?? ''),
      name: json['name'] ?? '',
      relationship: json['relationship'] ?? '',
      phoneNumber: json['phoneNumber'] ?? '',
      isPrimary: json['isPrimary'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'relationship': relationship,
      'phoneNumber': phoneNumber,
      'isPrimary': isPrimary,
    };
  }
}
