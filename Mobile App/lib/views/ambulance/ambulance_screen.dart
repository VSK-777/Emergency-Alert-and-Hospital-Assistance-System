import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/ambulance_provider.dart';
import '../../models/ambulance_model.dart';

class AmbulanceScreen extends ConsumerWidget {
  const AmbulanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ambState = ref.watch(ambulanceNotifierProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Ambulance Fleet & Dispatch'),
        backgroundColor: Colors.deepOrange.shade800,
        actions: [
          IconButton(
            tooltip: 'Refresh Fleet',
            icon: const Icon(Icons.refresh),
            onPressed: () =>
                ref.read(ambulanceNotifierProvider.notifier).loadAmbulances(),
          ),
        ],
      ),
      body: ambState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Active Dispatched Unit Card
                  if (ambState.activeAmbulance != null)
                    _buildActiveAmbulanceCard(
                      context,
                      ref,
                      ambState.activeAmbulance!,
                    )
                  else
                    _buildNoActiveCard(context),

                  const SizedBox(height: 20),

                  // Fleet Directory
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Regional Ambulance Network:',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        '${ambState.ambulances.length} Units Available',
                        style: const TextStyle(
                          fontSize: 11,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: ambState.ambulances.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final amb = ambState.ambulances[index];
                      return _buildAmbulanceTile(context, ref, amb);
                    },
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildActiveAmbulanceCard(
    BuildContext context,
    WidgetRef ref,
    AmbulanceModel amb,
  ) {
    Color statusColor = Colors.orange;
    if (amb.status == 'COMPLETED') statusColor = Colors.green;
    if (amb.status == 'EN_ROUTE_TO_PATIENT') statusColor = Colors.deepOrange;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.deepOrange.shade400, width: 2),
        boxShadow: [
          BoxShadow(
            color: Colors.deepOrange.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.emergency,
                    color: Colors.deepOrange,
                    size: 24,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    amb.registrationNumber,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  amb.status,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: statusColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Type: ${amb.type} • Hospital: ${amb.hospitalName ?? 'AIIMS Mangalagiri'}',
            style: const TextStyle(fontSize: 12, color: Colors.black87),
          ),
          Text(
            'Driver: ${amb.driverName} (${amb.driverPhone}) • ETA: ${amb.etaMinutes} mins',
            style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
          ),
          const SizedBox(height: 12),

          // Dispatch Stage Progression Bar
          const Text(
            'Dispatch Lifecycle Progression:',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 6),
          _buildProgressionBar(amb.status),
          const SizedBox(height: 14),

          // Actions
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.deepOrange,
                    side: const BorderSide(color: Colors.deepOrange),
                  ),
                  icon: const Icon(Icons.phone, size: 16),
                  label: const Text('Call Driver'),
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          'Simulated Call: Dialing ${amb.driverName} at ${amb.driverPhone}',
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.deepOrange,
                    foregroundColor: Colors.white,
                  ),
                  icon: const Icon(Icons.arrow_forward, size: 16),
                  label: const Text('Advance Stage'),
                  onPressed: () {
                    String next = 'EN_ROUTE_TO_PATIENT';
                    if (amb.status == 'AVAILABLE' || amb.status == 'IDLE')
                      next = 'ASSIGNED';
                    else if (amb.status == 'ASSIGNED')
                      next = 'EN_ROUTE_TO_PATIENT';
                    else if (amb.status == 'EN_ROUTE_TO_PATIENT')
                      next = 'PATIENT_PICKED_UP';
                    else if (amb.status == 'PATIENT_PICKED_UP')
                      next = 'EN_ROUTE_TO_HOSPITAL';
                    else if (amb.status == 'EN_ROUTE_TO_HOSPITAL')
                      next = 'COMPLETED';

                    ref
                        .read(ambulanceNotifierProvider.notifier)
                        .advanceDispatchStatus(amb.id, next);
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildNoActiveCard(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: const Row(
        children: [
          Icon(Icons.info_outline, color: Colors.grey),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'No active ambulance dispatch in progress. Select an ambulance below to dispatch or simulate a call.',
              style: TextStyle(fontSize: 12, color: Colors.black87),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressionBar(String status) {
    int step = 1;
    if (status == 'ASSIGNED') step = 2;
    if (status == 'EN_ROUTE_TO_PATIENT') step = 3;
    if (status == 'PATIENT_PICKED_UP') step = 4;
    if (status == 'EN_ROUTE_TO_HOSPITAL') step = 5;
    if (status == 'COMPLETED') step = 6;

    return LinearProgressIndicator(
      value: step / 6.0,
      backgroundColor: Colors.grey.shade300,
      valueColor: const AlwaysStoppedAnimation<Color>(Colors.deepOrange),
      minHeight: 6,
    );
  }

  Widget _buildAmbulanceTile(
    BuildContext context,
    WidgetRef ref,
    AmbulanceModel amb,
  ) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  amb.registrationNumber,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: amb.type.contains('ALS')
                        ? Colors.red.shade100
                        : Colors.blue.shade100,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    amb.type,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: amb.type.contains('ALS')
                          ? Colors.red.shade900
                          : Colors.blue.shade900,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              'Stationed at: ${amb.hospitalName ?? 'AIIMS Mangalagiri'} • Status: ${amb.status}',
              style: TextStyle(fontSize: 11, color: Colors.grey.shade700),
            ),
            Text(
              'Driver: ${amb.driverName} • ${amb.driverPhone}',
              style: const TextStyle(fontSize: 11),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    visualDensity: VisualDensity.compact,
                  ),
                  onPressed: () {
                    ref
                        .read(ambulanceNotifierProvider.notifier)
                        .selectAmbulance(amb);
                  },
                  child: const Text(
                    'Track / Dispatch',
                    style: TextStyle(fontSize: 11),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
