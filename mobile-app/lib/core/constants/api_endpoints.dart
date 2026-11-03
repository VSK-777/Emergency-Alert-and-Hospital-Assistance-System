class ApiEndpoints {
  // Live Cloud Production Backend on Render
  static const String liveBackendUrl =
      'https://emergency-alert-and-hospital-assistance.onrender.com/api/v1';

  // Configurable base URL with live cloud production default
  static String get baseUrl {
    const envUrl = String.fromEnvironment('BACKEND_URL');
    if (envUrl.isNotEmpty) return envUrl;
    return liveBackendUrl;
  }

  // Authentication
  static String get authLogin => '$baseUrl/auth/login';
  static String get authRegister => '$baseUrl/auth/register';
  static String get authMe => '$baseUrl/auth/me';

  // Emergencies
  static String get emergencies => '$baseUrl/emergencies';
  static String get activeEmergencies => '$baseUrl/emergencies/active';
  static String get emergencyStream => '$baseUrl/emergencies/stream';
  static String emergencyById(String id) => '$baseUrl/emergencies/$id';
  static String emergencyStatus(String id) => '$baseUrl/emergencies/$id/status';
  static String emergencyCancel(String id) => '$baseUrl/emergencies/$id/cancel';

  // Hospitals
  static String get hospitals => '$baseUrl/hospitals';
  static String hospitalNearby(
    double lat,
    double lng, {
    double radiusKm = 25.0,
  }) => '$baseUrl/hospitals/nearby?lat=$lat&lng=$lng&radiusKm=$radiusKm';
  static String hospitalById(int id) => '$baseUrl/hospitals/$id';

  // Ambulances
  static String get ambulances => '$baseUrl/ambulances';
  static String ambulanceById(int id) => '$baseUrl/ambulances/$id';
  static String ambulanceStatus(int id) => '$baseUrl/ambulances/$id/status';
  static String ambulanceLocation(int id) => '$baseUrl/ambulances/$id/location';

  // Responders
  static String get responders => '$baseUrl/responders';
  static String respondersNearby(double lat, double lng) =>
      '$baseUrl/responders?latitude=$lat&longitude=$lng';
  static String get responderAvailability => '$baseUrl/responders/availability';

  // Emergency Contacts & Sync
  static String get emergencyContacts => '$baseUrl/emergency-contacts';
  static String get syncBatch => '$baseUrl/sync';

  // Medical Expenses
  static String get expenses => '$baseUrl/medical-expenses';
  static String get myExpenses => '$baseUrl/medical-expenses/my';
  static String expensesByIncident(String incidentId) =>
      '$baseUrl/medical-expenses/incident/$incidentId';

  // AI Assistant Triage
  static String get aiTriage => '$baseUrl/ai/triage';

  // Notifications
  static String get notifications => '$baseUrl/notifications';
  static String notificationsByIncident(String incidentId) =>
      '$baseUrl/notifications/incident/$incidentId';

  // Devices & ESP32 Hardware Triage
  static String get devices => '$baseUrl/devices';
  static String get devicePairingChallenge => '$baseUrl/devices/pairing-challenge';
  static String get deviceClaim => '$baseUrl/devices/claim';
  static String get deviceTelemetry => '$baseUrl/devices/telemetry';
  static String deviceById(String id) => '$baseUrl/devices/$id';
  static String get esp32TelemetryLatest =>
      '$baseUrl/devices/CSP-Triage-V1/telemetry/latest';
  static String get esp32TelemetryHistory =>
      '$baseUrl/devices/CSP-Triage-V1/telemetry/history';

  // Files & Medical Documents (Supabase S3 Storage)
  static String get filesUpload => '$baseUrl/files/upload';
  static String get filesMy => '$baseUrl/files/my';
  static String fileDownload(int id) => '$baseUrl/files/$id/download';
  static String fileById(int id) => '$baseUrl/files/$id';
}
