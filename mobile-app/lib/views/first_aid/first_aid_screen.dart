import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_icons.dart';
import '../../models/first_aid_model.dart';
import '../../providers/first_aid_provider.dart';

class FirstAidScreen extends ConsumerWidget {
  const FirstAidScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final firstAidAsync = ref.watch(firstAidListProvider);
    final filteredItems = ref.watch(filteredFirstAidProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Offline First Aid Guide')),
      body: Column(
        children: [
          // Offline notice & search
          Container(
            padding: const EdgeInsets.all(12),
            color: Colors.white,
            child: Column(
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.offline_pin,
                      size: 16,
                      color: AppTheme.verifiedGreen,
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        '100% Offline Knowledge Base • Authoritative Life Support (Red Cross / WHO)',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Colors.green.shade900,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                TextField(
                  onChanged: (val) =>
                      ref.read(firstAidSearchQueryProvider.notifier).state =
                          val,
                  decoration: InputDecoration(
                    hintText:
                        'Search symptoms (CPR, bleeding, burn, choking)...',
                    prefixIcon: const Icon(Icons.search),
                    contentPadding: const EdgeInsets.symmetric(
                      vertical: 0,
                      horizontal: 12,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
              ],
            ),
          ),

          Expanded(
            child: firstAidAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, _) =>
                  Center(child: Text('Failed to load first aid guide: $err')),
              data: (_) {
                if (filteredItems.isEmpty) {
                  return const Center(
                    child: Text(
                      'No emergency guidelines match your search query.',
                    ),
                  );
                }

                return ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: filteredItems.length,
                  itemBuilder: (context, index) {
                    final item = filteredItems[index];
                    return _FirstAidCard(item: item);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _FirstAidCard extends StatelessWidget {
  final FirstAidModel item;

  const _FirstAidCard({required this.item});

  @override
  Widget build(BuildContext context) {
    final isCritical = item.urgency == 'CRITICAL';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      clipBehavior: Clip.antiAlias,
      child: ExpansionTile(
        leading: CircleAvatar(
          backgroundColor: isCritical
              ? AppTheme.emergencyRed.withOpacity(0.12)
              : AppTheme.trustBlue.withOpacity(0.12),
          child: Icon(
            isCritical ? AppIcons.emergencyBeacon : AppIcons.firstAid,
            color: isCritical ? AppTheme.emergencyRed : AppTheme.trustBlue,
          ),
        ),
        title: Text(
          item.title,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
        ),
        subtitle: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: isCritical
                    ? AppTheme.emergencyRed
                    : AppTheme.warningOrange,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                item.urgency,
                style: const TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                item.overview,
                style: const TextStyle(
                  fontSize: 11,
                  color: AppTheme.textSecondaryLight,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Divider(),
                Text(
                  'Attribution: ${item.attribution}',
                  style: const TextStyle(
                    fontSize: 10,
                    fontStyle: FontStyle.italic,
                    color: AppTheme.textSecondaryLight,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Immediate Action Steps:',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.trustBlue,
                  ),
                ),
                const SizedBox(height: 6),
                ...item.steps.asMap().entries.map((entry) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 6.0),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        CircleAvatar(
                          radius: 9,
                          backgroundColor: AppTheme.trustBlue.withOpacity(0.15),
                          child: Text(
                            '${entry.key + 1}',
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.trustBlue,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            entry.value,
                            style: const TextStyle(fontSize: 12, height: 1.3),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
                if (item.warnings.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.red.shade200),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(
                              Icons.warning_amber_rounded,
                              size: 14,
                              color: AppTheme.emergencyDarkRed,
                            ),
                            SizedBox(width: 4),
                            Text(
                              'SAFETY WARNINGS:',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.emergencyDarkRed,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        ...item.warnings.map(
                          (w) => Text(
                            '• $w',
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppTheme.emergencyDarkRed,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
