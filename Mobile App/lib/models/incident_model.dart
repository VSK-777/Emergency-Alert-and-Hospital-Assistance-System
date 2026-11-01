class IncidentModel {
  final String id;
  final int? userId;
  final String source; // SMARTWATCH_AUTO, SMARTWATCH_SOS, MOBILE_SOS, MANUAL
  final String
  category; // ROAD_ACCIDENT, CARDIAC_ARREST, FALL, SEVERE_BLEEDING, FIRE, MEDICAL_EMERGENCY, CHOKING, OTHER
  final String
  status; // PENDING, DISPATCHED, RESPONDER_ACCEPTED, IN_PROGRESS, RESOLVED, CANCELLED
  final double latitude;
  final double longitude;
  final double? accuracyMeters;
  final String detectionReason;
  final double detectionScore;
  final String? assignedHospitalName;
  final String? assignedResponderName;
  final String? assignedAmbulanceReg;
  final String
  deliveryStatus; // Saved locally, Queued for sync, Delivered, Acknowledged, Failed
  final String syncStatus; // PENDING, SYNCED, FAILED
  final String idempotencyKey;
  final DateTime createdAt;

  IncidentModel({
    required this.id,
    this.userId,
    required this.source,
    this.category = 'MEDICAL_EMERGENCY',
    required this.status,
    required this.latitude,
    required this.longitude,
    this.accuracyMeters,
    required this.detectionReason,
    this.detectionScore = 1.0,
    this.assignedHospitalName,
    this.assignedResponderName,
    this.assignedAmbulanceReg,
    this.deliveryStatus = 'Saved locally',
    this.syncStatus = 'PENDING',
    required this.idempotencyKey,
    required this.createdAt,
  });

  factory IncidentModel.fromJson(Map<String, dynamic> json) {
    return IncidentModel(
      id: json['id'] ?? '',
      userId: json['userId'] is int
          ? json['userId']
          : int.tryParse(json['userId']?.toString() ?? ''),
      source: json['source'] ?? 'MOBILE_SOS',
      category: json['category'] ?? 'MEDICAL_EMERGENCY',
      status: json['status'] ?? 'PENDING',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 16.3533,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 80.5238,
      accuracyMeters: (json['accuracyMeters'] as num?)?.toDouble(),
      detectionReason: json['detectionReason'] ?? 'SOS Triggered',
      detectionScore: (json['detectionScore'] as num?)?.toDouble() ?? 1.0,
      assignedHospitalName: json['assignedHospitalName'],
      assignedResponderName: json['assignedResponderName'],
      assignedAmbulanceReg:
          json['assignedAmbulanceReg'] ?? json['ambulanceReg'],
      deliveryStatus: json['deliveryStatus'] ?? 'Delivered',
      syncStatus: json['syncStatus'] ?? 'SYNCED',
      idempotencyKey: json['idempotencyKey'] ?? json['id'] ?? '',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt']) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'source': source,
      'category': category,
      'status': status,
      'latitude': latitude,
      'longitude': longitude,
      'accuracyMeters': accuracyMeters,
      'detectionReason': detectionReason,
      'detectionScore': detectionScore,
      'assignedHospitalName': assignedHospitalName,
      'assignedResponderName': assignedResponderName,
      'assignedAmbulanceReg': assignedAmbulanceReg,
      'deliveryStatus': deliveryStatus,
      'syncStatus': syncStatus,
      'idempotencyKey': idempotencyKey,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  IncidentModel copyWith({
    String? status,
    String? category,
    String? deliveryStatus,
    String? syncStatus,
    String? assignedHospitalName,
    String? assignedResponderName,
    String? assignedAmbulanceReg,
  }) {
    return IncidentModel(
      id: id,
      userId: userId,
      source: source,
      category: category ?? this.category,
      status: status ?? this.status,
      latitude: latitude,
      longitude: longitude,
      accuracyMeters: accuracyMeters,
      detectionReason: detectionReason,
      detectionScore: detectionScore,
      assignedHospitalName: assignedHospitalName ?? this.assignedHospitalName,
      assignedResponderName:
          assignedResponderName ?? this.assignedResponderName,
      assignedAmbulanceReg: assignedAmbulanceReg ?? this.assignedAmbulanceReg,
      deliveryStatus: deliveryStatus ?? this.deliveryStatus,
      syncStatus: syncStatus ?? this.syncStatus,
      idempotencyKey: idempotencyKey,
      createdAt: createdAt,
    );
  }
}
