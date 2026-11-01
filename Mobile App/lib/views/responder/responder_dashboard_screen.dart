import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/responder_provider.dart';
import '../../models/responder_model.dart';

class ResponderDashboardScreen extends ConsumerWidget {
  const ResponderDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final responderState = ref.watch(responderNotifierProvider);
    final authState = ref.watch(authNotifierProvider);
    final user = authState.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Community Responder Hub'),
        backgroundColor: Colors.green.shade800,
        actions: [
          IconButton(
            tooltip: 'Simulate Proximity Emergency Alert',
            icon: const Icon(Icons.add_alert_outlined),
            onPressed: () {
              ref
                  .read(responderNotifierProvider.notifier)
                  .triggerSimulatedDispatchAlert({
                    'id': 'inc-prox-882',
                    'category': 'Road Accident & Trauma',
                    'location': 'Near VVIT Main Gate (NH 16 Bypass)',
                    'distance': '250 meters away',
                    'patient': 'Motorcyclist injured, conscious with leg bleed',
                  });
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Volunteer Profile Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade300),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        backgroundColor: Colors.green.shade100,
                        radius: 24,
                        child: const Icon(
                          Icons.volunteer_activism,
                          color: Colors.green,
                          size: 28,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              user?.fullName ??
                                  'Ramesh Kumar T (NSS Volunteer)',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              user?.organization ??
                                  'National Service Scheme (NSS) • Unit 4',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey.shade700,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 6,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.green.shade100,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: const Text(
                                    'VERIFIED RESPONDER',
                                    style: TextStyle(
                                      fontSize: 9,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.green,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Divider(),
                  // On-Call Toggle
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Duty Availability:',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            responderState.isOnCall
                                ? 'Standing By for Emergency Dispatch'
                                : 'Off-Duty (Alerts Muted)',
                            style: TextStyle(
                              fontSize: 11,
                              color: responderState.isOnCall
                                  ? Colors.green.shade700
                                  : Colors.grey,
                            ),
                          ),
                        ],
                      ),
                      Switch(
                        value: responderState.isOnCall,
                        activeColor: Colors.green,
                        onChanged: (val) {
                          ref
                              .read(responderNotifierProvider.notifier)
                              .toggleAvailability(val);
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  // Certified Skills Pills
                  const Text(
                    'Certified Clinical Skills:',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 6),
                  const Wrap(
                    spacing: 6,
                    runSpacing: 4,
                    children: [
                      Chip(
                        avatar: Icon(
                          Icons.check,
                          size: 14,
                          color: Colors.green,
                        ),
                        label: Text(
                          'CPR Certified',
                          style: TextStyle(fontSize: 10),
                        ),
                        visualDensity: VisualDensity.compact,
                      ),
                      Chip(
                        avatar: Icon(
                          Icons.check,
                          size: 14,
                          color: Colors.green,
                        ),
                        label: Text(
                          'Bleeding Control',
                          style: TextStyle(fontSize: 10),
                        ),
                        visualDensity: VisualDensity.compact,
                      ),
                      Chip(
                        avatar: Icon(
                          Icons.check,
                          size: 14,
                          color: Colors.green,
                        ),
                        label: Text(
                          'AED Operator',
                          style: TextStyle(fontSize: 10),
                        ),
                        visualDensity: VisualDensity.compact,
                      ),
                      Chip(
                        avatar: Icon(
                          Icons.check,
                          size: 14,
                          color: Colors.green,
                        ),
                        label: Text(
                          'Spine Immobilization',
                          style: TextStyle(fontSize: 10),
                        ),
                        visualDensity: VisualDensity.compact,
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // INCOMING PROXIMITY ALERT BANNER
            if (responderState.pendingDispatchAlert != null)
              _buildIncomingDispatchAlertCard(
                context,
                ref,
                responderState.pendingDispatchAlert!,
              ),

            // ACTIVE MISSION CARD
            if (responderState.activeMissionId != null)
              _buildActiveMissionCard(
                context,
                ref,
                responderState.activeMissionId!,
              ),

            const SizedBox(height: 16),

            // Nearby Volunteers Network
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Community Volunteer Network:',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                ),
                Text(
                  '${responderState.nearbyResponders.length} On Duty',
                  style: const TextStyle(fontSize: 11, color: Colors.grey),
                ),
              ],
            ),
            const SizedBox(height: 10),

            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: responderState.nearbyResponders.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final resp = responderState.nearbyResponders[index];
                return _buildResponderTile(context, resp);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildIncomingDispatchAlertCard(
    BuildContext context,
    WidgetRef ref,
    Map<String, dynamic> alert,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.red, width: 2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.warning, color: Colors.red, size: 24),
              const SizedBox(width: 8),
              Text(
                'URGENT: DISPATCH DISPATCH IN PROXIMITY',
                style: TextStyle(
                  color: Colors.red.shade900,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '${alert['category']} • ${alert['distance']}',
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Text(
            'Location: ${alert['location']}',
            style: const TextStyle(fontSize: 12, color: Colors.black87),
          ),
          Text(
            'Details: ${alert['patient']}',
            style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.grey.shade800,
                  ),
                  onPressed: () {
                    ref
                        .read(responderNotifierProvider.notifier)
                        .declineMission();
                  },
                  child: const Text('Decline'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green.shade800,
                    foregroundColor: Colors.white,
                  ),
                  icon: const Icon(Icons.check, size: 18),
                  label: const Text('Accept Mission'),
                  onPressed: () {
                    ref
                        .read(responderNotifierProvider.notifier)
                        .acceptMission(alert['id'] ?? 'inc-1');
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActiveMissionCard(
    BuildContext context,
    WidgetRef ref,
    String missionId,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.green.shade700, width: 2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.directions_run, color: Colors.green, size: 24),
                  SizedBox(width: 8),
                  Text(
                    'ACTIVE ASSIGNMENT: EN ROUTE',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Colors.green,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.green.shade100,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Text(
                  'IN PROGRESS',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: Colors.green,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          const Text(
            'First Responder Scene Protocol:',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 6),
          const Text('1. Arrive at scene and ensure bystander safety.'),
          const Text(
            '2. Check airway, breathing, and maintain neutral neck position.',
          ),
          const Text('3. Apply direct pressure to control hemorrhage.'),
          const Text('4. Provide situation report to incoming ALS ambulance.'),
          const SizedBox(height: 14),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green.shade800,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 12),
            ),
            icon: const Icon(Icons.check_circle_outline),
            label: const Text('Mark Mission Completed & File Report'),
            onPressed: () {
              ref.read(responderNotifierProvider.notifier).completeMission();
            },
          ),
        ],
      ),
    );
  }

  Widget _buildResponderTile(BuildContext context, ResponderModel resp) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        leading: CircleAvatar(
          backgroundColor: Colors.green.shade100,
          child: const Icon(
            Icons.volunteer_activism,
            color: Colors.green,
            size: 20,
          ),
        ),
        title: Text(
          resp.fullName,
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
        ),
        subtitle: Text(
          '${resp.organization} • Distance: ${resp.distanceKm ?? 0.3} km',
          style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
        ),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(
            color: resp.isAvailable
                ? Colors.green.shade100
                : Colors.grey.shade200,
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(
            resp.isAvailable ? 'AVAILABLE' : 'OFF DUTY',
            style: TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.bold,
              color: resp.isAvailable
                  ? Colors.green.shade800
                  : Colors.grey.shade700,
            ),
          ),
        ),
      ),
    );
  }
}
