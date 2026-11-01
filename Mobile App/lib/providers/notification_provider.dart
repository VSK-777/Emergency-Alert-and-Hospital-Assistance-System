import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/storage/local_store.dart';
import '../models/notification_model.dart';
import 'auth_provider.dart';

class NotificationState {
  final List<NotificationModel> notifications;
  final int unreadCount;

  NotificationState({this.notifications = const [], this.unreadCount = 0});

  NotificationState copyWith({
    List<NotificationModel>? notifications,
    int? unreadCount,
  }) {
    return NotificationState(
      notifications: notifications ?? this.notifications,
      unreadCount: unreadCount ?? this.unreadCount,
    );
  }
}

class NotificationNotifier extends StateNotifier<NotificationState> {
  final LocalStore localStore;

  NotificationNotifier({required this.localStore})
    : super(NotificationState()) {
    loadNotifications();
  }

  Future<void> loadNotifications() async {
    final cached = await localStore.getCachedNotifications();
    if (cached.isNotEmpty) {
      final list = cached.map((e) => NotificationModel.fromJson(e)).toList();
      list.sort((a, b) => b.timestamp.compareTo(a.timestamp));
      state = NotificationState(
        notifications: list,
        unreadCount: list.where((n) => !n.isRead).length,
      );
      return;
    }

    // Default seeded notifications
    final initialList = [
      NotificationModel(
        id: 'notif-1',
        title: 'Smartwatch Paired & IMU Active',
        message:
            'Wear OS Watch connected. Fall detection and IMU 50Hz telemetry active.',
        type: 'SMARTWATCH_FALL',
        timestamp: DateTime.now().subtract(const Duration(minutes: 5)),
        isRead: false,
      ),
      NotificationModel(
        id: 'notif-2',
        title: 'Trauma Care Network Ready',
        message:
            'AIIMS Mangalagiri & Manipal Hospitals registered in your immediate coverage radius.',
        type: 'HOSPITAL_ALERT',
        timestamp: DateTime.now().subtract(const Duration(hours: 1)),
        isRead: false,
      ),
      NotificationModel(
        id: 'notif-3',
        title: 'Offline Emergency Cache Synced',
        message:
            'First aid protocols and local map coordinates saved to secure on-device storage.',
        type: 'SYNC_STATUS',
        timestamp: DateTime.now().subtract(const Duration(hours: 3)),
        isRead: true,
      ),
    ];

    await localStore.cacheNotifications(
      initialList.map((e) => e.toJson()).toList(),
    );
    state = NotificationState(
      notifications: initialList,
      unreadCount: initialList.where((n) => !n.isRead).length,
    );
  }

  Future<void> addNotification(NotificationModel notif) async {
    final updated = [notif, ...state.notifications];
    await localStore.cacheNotifications(
      updated.map((e) => e.toJson()).toList(),
    );
    state = NotificationState(
      notifications: updated,
      unreadCount: updated.where((n) => !n.isRead).length,
    );
  }

  Future<void> markAsRead(String id) async {
    final updated = state.notifications.map((n) {
      if (n.id == id) {
        return n.copyWith(isRead: true);
      }
      return n;
    }).toList();

    await localStore.cacheNotifications(
      updated.map((e) => e.toJson()).toList(),
    );
    state = NotificationState(
      notifications: updated,
      unreadCount: updated.where((n) => !n.isRead).length,
    );
  }

  Future<void> markAllAsRead() async {
    final updated = state.notifications
        .map((n) => n.copyWith(isRead: true))
        .toList();
    await localStore.cacheNotifications(
      updated.map((e) => e.toJson()).toList(),
    );
    state = NotificationState(notifications: updated, unreadCount: 0);
  }
}

final notificationNotifierProvider =
    StateNotifierProvider<NotificationNotifier, NotificationState>((ref) {
      final localStore = ref.watch(localStoreProvider);
      return NotificationNotifier(localStore: localStore);
    });
