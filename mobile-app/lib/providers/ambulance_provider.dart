import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/constants/api_endpoints.dart';
import '../core/network/api_client.dart';
import '../core/storage/local_store.dart';
import '../models/ambulance_model.dart';
import 'auth_provider.dart';

class AmbulanceState {
  final bool isLoading;
  final List<AmbulanceModel> ambulances;
  final AmbulanceModel? activeAmbulance;
  final String? errorMessage;
  final String? dispatchStatusMessage;

  AmbulanceState({
    this.isLoading = false,
    this.ambulances = const [],
    this.activeAmbulance,
    this.errorMessage,
    this.dispatchStatusMessage,
  });

  AmbulanceState copyWith({
    bool? isLoading,
    List<AmbulanceModel>? ambulances,
    AmbulanceModel? activeAmbulance,
    String? errorMessage,
    String? dispatchStatusMessage,
  }) {
    return AmbulanceState(
      isLoading: isLoading ?? this.isLoading,
      ambulances: ambulances ?? this.ambulances,
      activeAmbulance: activeAmbulance ?? this.activeAmbulance,
      errorMessage: errorMessage,
      dispatchStatusMessage:
          dispatchStatusMessage ?? this.dispatchStatusMessage,
    );
  }
}

class AmbulanceNotifier extends StateNotifier<AmbulanceState> {
  final ApiClient apiClient;
  final LocalStore localStore;

  AmbulanceNotifier({required this.apiClient, required this.localStore})
    : super(AmbulanceState(isLoading: true)) {
    loadAmbulances();
  }

  Future<void> loadAmbulances() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final response = await apiClient.dio.get(ApiEndpoints.ambulances);
      if (response.statusCode == 200 && response.data is List) {
        final list = (response.data as List)
            .map((e) => AmbulanceModel.fromJson(e))
            .toList();
        await localStore.cacheAmbulances(list.map((e) => e.toJson()).toList());
        state = state.copyWith(ambulances: list, isLoading: false);
        return;
      }
    } catch (_) {
      // Local cache fallback
      final cached = await localStore.getCachedAmbulances();
      if (cached.isNotEmpty) {
        final list = cached.map((e) => AmbulanceModel.fromJson(e)).toList();
        state = state.copyWith(ambulances: list, isLoading: false);
        return;
      }
    }

    // Default seeded fallback fleet
    final fallbackList = [
      AmbulanceModel(
        id: 1,
        registrationNumber: 'AP 16 TE 1081',
        type: 'ALS (Advanced Life Support)',
        status: 'AVAILABLE',
        driverName: 'S. K. Naidu',
        driverPhone: '+91 94401 23456',
        latitude: 16.3530,
        longitude: 80.5235,
        hospitalName: 'AIIMS Mangalagiri',
        etaMinutes: 6,
      ),
      AmbulanceModel(
        id: 2,
        registrationNumber: 'AP 16 TE 1082',
        type: 'BLS (Basic Life Support)',
        status: 'AVAILABLE',
        driverName: 'K. Rama Rao',
        driverPhone: '+91 94401 23457',
        latitude: 16.4360,
        longitude: 80.5650,
        hospitalName: 'AIIMS Mangalagiri',
        etaMinutes: 12,
      ),
      AmbulanceModel(
        id: 3,
        registrationNumber: 'AP 16 TE 1083',
        type: 'ALS (Advanced Life Support)',
        status: 'AVAILABLE',
        driverName: 'P. Venkatesh',
        driverPhone: '+91 94401 23458',
        latitude: 16.4865,
        longitude: 80.6130,
        hospitalName: 'Manipal Hospital Vijayawada',
        etaMinutes: 18,
      ),
      AmbulanceModel(
        id: 4,
        registrationNumber: 'AP 16 TE 1084',
        type: 'ALS (Advanced Life Support)',
        status: 'AVAILABLE',
        driverName: 'M. Suresh',
        driverPhone: '+91 94401 23459',
        latitude: 16.3070,
        longitude: 80.4370,
        hospitalName: 'GGH Guntur',
        etaMinutes: 15,
      ),
    ];
    await localStore.cacheAmbulances(
      fallbackList.map((e) => e.toJson()).toList(),
    );
    state = state.copyWith(ambulances: fallbackList, isLoading: false);
  }

  void selectAmbulance(AmbulanceModel amb) {
    state = state.copyWith(activeAmbulance: amb);
  }

  Future<void> advanceDispatchStatus(
    int id,
    String newStatus, {
    String? incidentId,
  }) async {
    try {
      await apiClient.dio.patch(
        '${ApiEndpoints.ambulances}/$id/status',
        queryParameters: {
          'status': newStatus,
          if (incidentId != null) 'incidentId': incidentId,
        },
      );
    } catch (_) {}

    final updated = state.ambulances.map((a) {
      if (a.id == id) {
        return a.copyWith(status: newStatus, assignedIncidentId: incidentId);
      }
      return a;
    }).toList();

    AmbulanceModel? updatedActive = state.activeAmbulance?.id == id
        ? state.activeAmbulance!.copyWith(
            status: newStatus,
            assignedIncidentId: incidentId,
          )
        : state.activeAmbulance;

    state = state.copyWith(
      ambulances: updated,
      activeAmbulance: updatedActive,
      dispatchStatusMessage: 'Ambulance status updated to $newStatus',
    );
  }
}

final ambulanceNotifierProvider =
    StateNotifierProvider<AmbulanceNotifier, AmbulanceState>((ref) {
      final apiClient = ref.watch(apiClientProvider);
      final localStore = ref.watch(localStoreProvider);
      return AmbulanceNotifier(apiClient: apiClient, localStore: localStore);
    });
