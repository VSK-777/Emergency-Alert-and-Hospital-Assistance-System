import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocalStore {
  static const String _keyToken = 'auth_jwt_token';
  static const String _keyUser = 'cached_user_profile';
  static const String _keyIncidents = 'offline_pending_incidents';
  static const String _keyContacts = 'cached_emergency_contacts';
  static const String _keyHospitals = 'cached_hospitals';
  static const String _keyAmbulances = 'cached_ambulances';
  static const String _keyResponders = 'cached_responders';
  static const String _keyNotifications = 'cached_notifications';
  static const String _keyExpenses = 'cached_expenses';
  static const String _keyLastLocation = 'cached_last_known_location';

  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  // Auth Token
  Future<void> saveToken(String token) async {
    try {
      await _secureStorage.write(key: _keyToken, value: token);
    } catch (_) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_keyToken, token);
    }
  }

  Future<String?> getToken() async {
    try {
      final token = await _secureStorage.read(key: _keyToken);
      if (token != null && token.isNotEmpty) return token;
    } catch (_) {}
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyToken);
  }

  Future<void> clearToken() async {
    try {
      await _secureStorage.delete(key: _keyToken);
    } catch (_) {}
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyToken);
  }

  // User Profile
  Future<void> saveUserProfile(Map<String, dynamic> userMap) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyUser, jsonEncode(userMap));
  }

  Future<Map<String, dynamic>?> getUserProfile() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString(_keyUser);
    if (data == null) return null;
    try {
      return jsonDecode(data) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  // Offline Incidents Queue
  Future<List<Map<String, dynamic>>> getPendingIncidents() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString(_keyIncidents);
    if (data == null || data.isEmpty) return [];
    try {
      final list = jsonDecode(data) as List;
      return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> savePendingIncident(Map<String, dynamic> incidentMap) async {
    final incidents = await getPendingIncidents();
    final index = incidents.indexWhere((i) => i['id'] == incidentMap['id']);
    if (index >= 0) {
      incidents[index] = incidentMap;
    } else {
      incidents.add(incidentMap);
    }
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyIncidents, jsonEncode(incidents));
  }

  Future<void> removePendingIncident(String id) async {
    final incidents = await getPendingIncidents();
    incidents.removeWhere((i) => i['id'] == id);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyIncidents, jsonEncode(incidents));
  }

  Future<void> markIncidentSynced(String id) async {
    final incidents = await getPendingIncidents();
    for (var inc in incidents) {
      if (inc['id'] == id) {
        inc['syncStatus'] = 'SYNCED';
        inc['deliveryStatus'] = 'DELIVERED';
      }
    }
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyIncidents, jsonEncode(incidents));
  }

  // Emergency Contacts Cache
  Future<void> cacheContacts(List<Map<String, dynamic>> contacts) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyContacts, jsonEncode(contacts));
  }

  Future<List<Map<String, dynamic>>> getCachedContacts() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString(_keyContacts);
    if (data == null || data.isEmpty) return [];
    try {
      final list = jsonDecode(data) as List;
      return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } catch (_) {
      return [];
    }
  }

  // Hospitals Cache
  Future<void> cacheHospitals(List<Map<String, dynamic>> hospitals) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyHospitals, jsonEncode(hospitals));
  }

  Future<List<Map<String, dynamic>>> getCachedHospitals() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString(_keyHospitals);
    if (data == null || data.isEmpty) return [];
    try {
      final list = jsonDecode(data) as List;
      return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } catch (_) {
      return [];
    }
  }

  // Ambulances Cache
  Future<void> cacheAmbulances(List<Map<String, dynamic>> ambulances) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyAmbulances, jsonEncode(ambulances));
  }

  Future<List<Map<String, dynamic>>> getCachedAmbulances() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString(_keyAmbulances);
    if (data == null || data.isEmpty) return [];
    try {
      final list = jsonDecode(data) as List;
      return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } catch (_) {
      return [];
    }
  }

  // Responders Cache
  Future<void> cacheResponders(List<Map<String, dynamic>> responders) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyResponders, jsonEncode(responders));
  }

  Future<List<Map<String, dynamic>>> getCachedResponders() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString(_keyResponders);
    if (data == null || data.isEmpty) return [];
    try {
      final list = jsonDecode(data) as List;
      return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } catch (_) {
      return [];
    }
  }

  // Notifications Cache
  Future<void> cacheNotifications(
    List<Map<String, dynamic>> notifications,
  ) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyNotifications, jsonEncode(notifications));
  }

  Future<List<Map<String, dynamic>>> getCachedNotifications() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString(_keyNotifications);
    if (data == null || data.isEmpty) return [];
    try {
      final list = jsonDecode(data) as List;
      return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } catch (_) {
      return [];
    }
  }

  // Expenses Cache
  Future<void> cacheExpenses(List<Map<String, dynamic>> expenses) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyExpenses, jsonEncode(expenses));
  }

  Future<List<Map<String, dynamic>>> getCachedExpenses() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString(_keyExpenses);
    if (data == null || data.isEmpty) return [];
    try {
      final list = jsonDecode(data) as List;
      return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    } catch (_) {
      return [];
    }
  }

  // Last Known Location Cache (Defaults to VVIT campus coordinates)
  Future<void> saveLastKnownLocation(double lat, double lng) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _keyLastLocation,
      jsonEncode({
        'lat': lat,
        'lng': lng,
        'timestamp': DateTime.now().toIso8601String(),
      }),
    );
  }

  Future<Map<String, dynamic>> getLastKnownLocation() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString(_keyLastLocation);
    if (data != null) {
      try {
        return jsonDecode(data) as Map<String, dynamic>;
      } catch (_) {}
    }
    return {
      'lat': 16.3533,
      'lng': 80.5238,
      'timestamp': DateTime.now().toIso8601String(),
    };
  }
}
