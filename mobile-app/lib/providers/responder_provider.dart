import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/constants/api_endpoints.dart';
import '../core/network/api_client.dart';
import '../core/storage/local_store.dart';
import '../models/responder_model.dart';
import 'auth_provider.dart';

class ResponderState {
  final bool isLoading;
  final bool isOnCall;
  final List<ResponderModel> nearbyResponders;
  final ResponderModel? currentProfile;
  final Map<String, dynamic>? pendingDispatchAlert;
  final String? activeMissionId;
  final String? statusMessage;

  ResponderState({
    this.isLoading = false,
    this.isOnCall = true,
    this.nearbyResponders = const [],
    this.currentProfile,
    this.pendingDispatchAlert,
    this.activeMissionId,
    this.statusMessage,
  });

  ResponderState copyWith({
    bool? isLoading,
    bool? isOnCall,
    List<ResponderModel>? nearbyResponders,
    ResponderModel? currentProfile,
    Map<String, dynamic>? pendingDispatchAlert,
    bool clearPendingAlert = false,
    String? activeMissionId,
    bool clearActiveMission = false,
    String? statusMessage,
  }) {
    return ResponderState(
      isLoading: isLoading ?? this.isLoading,
      isOnCall: isOnCall ?? this.isOnCall,
      nearbyResponders: nearbyResponders ?? this.nearbyResponders,
      currentProfile: currentProfile ?? this.currentProfile,
      pendingDispatchAlert: clearPendingAlert
          ? null
          : (pendingDispatchAlert ?? this.pendingDispatchAlert),
      activeMissionId: clearActiveMission
          ? null
          : (activeMissionId ?? this.activeMissionId),
      statusMessage: statusMessage ?? this.statusMessage,
    );
  }
}

class ResponderNotifier extends StateNotifier<ResponderState> {
  final ApiClient apiClient;
  final LocalStore localStore;

  ResponderNotifier({required this.apiClient, required this.localStore})
    : super(ResponderState(isLoading: true)) {
    loadNearbyResponders(16.3533, 80.5238);
  }

  Future<void> loadNearbyResponders(double lat, double lng) async {
    state = state.copyWith(isLoading: true);
    try {
      final response = await apiClient.dio.get(
        ApiEndpoints.respondersNearby(lat, lng),
      );
      if (response.statusCode == 200 && response.data is List) {
        final list = (response.data as List)
            .map((e) => ResponderModel.fromJson(e))
            .toList();
        await localStore.cacheResponders(list.map((e) => e.toJson()).toList());
        state = state.copyWith(nearbyResponders: list, isLoading: false);
        return;
      }
    } catch (_) {
      final cached = await localStore.getCachedResponders();
      if (cached.isNotEmpty) {
        final list = cached.map((e) => ResponderModel.fromJson(e)).toList();
        state = state.copyWith(nearbyResponders: list, isLoading: false);
        return;
      }
    }

    // Default seeded fallback responders
    final fallbackList = [
      ResponderModel(
        id: 1,
        fullName: 'Ramesh Kumar T',
        phoneNumber: '+91 98765 43211',
        email: 'responder@vvit.net',
        organization: 'NSS - National Service Scheme',
        verificationStatus: 'VERIFIED',
        isAvailable: true,
        skills: ['CPR Certified', 'Bleeding Control', 'AED', 'Immobilization'],
        latitude: 16.3520,
        longitude: 80.5240,
        distanceKm: 0.2,
      ),
      ResponderModel(
        id: 2,
        fullName: 'Priya S',
        phoneNumber: '+91 98765 43215',
        email: 'volunteer.priya@vvit.net',
        organization: 'Youth Red Cross Volunteer',
        verificationStatus: 'VERIFIED',
        isAvailable: true,
        skills: ['BLS', 'First Aid', 'Triage Support', 'Oxygen Admin'],
        latitude: 16.3585,
        longitude: 80.5310,
        distanceKm: 0.9,
      ),
    ];
    await localStore.cacheResponders(
      fallbackList.map((e) => e.toJson()).toList(),
    );
    state = state.copyWith(nearbyResponders: fallbackList, isLoading: false);
  }

  Future<void> toggleAvailability(bool isAvailable) async {
    state = state.copyWith(isOnCall: isAvailable);
    try {
      await apiClient.dio.put(
        ApiEndpoints.responderAvailability,
        queryParameters: {'isAvailable': isAvailable},
      );
    } catch (_) {}
  }

  void triggerSimulatedDispatchAlert(Map<String, dynamic> incidentData) {
    state = state.copyWith(
      pendingDispatchAlert: incidentData,
      statusMessage:
          '🚨 New Emergency in your area (${incidentData['distance'] ?? '350m'})!',
    );
  }

  void acceptMission(String incidentId) {
    state = state.copyWith(
      clearPendingAlert: true,
      activeMissionId: incidentId,
      statusMessage: 'Mission Accepted! Navigating to emergency location...',
    );
  }

  void declineMission() {
    state = state.copyWith(
      clearPendingAlert: true,
      statusMessage:
          'Dispatch request declined. Forwarded to next available volunteer.',
    );
  }

  void completeMission() {
    state = state.copyWith(
      clearActiveMission: true,
      statusMessage:
          'Emergency assistance marked complete. Thank you for your service!',
    );
  }
}

final responderNotifierProvider =
    StateNotifierProvider<ResponderNotifier, ResponderState>((ref) {
      final apiClient = ref.watch(apiClientProvider);
      final localStore = ref.watch(localStoreProvider);
      return ResponderNotifier(apiClient: apiClient, localStore: localStore);
    });
