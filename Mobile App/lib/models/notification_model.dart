class NotificationModel {
  final String id;
  final String title;
  final String message;
  final String
  type; // EMERGENCY_ALERT, SMARTWATCH_FALL, AMBULANCE_UPDATE, RESPONDER_ACCEPTED, HOSPITAL_ALERT, SYNC_STATUS
  final DateTime timestamp;
  final bool isRead;
  final String? incidentId;

  NotificationModel({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.timestamp,
    this.isRead = false,
    this.incidentId,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id']?.toString() ?? '',
      title: json['title'] ?? 'Emergency Notification',
      message: json['message'] ?? '',
      type: json['type'] ?? 'EMERGENCY_ALERT',
      timestamp: json['timestamp'] != null
          ? DateTime.tryParse(json['timestamp']) ?? DateTime.now()
          : DateTime.now(),
      isRead: json['isRead'] ?? false,
      incidentId: json['incidentId']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'message': message,
      'type': type,
      'timestamp': timestamp.toIso8601String(),
      'isRead': isRead,
      'incidentId': incidentId,
    };
  }

  NotificationModel copyWith({bool? isRead}) {
    return NotificationModel(
      id: id,
      title: title,
      message: message,
      type: type,
      timestamp: timestamp,
      isRead: isRead ?? this.isRead,
      incidentId: incidentId,
    );
  }
}
