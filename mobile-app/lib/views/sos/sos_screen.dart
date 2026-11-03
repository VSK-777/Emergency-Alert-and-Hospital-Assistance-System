import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_icons.dart';
import '../../providers/emergency_provider.dart';

class SosScreen extends ConsumerWidget {
  const SosScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final emergencyState = ref.watch(emergencyNotifierProvider);
    final active = emergencyState.activeIncident;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Emergency SOS Active'),
        backgroundColor: AppTheme.emergencyDarkRed,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/home'),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 1. COUNTDOWN SECTION (If Countdown is Active)
            if (emergencyState.isCountdownActive) ...[
              Container(
                padding: const EdgeInsets.symmetric(
                  vertical: 24,
                  horizontal: 16,
                ),
                decoration: BoxDecoration(
                  color: AppTheme.emergencyRed.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.emergencyRed, width: 2),
                ),
                child: Column(
                  children: [
                    const Icon(
                      Icons.warning_amber_rounded,
                      size: 48,
                      color: AppTheme.emergencyRed,
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'EMERGENCY DISPATCH INITIATING',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        color: AppTheme.emergencyDarkRed,
                        letterSpacing: 1.2,
                      ),
                    ),
                    const SizedBox(height: 16),
                    // Big Animated Countdown Circle
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        SizedBox(
                          width: 120,
                          height: 120,
                          child: CircularProgressIndicator(
                            value: emergencyState.countdownSeconds / 10.0,
                            strokeWidth: 8,
                            backgroundColor: Colors.grey.shade300,
                            valueColor: const AlwaysStoppedAnimation<Color>(
                              AppTheme.emergencyRed,
                            ),
                          ),
                        ),
                        Text(
                          '${emergencyState.countdownSeconds}',
                          style: const TextStyle(
                            fontSize: 48,
                            fontWeight: FontWeight.w900,
                            color: AppTheme.emergencyRed,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Alerting nearest hospital & community responders in ${emergencyState.countdownSeconds}s...',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 16),
                    // False Alarm Cancellation Button
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.verifiedGreen,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 14,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                      ),
                      icon: const Icon(Icons.check_circle_outline, size: 24),
                      label: const Text(
                        "I'M OK — CANCEL FALSE ALARM",
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      onPressed: () {
                        ref
                            .read(emergencyNotifierProvider.notifier)
                            .cancelEmergency();
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
            ] else ...[
              // 2. DISPATCHED / ACTIVE EMERGENCY TRACKER
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.emergencyDarkRed,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'INCIDENT DISPATCH ACTIVE',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            letterSpacing: 1.1,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            active?.status ?? 'DISPATCHED',
                            style: const TextStyle(
                              color: AppTheme.emergencyDarkRed,
                              fontWeight: FontWeight.bold,
                              fontSize: 11,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      active?.detectionReason ??
                          'Emergency assistance requested',
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'GPS Coordinates: ${active?.latitude.toStringAsFixed(4) ?? '16.3533'}° N, ${active?.longitude.toStringAsFixed(4) ?? '80.5238'}° E • Accuracy: ±4.5m',
                      style: const TextStyle(
                        color: Colors.white60,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Emergency Dispatch Lifecycle Cards
              const Text(
                'Assigned Response Units & Hospital:',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 10),

              // Hospital Card
              _buildResponseUnitCard(
                context,
                icon: AppIcons.hospital,
                iconColor: Colors.teal.shade700,
                title:
                    active?.assignedHospitalName ??
                    'AIIMS Mangalagiri Trauma Center',
                subtitle:
                    'Level 1 Trauma • 15 ICU Beds Available • ER Pre-alert Delivered',
                badgeText: 'PRE-ALERTED',
                badgeColor: Colors.teal,
                actionLabel: 'Call ER',
                onAction: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text(
                        'Simulated Call: Dialing AIIMS Mangalagiri ER (+91 86452 80000)',
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 10),

              // Ambulance Card
              _buildResponseUnitCard(
                context,
                icon: AppIcons.ambulance,
                iconColor: Colors.deepOrange.shade700,
                title:
                    'Ambulance ${active?.assignedAmbulanceReg ?? 'AP 16 TE 1081'} (ALS)',
                subtitle:
                    'Driver: S. K. Naidu (+91 94401 23456) • ETA: 6 mins (En Route)',
                badgeText: 'EN ROUTE',
                badgeColor: Colors.orange,
                actionLabel: 'Call Driver',
                onAction: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text(
                        'Simulated Call: Dialing Ambulance Driver S. K. Naidu (+91 94401 23456)',
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 10),

              // Community Responder Card
              _buildResponseUnitCard(
                context,
                icon: AppIcons.responder,
                iconColor: Colors.green.shade700,
                title:
                    active?.assignedResponderName ??
                    'Ramesh Kumar T (NSS Volunteer)',
                subtitle:
                    'CPR Certified • Distance: 250m • First responder responding on foot',
                badgeText: 'ACCEPTED',
                badgeColor: Colors.green,
                actionLabel: 'Contact',
                onAction: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text(
                        'Simulated Contact: Messaging NSS Volunteer Ramesh Kumar T (+91 98765 43211)',
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 20),

              // Action Buttons: Open Map & Open AI Triage
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.trustBlue,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      icon: const Icon(AppIcons.map),
                      label: const Text('Live Map View'),
                      onPressed: () => context.push('/map'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.purple.shade700,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      icon: const Icon(AppIcons.triageAi),
                      label: const Text('AI First Aid'),
                      onPressed: () => context.push('/ai'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.grey.shade700,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                icon: const Icon(Icons.check_circle_outline),
                label: const Text('Mark Incident Resolved'),
                onPressed: () {
                  ref
                      .read(emergencyNotifierProvider.notifier)
                      .cancelEmergency();
                  context.go('/home');
                },
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildResponseUnitCard(
    BuildContext context, {
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required String badgeText,
    required Color badgeColor,
    required String actionLabel,
    required VoidCallback onAction,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.grey.shade300),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 4,
            offset: const Offset(0, 2),
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
                  Icon(icon, color: iconColor, size: 20),
                  const SizedBox(width: 8),
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: badgeColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  badgeText,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: badgeColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            subtitle,
            style: TextStyle(fontSize: 11, color: Colors.grey.shade700),
          ),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerRight,
            child: OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                foregroundColor: iconColor,
                side: BorderSide(color: iconColor),
                visualDensity: VisualDensity.compact,
              ),
              icon: const Icon(Icons.phone, size: 14),
              label: Text(actionLabel, style: const TextStyle(fontSize: 11)),
              onPressed: onAction,
            ),
          ),
        ],
      ),
    );
  }
}
