import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:uuid/uuid.dart';
import '../core/constants/api_endpoints.dart';
import '../core/network/api_client.dart';
import '../core/storage/local_store.dart';
import '../core/sync/sync_service.dart';
import '../models/incident_model.dart';
import 'auth_provider.dart';

final syncServiceProvider = Provider<SyncService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final localStore = ref.watch(localStoreProvider);
  return SyncService(apiClient: apiClient, localStore: localStore);
});

class EmergencyState {
  final bool isCountdownActive;
  final int countdownSeconds;
  final IncidentModel? activeIncident;
  final List<IncidentModel> incidentHistory;
  final bool isSyncing;
  final String? statusMessage;
  final IncidentModel? incomingSmartwatchAlert;
  final double currentLatitude;
  final double currentLongitude;
  final String selectedCategory;

  EmergencyState({
    this.isCountdownActive = false,
    this.countdownSeconds = 10,
    this.activeIncident,
    this.incidentHistory = const [],
    this.isSyncing = false,
    this.statusMessage,
    this.incomingSmartwatchAlert,
    this.currentLatitude = 16.3533,
    this.currentLongitude = 80.5238,
    this.selectedCategory = 'MEDICAL_EMERGENCY',
  });

  EmergencyState copyWith({
    bool? isCountdownActive,
    int? countdownSeconds,
    IncidentModel? activeIncident,
    List<IncidentModel>? incidentHistory,
    bool? isSyncing,
    String? statusMessage,
    IncidentModel? incomingSmartwatchAlert,
    bool clearIncomingAlert = false,
    double? currentLatitude,
    double? currentLongitude,
    String? selectedCategory,
  }) {
    return EmergencyState(
      isCountdownActive: isCountdownActive ?? this.isCountdownActive,
      countdownSeconds: countdownSeconds ?? this.countdownSeconds,
      activeIncident: activeIncident ?? this.activeIncident,
      incidentHistory: incidentHistory ?? this.incidentHistory,
      isSyncing: isSyncing ?? this.isSyncing,
      statusMessage: statusMessage ?? this.statusMessage,
      incomingSmartwatchAlert: clearIncomingAlert
          ? null
          : (incomingSmartwatchAlert ?? this.incomingSmartwatchAlert),
      currentLatitude: currentLatitude ?? this.currentLatitude,
      currentLongitude: currentLongitude ?? this.currentLongitude,
      selectedCategory: selectedCategory ?? this.selectedCategory,
    );
  }
}

class EmergencyNotifier extends StateNotifier<EmergencyState> {
  final ApiClient apiClient;
  final LocalStore localStore;
  final SyncService syncService;
  Timer? _countdownTimer;
  Timer? _pollTimer;
  final Set<String> _seenIncidentIds = {};

  EmergencyNotifier({
    required this.apiClient,
    required this.localStore,
    required this.syncService,
  }) : super(EmergencyState()) {
    loadLocalIncidents();
    _fetchGpsLocation();
    _startLiveMonitoring();
  }

  Future<void> _fetchGpsLocation() async {
    try {
      final lastLoc = await localStore.getLastKnownLocation();
      state = state.copyWith(
        currentLatitude: (lastLoc['lat'] as num?)?.toDouble() ?? 16.3533,
        currentLongitude: (lastLoc['lng'] as num?)?.toDouble() ?? 80.5238,
      );

      if (!kIsWeb) {
        bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
        if (!serviceEnabled) return;

        LocationPermission permission = await Geolocator.checkPermission();
        if (permission == LocationPermission.denied) {
          permission = await Geolocator.requestPermission();
          if (permission == LocationPermission.denied) return;
        }
        if (permission == LocationPermission.deniedForever) return;

        final pos = await Geolocator.getCurrentPosition(
          timeLimit: const Duration(seconds: 4),
        );
        state = state.copyWith(
          currentLatitude: pos.latitude,
          currentLongitude: pos.longitude,
        );
        await localStore.saveLastKnownLocation(pos.latitude, pos.longitude);
      }
    } catch (_) {
      // Fallback stays at VVIT campus coordinates
    }
  }

  void setCategory(String category) {
    state = state.copyWith(selectedCategory: category);
  }

  void _startLiveMonitoring() {
    if (!kIsWeb) {
      try {
        if (Platform.environment.containsKey('FLUTTER_TEST')) {
          return;
        }
      } catch (_) {}
    }

    checkActiveEmergencies();
    _pollTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      checkActiveEmergencies();
    });
  }

  Future<void> checkActiveEmergencies() async {
    try {
      final response = await apiClient.dio.get(ApiEndpoints.activeEmergencies);
      if (response.statusCode == 200 && response.data is List) {
        final list = (response.data as List)
            .map((e) => IncidentModel.fromJson(e))
            .toList();
        if (list.isEmpty) return;

        // Filter for Smartwatch alerts
        final watchIncidents = list
            .where(
              (inc) =>
                  inc.source == 'SMARTWATCH_AUTO' ||
                  inc.source == 'SMARTWATCH_SOS',
            )
            .toList();

        if (watchIncidents.isNotEmpty) {
          watchIncidents.sort((a, b) => b.createdAt.compareTo(a.createdAt));
          final latest = watchIncidents.first;

          if (!_seenIncidentIds.contains(latest.id)) {
            _seenIncidentIds.add(latest.id);

            await localStore.savePendingIncident(latest.toJson());
            await loadLocalIncidents();

            if (mounted) {
              state = state.copyWith(
                incomingSmartwatchAlert: latest,
                statusMessage: '🚨 Smartwatch Alert: ${latest.detectionReason}',
              );
            }
          }
        }
      }
    } catch (_) {
      // Handle silently during temporary offline
    }
  }

  void dismissIncomingAlert() {
    state = state.copyWith(clearIncomingAlert: true);
  }

  Future<void> loadLocalIncidents() async {
    final localList = await localStore.getPendingIncidents();
    if (!mounted) return;
    final incidents = localList.map((e) => IncidentModel.fromJson(e)).toList();
    incidents.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    state = state.copyWith(incidentHistory: incidents);
  }

  void startEmergencyCountdown({
    required String source,
    required String reason,
    String? category,
    double score = 1.0,
    int countdownDuration = 10,
  }) {
    _countdownTimer?.cancel();

    final selectedCat = category ?? state.selectedCategory;
    final incidentId = const Uuid().v4();
    final preliminaryIncident = IncidentModel(
      id: incidentId,
      source: source,
      category: selectedCat,
      status: 'PENDING',
      latitude: state.currentLatitude,
      longitude: state.currentLongitude,
      accuracyMeters: 4.5,
      detectionReason: reason,
      detectionScore: score,
      deliveryStatus: 'Saved locally',
      syncStatus: 'PENDING',
      idempotencyKey: 'key-$incidentId',
      createdAt: DateTime.now(),
    );

    state = state.copyWith(
      isCountdownActive: true,
      countdownSeconds: countdownDuration,
      activeIncident: preliminaryIncident,
      statusMessage: 'Emergency countdown started. Tap "I\'M OK" to cancel.',
    );

    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (state.countdownSeconds > 1) {
        state = state.copyWith(countdownSeconds: state.countdownSeconds - 1);
      } else {
        timer.cancel();
        state = state.copyWith(isCountdownActive: false, countdownSeconds: 0);
        confirmAndDispatchEmergency(state.activeIncident!);
      }
    });
  }

  void cancelEmergency() {
    _countdownTimer?.cancel();
    if (state.activeIncident != null) {
      final cancelled = state.activeIncident!.copyWith(
        status: 'CANCELLED',
        deliveryStatus: 'Cancelled (False Alarm)',
      );
      localStore.savePendingIncident(cancelled.toJson());
      loadLocalIncidents();
    }
    state = state.copyWith(
      isCountdownActive: false,
      countdownSeconds: 10,
      activeIncident: null,
      statusMessage: 'Emergency alert cancelled (False alarm marked)',
    );
  }

  Future<void> confirmAndDispatchEmergency(IncidentModel incident) async {
    state = state.copyWith(
      statusMessage: 'Saving incident locally...',
      activeIncident: incident.copyWith(deliveryStatus: 'Saved locally'),
    );

    // 1. Durably save locally first (Offline-First Guarantee)
    await localStore.savePendingIncident(incident.toJson());
    await loadLocalIncidents();

    // 2. Online transmission attempt
    final online = await syncService.isOnline();
    if (!online) {
      state = state.copyWith(
        statusMessage:
            'Incident saved offline. Will auto-sync when internet returns.',
        activeIncident: incident.copyWith(
          deliveryStatus: 'Saved locally (Offline)',
        ),
      );
      return;
    }

    try {
      state = state.copyWith(
        statusMessage:
            'Dispatching emergency alert to hospital & responders...',
      );
      final response = await apiClient.dio.post(
        ApiEndpoints.emergencies,
        data: incident.toJson(),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = response.data;
        final updatedIncident = incident.copyWith(
          status: data['status'] ?? 'DISPATCHED',
          assignedHospitalName:
              data['assignedHospitalName'] ?? 'AIIMS Mangalagiri',
          assignedResponderName:
              data['assignedResponderName'] ?? 'Ramesh Kumar T (NSS Volunteer)',
          assignedAmbulanceReg: data['assignedAmbulanceReg'] ?? 'AP 16 TE 1081',
          deliveryStatus: 'Delivered',
          syncStatus: 'SYNCED',
        );

        await localStore.savePendingIncident(updatedIncident.toJson());
        await loadLocalIncidents();

        state = state.copyWith(
          activeIncident: updatedIncident,
          statusMessage: 'Alert delivered! Hospital & Responders notified.',
        );
      }
    } catch (e) {
      state = state.copyWith(
        statusMessage:
            'Network unavailable. Incident preserved locally and queued for synchronization.',
        activeIncident: incident.copyWith(deliveryStatus: 'Queued for sync'),
      );
    }
  }

  Future<void> triggerSync() async {
    state = state.copyWith(isSyncing: true);
    final result = await syncService.syncPendingIncidents();
    await loadLocalIncidents();
    state = state.copyWith(isSyncing: false, statusMessage: result['message']);
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _pollTimer?.cancel();
    super.dispose();
  }
}

final emergencyNotifierProvider =
    StateNotifierProvider<EmergencyNotifier, EmergencyState>((ref) {
      final apiClient = ref.watch(apiClientProvider);
      final localStore = ref.watch(localStoreProvider);
      final syncService = ref.watch(syncServiceProvider);
      return EmergencyNotifier(
        apiClient: apiClient,
        localStore: localStore,
        syncService: syncService,
      );
    });
