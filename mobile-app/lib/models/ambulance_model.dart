class AmbulanceModel {
  final int id;
  final String registrationNumber;
  final String type; // ALS (Advanced Life Support) or BLS (Basic Life Support)
  final String
  status; // IDLE, DISPATCHED, EN_ROUTE_TO_PATIENT, PATIENT_PICKED_UP, EN_ROUTE_TO_HOSPITAL, COMPLETED
  final String driverName;
  final String driverPhone;
  final double latitude;
  final double longitude;
  final String? hospitalName;
  final String? assignedIncidentId;
  final int etaMinutes;

  AmbulanceModel({
    required this.id,
    required this.registrationNumber,
    required this.type,
    required this.status,
    required this.driverName,
    required this.driverPhone,
    required this.latitude,
    required this.longitude,
    this.hospitalName,
    this.assignedIncidentId,
    this.etaMinutes = 7,
  });

  factory AmbulanceModel.fromJson(Map<String, dynamic> json) {
    return AmbulanceModel(
      id: json['id'] is int
          ? json['id']
          : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      registrationNumber:
          json['registrationNumber'] ?? json['regNumber'] ?? 'AP 16 TE 108',
      type: json['type'] ?? 'ALS',
      status: json['status'] ?? 'IDLE',
      driverName: json['driverName'] ?? 'Ramesh Babu',
      driverPhone: json['driverPhone'] ?? '+91 98480 22338',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 16.3550,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 80.5250,
      hospitalName:
          json['hospitalName'] ?? 'VVIT Community Health Trauma Center',
      assignedIncidentId: json['assignedIncidentId'],
      etaMinutes: json['etaMinutes'] ?? 6,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'registrationNumber': registrationNumber,
      'type': type,
      'status': status,
      'driverName': driverName,
      'driverPhone': driverPhone,
      'latitude': latitude,
      'longitude': longitude,
      'hospitalName': hospitalName,
      'assignedIncidentId': assignedIncidentId,
      'etaMinutes': etaMinutes,
    };
  }

  AmbulanceModel copyWith({
    String? status,
    String? assignedIncidentId,
    int? etaMinutes,
    double? latitude,
    double? longitude,
  }) {
    return AmbulanceModel(
      id: id,
      registrationNumber: registrationNumber,
      type: type,
      status: status ?? this.status,
      driverName: driverName,
      driverPhone: driverPhone,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      hospitalName: hospitalName,
      assignedIncidentId: assignedIncidentId ?? this.assignedIncidentId,
      etaMinutes: etaMinutes ?? this.etaMinutes,
    );
  }
}
