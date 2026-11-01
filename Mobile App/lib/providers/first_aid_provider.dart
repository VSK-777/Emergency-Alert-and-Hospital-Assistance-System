import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/first_aid_model.dart';

final firstAidListProvider = FutureProvider<List<FirstAidModel>>((ref) async {
  final jsonString = await rootBundle.loadString('assets/first_aid.json');
  final List decoded = jsonDecode(jsonString);
  return decoded.map((e) => FirstAidModel.fromJson(e)).toList();
});

final firstAidSearchQueryProvider = StateProvider<String>((ref) => '');

final filteredFirstAidProvider = Provider<List<FirstAidModel>>((ref) {
  final query = ref.watch(firstAidSearchQueryProvider).toLowerCase().trim();
  final firstAidAsync = ref.watch(firstAidListProvider);

  return firstAidAsync.maybeWhen(
    data: (list) {
      if (query.isEmpty) return list;
      return list.where((item) {
        return item.title.toLowerCase().contains(query) ||
            item.overview.toLowerCase().contains(query) ||
            item.steps.any((s) => s.toLowerCase().contains(query));
      }).toList();
    },
    orElse: () => [],
  );
});
