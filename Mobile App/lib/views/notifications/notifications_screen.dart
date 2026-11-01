import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/notification_provider.dart';
import '../../models/notification_model.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifState = ref.watch(notificationNotifierProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications & Alerts'),
        actions: [
          if (notifState.unreadCount > 0)
            TextButton(
              onPressed: () {
                ref.read(notificationNotifierProvider.notifier).markAllAsRead();
              },
              child: const Text(
                'Mark All Read',
                style: TextStyle(color: Colors.white, fontSize: 12),
              ),
            ),
        ],
      ),
      body: notifState.notifications.isEmpty
          ? const Center(child: Text('No notifications received yet.'))
          : ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: notifState.notifications.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final notif = notifState.notifications[index];
                return _buildNotificationCard(context, ref, notif);
              },
            ),
    );
  }

  Widget _buildNotificationCard(
    BuildContext context,
    WidgetRef ref,
    NotificationModel notif,
  ) {
    IconData iconData = Icons.notifications;
    Color iconColor = AppTheme.trustBlue;

    if (notif.type == 'SMARTWATCH_FALL') {
      iconData = Icons.watch;
      iconColor = Colors.purple;
    } else if (notif.type == 'EMERGENCY_ALERT') {
      iconData = Icons.emergency;
      iconColor = AppTheme.emergencyRed;
    } else if (notif.type == 'HOSPITAL_ALERT') {
      iconData = Icons.local_hospital;
      iconColor = Colors.teal;
    } else if (notif.type == 'AMBULANCE_UPDATE') {
      iconData = Icons.airport_shuttle;
      iconColor = Colors.deepOrange;
    }

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: BorderSide(
          color: notif.isRead
              ? Colors.grey.shade200
              : AppTheme.emergencyRed.withOpacity(0.4),
        ),
      ),
      color: notif.isRead ? Colors.white : const Color(0xFFFFF8F8),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        leading: CircleAvatar(
          backgroundColor: iconColor.withOpacity(0.12),
          child: Icon(iconData, color: iconColor, size: 20),
        ),
        title: Row(
          children: [
            Expanded(
              child: Text(
                notif.title,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: notif.isRead
                      ? FontWeight.normal
                      : FontWeight.bold,
                ),
              ),
            ),
            if (!notif.isRead)
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: AppTheme.emergencyRed,
                  shape: BoxShape.circle,
                ),
              ),
          ],
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              notif.message,
              style: TextStyle(fontSize: 12, color: Colors.grey.shade800),
            ),
            const SizedBox(height: 4),
            Text(
              '${notif.timestamp.hour}:${notif.timestamp.minute.toString().padLeft(2, '0')} • ${notif.timestamp.day}/${notif.timestamp.month}/${notif.timestamp.year}',
              style: TextStyle(fontSize: 10, color: Colors.grey.shade500),
            ),
          ],
        ),
        onTap: () {
          ref.read(notificationNotifierProvider.notifier).markAsRead(notif.id);
        },
      ),
    );
  }
}
