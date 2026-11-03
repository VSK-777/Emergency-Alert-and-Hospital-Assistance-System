import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/constants/api_endpoints.dart';
import '../core/network/api_client.dart';
import '../core/storage/local_store.dart';
import '../models/medical_expense_model.dart';
import 'auth_provider.dart';

class ExpenseState {
  final bool isLoading;
  final List<MedicalExpenseModel> expenses;
  final double totalExpenditure;
  final String? errorMessage;

  ExpenseState({
    this.isLoading = false,
    this.expenses = const [],
    this.totalExpenditure = 0.0,
    this.errorMessage,
  });

  ExpenseState copyWith({
    bool? isLoading,
    List<MedicalExpenseModel>? expenses,
    double? totalExpenditure,
    String? errorMessage,
  }) {
    return ExpenseState(
      isLoading: isLoading ?? this.isLoading,
      expenses: expenses ?? this.expenses,
      totalExpenditure: totalExpenditure ?? this.totalExpenditure,
      errorMessage: errorMessage,
    );
  }
}

class ExpenseNotifier extends StateNotifier<ExpenseState> {
  final ApiClient apiClient;
  final LocalStore localStore;

  ExpenseNotifier({required this.apiClient, required this.localStore})
    : super(ExpenseState(isLoading: true)) {
    loadExpenses();
  }

  Future<void> loadExpenses() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final response = await apiClient.dio.get(ApiEndpoints.expenses);
      if (response.statusCode == 200 && response.data is List) {
        final list = (response.data as List)
            .map((e) => MedicalExpenseModel.fromJson(e))
            .toList();
        await localStore.cacheExpenses(
          list.map((e) => e.toJson()).toList().cast<Map<String, dynamic>>(),
        );
        double sum = list.fold(0.0, (acc, item) => acc + item.amount);
        state = state.copyWith(
          expenses: list,
          totalExpenditure: sum,
          isLoading: false,
        );
        return;
      }
    } catch (_) {
      final cached = await localStore.getCachedExpenses();
      if (cached.isNotEmpty) {
        final list = cached
            .map((e) => MedicalExpenseModel.fromJson(e))
            .toList();
        double sum = list.fold(0.0, (acc, item) => acc + item.amount);
        state = state.copyWith(
          expenses: list,
          totalExpenditure: sum,
          isLoading: false,
        );
        return;
      }
    }

    // Default seeded fallback expenses
    final List<MedicalExpenseModel> initialList = [
      MedicalExpenseModel(
        id: 1,
        incidentId: 'inc-001',
        category: 'AMBULANCE',
        description: 'Emergency Rapid Response Ambulance Transit to AIIMS',
        amount: 1200.0,
        status: 'VERIFIED',
        createdAt: DateTime.now().subtract(const Duration(days: 1)),
      ),
      MedicalExpenseModel(
        id: 2,
        incidentId: 'inc-001',
        category: 'HOSPITAL',
        description: 'Emergency Room Triage & Trauma Bed Admission Fee',
        amount: 3500.0,
        status: 'PAID',
        createdAt: DateTime.now().subtract(const Duration(days: 1)),
      ),
      MedicalExpenseModel(
        id: 3,
        incidentId: 'inc-001',
        category: 'DIAGNOSTICS',
        description: 'Stat Cervical Spine X-Ray & Trauma Panel Blood Test',
        amount: 1850.0,
        status: 'VERIFIED',
        createdAt: DateTime.now().subtract(const Duration(hours: 18)),
      ),
    ];

    await localStore.cacheExpenses(
      initialList.map((e) => e.toJson()).toList().cast<Map<String, dynamic>>(),
    );
    double sum = initialList.fold(0.0, (acc, item) => acc + item.amount);
    state = state.copyWith(
      expenses: initialList,
      totalExpenditure: sum,
      isLoading: false,
    );
  }

  Future<bool> addExpense({
    required String category,
    required String description,
    required double amount,
    String? incidentId,
  }) async {
    final newExp = MedicalExpenseModel(
      id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
      incidentId:
          incidentId ?? 'inc-local-${DateTime.now().millisecondsSinceEpoch}',
      category: category,
      description: description,
      amount: amount,
      status: 'PENDING',
      createdAt: DateTime.now(),
    );

    try {
      await apiClient.dio.post(ApiEndpoints.expenses, data: newExp.toJson());
    } catch (_) {}

    final updated = [newExp, ...state.expenses];
    await localStore.cacheExpenses(
      updated.map((e) => e.toJson()).toList().cast<Map<String, dynamic>>(),
    );
    double sum = updated.fold(0.0, (acc, item) => acc + item.amount);
    state = state.copyWith(expenses: updated, totalExpenditure: sum);
    return true;
  }
}

final expenseNotifierProvider =
    StateNotifierProvider<ExpenseNotifier, ExpenseState>((ref) {
      final apiClient = ref.watch(apiClientProvider);
      final localStore = ref.watch(localStoreProvider);
      return ExpenseNotifier(apiClient: apiClient, localStore: localStore);
    });
