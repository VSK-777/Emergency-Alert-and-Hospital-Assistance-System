import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/constants/api_endpoints.dart';
import '../core/network/api_client.dart';
import '../core/storage/local_store.dart';
import '../models/user_model.dart';

final localStoreProvider = Provider<LocalStore>((ref) => LocalStore());

final apiClientProvider = Provider<ApiClient>((ref) {
  final localStore = ref.watch(localStoreProvider);
  return ApiClient(localStore: localStore);
});

class AuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final bool isOfflineEmergencyMode;
  final UserModel? user;
  final String? errorMessage;

  AuthState({
    this.isLoading = false,
    this.isAuthenticated = false,
    this.isOfflineEmergencyMode = false,
    this.user,
    this.errorMessage,
  });

  AuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    bool? isOfflineEmergencyMode,
    UserModel? user,
    String? errorMessage,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isOfflineEmergencyMode:
          isOfflineEmergencyMode ?? this.isOfflineEmergencyMode,
      user: user ?? this.user,
      errorMessage: errorMessage,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient apiClient;
  final LocalStore localStore;

  AuthNotifier({required this.apiClient, required this.localStore})
    : super(AuthState(isLoading: true)) {
    checkInitialAuth();
  }

  Future<void> checkInitialAuth() async {
    final token = await localStore.getToken();
    final cachedUserMap = await localStore.getUserProfile();

    if (token != null && cachedUserMap != null) {
      state = AuthState(
        isAuthenticated: true,
        user: UserModel.fromJson(cachedUserMap),
        isLoading: false,
      );
    } else {
      state = AuthState(isAuthenticated: false, isLoading: false);
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final response = await apiClient.dio.post(
        ApiEndpoints.authLogin,
        data: {'email': email.trim(), 'password': password},
      );

      if (response.statusCode == 200) {
        final data = response.data;
        final token = data['token'];
        final user = UserModel(
          id: data['id'],
          email: data['email'],
          fullName: data['fullName'],
          phoneNumber: data['phoneNumber'] ?? '',
          role: data['role'] ?? 'CITIZEN',
          bloodGroup: data['bloodGroup'] ?? 'O+',
          allergies: data['allergies'] ?? 'None',
          medicalConditions: data['medicalConditions'] ?? 'None',
        );

        await localStore.saveToken(token);
        await localStore.saveUserProfile(user.toJson());

        state = AuthState(isAuthenticated: true, user: user, isLoading: false);
        return true;
      }
    } catch (e) {
      // Offline fallback: check if matches cached profile
      final cachedUser = await localStore.getUserProfile();
      if (cachedUser != null && cachedUser['email'] == email.trim()) {
        state = AuthState(
          isAuthenticated: true,
          user: UserModel.fromJson(cachedUser),
          isLoading: false,
        );
        return true;
      }

      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Login failed. Please check credentials or connectivity.',
      );
    }
    return false;
  }

  // Emergency Guest / Offline Mode
  void loginOfflineEmergencyMode() {
    final offlineUser = UserModel(
      id: 9999,
      email: 'emergency.offline@vvit.net',
      fullName: 'Emergency Citizen (Offline Mode)',
      phoneNumber: '+919876543210',
      role: 'CITIZEN',
      bloodGroup: 'O+',
      allergies: 'Penicillin (Reported)',
      medicalConditions: 'Asthma',
    );
    state = AuthState(
      isAuthenticated: true,
      isOfflineEmergencyMode: true,
      user: offlineUser,
      isLoading: false,
    );
  }

  Future<bool> register(Map<String, dynamic> regData) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final response = await apiClient.dio.post(
        ApiEndpoints.authRegister,
        data: regData,
      );

      if (response.statusCode == 201) {
        final data = response.data;
        final token = data['token'];
        final user = UserModel(
          id: data['id'],
          email: data['email'],
          fullName: data['fullName'],
          phoneNumber: data['phoneNumber'] ?? '',
          role: data['role'] ?? 'CITIZEN',
          bloodGroup: regData['bloodGroup'],
          allergies: regData['allergies'],
          medicalConditions: regData['medicalConditions'],
          organization: regData['organization'],
        );

        await localStore.saveToken(token);
        await localStore.saveUserProfile(user.toJson());

        state = AuthState(isAuthenticated: true, user: user, isLoading: false);
        return true;
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Registration error: $e',
      );
    }
    return false;
  }

  Future<void> updateProfile(UserModel updatedUser) async {
    await localStore.saveUserProfile(updatedUser.toJson());
    state = state.copyWith(user: updatedUser);
  }

  Future<void> logout() async {
    await localStore.clearToken();
    state = AuthState(isAuthenticated: false, user: null);
  }
}

final authNotifierProvider = StateNotifierProvider<AuthNotifier, AuthState>((
  ref,
) {
  final apiClient = ref.watch(apiClientProvider);
  final localStore = ref.watch(localStoreProvider);
  return AuthNotifier(apiClient: apiClient, localStore: localStore);
});
