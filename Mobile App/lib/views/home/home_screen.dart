import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/connectivity_provider.dart';
import '../../providers/emergency_provider.dart';
import '../../providers/notification_provider.dart';
import '../../providers/watch_connection_provider.dart';
import '../../models/incident_model.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  static const List<Map<String, dynamic>> _categories = [
    {
      'id': 'ROAD_ACCIDENT',
      'label': 'Road Accident',
      'icon': Icons.car_crash_outlined,
    },
    {
      'id': 'CARDIAC_ARREST',
      'label': 'Cardiac Arrest',
      'icon': Icons.favorite_border,
    },
    {
      'id': 'FALL',
      'label': 'Fall Impact',
      'icon': Icons.personal_injury_outlined,
    },
    {
      'id': 'SEVERE_BLEEDING',
      'label': 'Severe Bleeding',
      'icon': Icons.water_drop_outlined,
    },
    {
      'id': 'FIRE',
      'label': 'Fire Hazard',
      'icon': Icons.local_fire_department_outlined,
    },
    {
      'id': 'MEDICAL_EMERGENCY',
      'label': 'Medical Emergency',
      'icon': Icons.medical_services_outlined,
    },
    {'id': 'CHOKING', 'label': 'Choking', 'icon': Icons.air_outlined},
    {
      'id': 'OTHER',
      'label': 'Other Crisis',
      'icon': Icons.warning_amber_rounded,
    },
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authNotifierProvider);
    final isOnlineAsync = ref.watch(connectivityStreamProvider);
    final emergencyState = ref.watch(emergencyNotifierProvider);
    final watchState = ref.watch(watchNotifierProvider);
    final notifState = ref.watch(notificationNotifierProvider);

    final isOnline = isOnlineAsync.value ?? true;
    final user = authState.user;

    // Listen to countdown state: if countdown activates, navigate to SOS screen
    ref.listen<EmergencyState>(emergencyNotifierProvider, (previous, next) {
      if (next.isCountdownActive && !(previous?.isCountdownActive ?? false)) {
        context.push('/sos');
      }
      if (next.incomingSmartwatchAlert != null &&
          next.incomingSmartwatchAlert?.id !=
              previous?.incomingSmartwatchAlert?.id) {
        _showIncomingWatchAlertDialog(
          context,
          ref,
          next.incomingSmartwatchAlert!,
        );
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Emergency Assistance',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            Text(
              user != null
                  ? '${user.fullName} • ${user.role}'
                  : 'VVIT CSP • Batch 8',
              style: const TextStyle(fontSize: 11, color: Colors.white70),
            ),
          ],
        ),
        actions: [
          // Notification Bell with Unread Badge
          IconButton(
            tooltip: 'Notifications',
            icon: Stack(
              clipBehavior: Clip.none,
              children: [
                const Icon(Icons.notifications_outlined),
                if (notifState.unreadCount > 0)
                  Positioned(
                    right: -2,
                    top: -2,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Colors.amber,
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        '${notifState.unreadCount}',
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            onPressed: () => context.push('/notifications'),
          ),
          IconButton(
            tooltip: 'Sync Offline Incidents',
            icon: emergencyState.isSyncing
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  )
                : const Icon(Icons.sync),
            onPressed: () =>
                ref.read(emergencyNotifierProvider.notifier).triggerSync(),
          ),
          IconButton(
            tooltip: 'Profile & Medical Record',
            icon: const Icon(Icons.account_circle_outlined),
            onPressed: () => context.push('/profile'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 1. Connectivity Status Banner
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: isOnline
                  ? AppTheme.verifiedGreen.withOpacity(0.12)
                  : AppTheme.warningOrange.withOpacity(0.15),
              child: Row(
                children: [
                  Icon(
                    isOnline ? Icons.wifi : Icons.wifi_off,
                    size: 18,
                    color: isOnline
                        ? AppTheme.verifiedGreen
                        : AppTheme.warningOrange,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      isOnline
                          ? 'Online • Connected to Spring Boot Backend API'
                          : 'Offline Mode • Local Storage & First Aid Protocols Active',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: isOnline
                            ? AppTheme.verifiedGreen
                            : AppTheme.warningOrange,
                      ),
                    ),
                  ),
                  if (authState.isOfflineEmergencyMode)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.warningOrange,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        'EMERGENCY GUEST',
                        style: TextStyle(
                          fontSize: 9,
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // Live Smartwatch Alert Banner (if any received)
            if (emergencyState.incomingSmartwatchAlert != null)
              _buildIncomingWatchAlertBanner(
                context,
                ref,
                emergencyState.incomingSmartwatchAlert!,
              ),

            // 2. Smartwatch Companion Card
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: InkWell(
                onTap: () => context.push('/watch'),
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.grey.shade300),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.04),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.watch,
                        color: watchState.isConnected
                            ? AppTheme.trustBlue
                            : Colors.grey,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              watchState.deviceName,
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              watchState.isConnected
                                  ? 'Connected • IMU 50Hz Fall Sensor Active • ${watchState.batteryPercent}%'
                                  : 'Disconnected • Searching for Wear OS device...',
                              style: TextStyle(
                                fontSize: 11,
                                color: watchState.isConnected
                                    ? AppTheme.verifiedGreen
                                    : Colors.grey,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Icon(
                        Icons.chevron_right,
                        size: 20,
                        color: Colors.grey,
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // 3. Emergency Category Selector
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Select Emergency Category:',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimaryLight,
                    ),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    height: 38,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _categories.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                      itemBuilder: (context, index) {
                        final cat = _categories[index];
                        final isSelected =
                            emergencyState.selectedCategory == cat['id'];
                        return ChoiceChip(
                          avatar: Icon(
                            cat['icon'] as IconData,
                            size: 16,
                            color: isSelected
                                ? Colors.white
                                : AppTheme.emergencyDarkRed,
                          ),
                          label: Text(
                            cat['label'] as String,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: isSelected
                                  ? FontWeight.bold
                                  : FontWeight.normal,
                              color: isSelected
                                  ? Colors.white
                                  : AppTheme.textPrimaryLight,
                            ),
                          ),
                          selected: isSelected,
                          selectedColor: AppTheme.emergencyDarkRed,
                          backgroundColor: Colors.grey.shade100,
                          onSelected: (val) {
                            if (val) {
                              ref
                                  .read(emergencyNotifierProvider.notifier)
                                  .setCategory(cat['id'] as String);
                            }
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),

            // 4. Central SOS Section
            Padding(
              padding: const EdgeInsets.symmetric(
                vertical: 20.0,
                horizontal: 16.0,
              ),
              child: Column(
                children: [
                  const Text(
                    'IN IMMEDIATE DANGER OR ACCIDENT?',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.1,
                      color: AppTheme.emergencyDarkRed,
                    ),
                  ),
                  const SizedBox(height: 14),
                  // Prominent 3D SOS Button
                  GestureDetector(
                    onTap: () {
                      ref
                          .read(emergencyNotifierProvider.notifier)
                          .startEmergencyCountdown(
                            source: 'MANUAL_SOS',
                            reason:
                                'Manual SOS: ${emergencyState.selectedCategory}',
                            category: emergencyState.selectedCategory,
                            score: 1.0,
                            countdownDuration: 10,
                          );
                    },
                    child: Container(
                      width: 155,
                      height: 155,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: const RadialGradient(
                          center: Alignment(-0.2, -0.3),
                          radius: 0.9,
                          colors: [
                            Color(0xFFFF5252),
                            Color(0xFFD32F2F),
                            Color(0xFF8B0000),
                          ],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFFD32F2F).withOpacity(0.45),
                            blurRadius: 28,
                            spreadRadius: 6,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: const Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.touch_app,
                              size: 36,
                              color: Colors.white,
                            ),
                            SizedBox(height: 2),
                            Text(
                              'SOS',
                              style: TextStyle(
                                fontSize: 36,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                                letterSpacing: 2,
                              ),
                            ),
                            Text(
                              'PRESS FOR HELP',
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                                color: Colors.white70,
                                letterSpacing: 0.8,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Includes 10-second cancel window to prevent accidental alerts',
                    style: TextStyle(
                      fontSize: 11,
                      color: AppTheme.textSecondaryLight,
                    ),
                  ),
                ],
              ),
            ),

            // 5. Quick Action Grid to All Ecosystem Modules
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Emergency Modules & Care Network',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimaryLight,
                    ),
                  ),
                  const SizedBox(height: 10),
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                    childAspectRatio: 1.45,
                    children: [
                      _buildActionCard(
                        context,
                        title: 'AI Medical Triage',
                        subtitle: 'Gemini & Offline NLP',
                        icon: Icons.psychology_outlined,
                        color: Colors.purple.shade700,
                        badge: 'AI ASSIST',
                        onTap: () => context.push('/ai'),
                      ),
                      _buildActionCard(
                        context,
                        title: 'Offline First Aid',
                        subtitle: 'CPR & trauma manuals',
                        icon: Icons.medical_services_outlined,
                        color: AppTheme.trustBlue,
                        badge: 'OFFLINE',
                        onTap: () => context.push('/first-aid'),
                      ),
                      _buildActionCard(
                        context,
                        title: 'Nearby Hospitals',
                        subtitle: 'ICU & Trauma beds',
                        icon: Icons.local_hospital_outlined,
                        color: Colors.teal.shade700,
                        onTap: () => context.push('/hospitals'),
                      ),
                      _buildActionCard(
                        context,
                        title: 'Ambulance Fleet',
                        subtitle: 'ALS / BLS tracking',
                        icon: Icons.emergency,
                        color: Colors.deepOrange.shade700,
                        onTap: () => context.push('/ambulance'),
                      ),
                      _buildActionCard(
                        context,
                        title: 'Volunteer Hub',
                        subtitle: 'NSS & Red Cross Responders',
                        icon: Icons.volunteer_activism_outlined,
                        color: Colors.green.shade700,
                        badge: 'DISPATCH',
                        onTap: () => context.push('/responder'),
                      ),
                      _buildActionCard(
                        context,
                        title: 'Offline Map',
                        subtitle: 'GPS & OSM Coordinates',
                        icon: Icons.map_outlined,
                        color: Colors.indigo.shade600,
                        badge: 'OFFLINE',
                        onTap: () => context.push('/map'),
                      ),
                      _buildActionCard(
                        context,
                        title: 'Emergency Contacts',
                        subtitle: 'Instant SMS recipients',
                        icon: Icons.contact_phone_outlined,
                        color: Colors.blueGrey.shade700,
                        onTap: () => context.push('/contacts'),
                      ),
                      _buildActionCard(
                        context,
                        title: 'Watch & Sensors',
                        subtitle: 'IMU accident test harness',
                        icon: Icons.sensors,
                        color: Colors.cyan.shade800,
                        badge: 'WEAR OS',
                        onTap: () => context.push('/watch'),
                      ),
                      _buildActionCard(
                        context,
                        title: 'Medical Expenses',
                        subtitle: 'Transparent cost ledger',
                        icon: Icons.receipt_long_outlined,
                        color: Colors.brown.shade700,
                        onTap: () => context.push('/expenses'),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // 6. Recent Emergency Incidents History
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Recent Emergency Incidents',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (emergencyState.incidentHistory.isNotEmpty)
                        Text(
                          '${emergencyState.incidentHistory.length} recorded',
                          style: const TextStyle(
                            fontSize: 11,
                            color: Colors.grey,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  if (emergencyState.incidentHistory.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Center(
                        child: Text(
                          'No recent emergencies recorded.\nYour monitoring is active and standing by.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 12, color: Colors.grey),
                        ),
                      ),
                    )
                  else
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: emergencyState.incidentHistory.take(5).length,
                      itemBuilder: (context, index) {
                        final incident = emergencyState.incidentHistory[index];
                        return _buildIncidentTile(context, incident);
                      },
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCard(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    String? badge,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: color, size: 22),
                ),
                if (badge != null)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 5,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      badge,
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        color: color,
                      ),
                    ),
                  ),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  subtitle,
                  style: TextStyle(fontSize: 10, color: Colors.grey.shade600),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildIncidentTile(BuildContext context, IncidentModel incident) {
    Color statusColor = AppTheme.trustBlue;
    if (incident.status == 'CANCELLED') statusColor = Colors.grey;
    if (incident.status == 'DISPATCHED' || incident.status == 'IN_PROGRESS')
      statusColor = AppTheme.emergencyRed;
    if (incident.status == 'RESOLVED') statusColor = AppTheme.verifiedGreen;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        leading: CircleAvatar(
          backgroundColor: statusColor.withOpacity(0.15),
          child: Icon(
            incident.source.contains('SMARTWATCH')
                ? Icons.watch
                : Icons.phone_android,
            color: statusColor,
            size: 20,
          ),
        ),
        title: Text(
          incident.detectionReason,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Text(
          '${incident.source} • ${incident.deliveryStatus} • ${incident.createdAt.hour}:${incident.createdAt.minute.toString().padLeft(2, '0')}',
          style: const TextStyle(fontSize: 10),
        ),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: statusColor.withOpacity(0.12),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(
            incident.status,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: statusColor,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildIncomingWatchAlertBanner(
    BuildContext context,
    WidgetRef ref,
    IncidentModel alert,
  ) {
    return Container(
      margin: const EdgeInsets.all(12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFFEBEE),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.red.shade300, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.warning, color: Colors.red, size: 22),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'CRITICAL SMARTWATCH ALERT DETECTED!',
                  style: TextStyle(
                    color: Colors.red,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close, size: 18),
                onPressed: () => ref
                    .read(emergencyNotifierProvider.notifier)
                    .dismissIncomingAlert(),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            alert.detectionReason,
            style: const TextStyle(fontSize: 12, color: Colors.black87),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton(
                onPressed: () => ref
                    .read(emergencyNotifierProvider.notifier)
                    .dismissIncomingAlert(),
                child: const Text(
                  'Dismiss',
                  style: TextStyle(color: Colors.grey),
                ),
              ),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.emergencyRed,
                  foregroundColor: Colors.white,
                ),
                icon: const Icon(Icons.arrow_forward, size: 16),
                label: const Text('Open Emergency'),
                onPressed: () {
                  ref
                      .read(emergencyNotifierProvider.notifier)
                      .dismissIncomingAlert();
                  context.push('/sos');
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showIncomingWatchAlertDialog(
    BuildContext context,
    WidgetRef ref,
    IncidentModel alert,
  ) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.warning, color: Colors.red),
              SizedBox(width: 8),
              Text('Smartwatch Alert!'),
            ],
          ),
          content: Text(
            'The Smartwatch detected: ${alert.detectionReason}.\n\nWould you like to open the Emergency SOS screen to confirm dispatch or cancel if safe?',
          ),
          actions: [
            TextButton(
              onPressed: () {
                ref
                    .read(emergencyNotifierProvider.notifier)
                    .dismissIncomingAlert();
                Navigator.of(ctx).pop();
              },
              child: const Text('Dismiss (I am OK)'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.emergencyRed,
              ),
              onPressed: () {
                ref
                    .read(emergencyNotifierProvider.notifier)
                    .dismissIncomingAlert();
                Navigator.of(ctx).pop();
                context.push('/sos');
              },
              child: const Text(
                'View SOS Dispatch',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ],
        );
      },
    );
  }
}
