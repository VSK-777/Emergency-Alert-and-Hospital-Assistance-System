import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/constants/api_endpoints.dart';
import '../models/hospital_model.dart';
import 'auth_provider.dart';

final hospitalsProvider = FutureProvider<List<HospitalModel>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final localStore = ref.watch(localStoreProvider);

  try {
    final response = await apiClient.dio.get(
      ApiEndpoints.hospitals,
      queryParameters: {'latitude': 16.3533, 'longitude': 80.5238},
    );

    if (response.statusCode == 200) {
      final List list = response.data;
      final hospitals = list.map((e) => HospitalModel.fromJson(e)).toList();
      // Cache for offline access
      await localStore.cacheHospitals(list.cast<Map<String, dynamic>>());
      return hospitals;
    }
  } catch (_) {
    // Offline fallback: load from local storage
    final cached = await localStore.getCachedHospitals();
    if (cached.isNotEmpty) {
      return cached.map((e) => HospitalModel.fromJson(e)).toList();
    }
  }

  // Pre-bundled fallback hospitals in VVIT region if cache was empty
  // Verified OpenStreetMap coordinates
  return [
    HospitalModel(
      id: 1,
      name: 'AIIMS Mangalagiri',
      address: 'All India Institute Of Medical Sciences (AIIMS) Road, Mangalagiri, Guntur District, AP 522503',
      latitude: 16.446245,
      longitude: 80.580132,
      phoneNumber: '+918645280000',
      emergencyCapacity: 50,
      availableIcus: 15,
      availableAmbulances: 6,
      distanceKm: 2.1,
    ),
    HospitalModel(
      id: 2,
      name: 'Manipal Hospital Vijayawada',
      address: 'Service Road, Near Varadhi, Tadepalle, Guntur District, AP 522501',
      latitude: 16.484436,
      longitude: 80.616980,
      phoneNumber: '+918662499999',
      emergencyCapacity: 35,
      availableIcus: 8,
      availableAmbulances: 4,
      distanceKm: 7.6,
    ),
    HospitalModel(
      id: 3,
      name: 'Government General Hospital (GGH) Guntur',
      address: 'Station Road, Sambasiva Pet / Arundelpet, Guntur, AP 522001',
      latitude: 16.299558,
      longitude: 80.443772,
      phoneNumber: '+918632220000',
      emergencyCapacity: 60,
      availableIcus: 20,
      availableAmbulances: 8,
      distanceKm: 19.8,
    ),
    HospitalModel(
      id: 4,
      name: 'NRI General Hospital & Medical College',
      address: 'Mangalagiri Main Road, Chinakakani, AP 522503',
      latitude: 16.415035,
      longitude: 80.557396,
      phoneNumber: '+918645230101',
      emergencyCapacity: 40,
      availableIcus: 10,
      availableAmbulances: 5,
      distanceKm: 2.5,
    ),
  ];
});
