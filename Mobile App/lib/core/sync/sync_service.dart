import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:dio/dio.dart';
import '../constants/api_endpoints.dart';
import '../network/api_client.dart';
import '../storage/local_store.dart';

class SyncService {
  final ApiClient apiClient;
  final LocalStore localStore;

  SyncService({required this.apiClient, required this.localStore});

  Future<bool> isOnline() async {
    final connectivity = await Connectivity().checkConnectivity();
    return !connectivity.contains(ConnectivityResult.none);
  }

  Future<Map<String, dynamic>> syncPendingIncidents() async {
    final pending = await localStore.getPendingIncidents();
    final unsynced = pending.where((i) => i['syncStatus'] != 'SYNCED').toList();

    if (unsynced.isEmpty) {
      return {
        'synced': 0,
        'duplicates': 0,
        'failures': 0,
        'message': 'No pending incidents to sync',
      };
    }

    final online = await isOnline();
    if (!online) {
      return {
        'synced': 0,
        'duplicates': 0,
        'failures': 0,
        'message': 'Device is currently offline',
      };
    }

    try {
      final payload = {
        'deviceId': 'FLUTTER_MOBILE_CLIENT',
        'incidents': unsynced.map((inc) {
          return {
            'id': inc['id'],
            'source': inc['source'] ?? 'MOBILE_SOS',
            'latitude': inc['latitude'],
            'longitude': inc['longitude'],
            'accuracyMeters': inc['accuracyMeters'],
            'detectionReason': inc['detectionReason'],
            'detectionScore': inc['detectionScore'],
            'idempotencyKey': inc['idempotencyKey'] ?? inc['id'],
          };
        }).toList(),
      };

      final response = await apiClient.dio.post(
        ApiEndpoints.syncBatch,
        data: payload,
      );

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        final List syncedIds = data['syncedIncidentIds'] ?? [];
        final List duplicateIds = data['duplicateIgnoredIds'] ?? [];

        for (var id in [...syncedIds, ...duplicateIds]) {
          await localStore.markIncidentSynced(id.toString());
        }

        return {
          'synced': syncedIds.length,
          'duplicates': duplicateIds.length,
          'failures': (data['failures'] as List?)?.length ?? 0,
          'message': 'Sync batch processed successfully',
        };
      }
    } catch (e) {
      return {
        'synced': 0,
        'duplicates': 0,
        'failures': unsynced.length,
        'message': 'Sync failed: $e',
      };
    }

    return {
      'synced': 0,
      'duplicates': 0,
      'failures': 0,
      'message': 'Unknown sync result',
    };
  }
}
