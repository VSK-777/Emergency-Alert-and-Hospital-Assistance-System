import 'dart:convert';
import 'package:emergency_assistance_app/core/storage/local_store.dart';
import 'package:emergency_assistance_app/main.dart';
import 'package:emergency_assistance_app/models/first_aid_model.dart';
import 'package:emergency_assistance_app/providers/ai_assistant_provider.dart';
import 'package:emergency_assistance_app/providers/ambulance_provider.dart';
import 'package:emergency_assistance_app/providers/emergency_provider.dart';
import 'package:emergency_assistance_app/providers/expense_provider.dart';
import 'package:emergency_assistance_app/providers/notification_provider.dart';
import 'package:emergency_assistance_app/providers/responder_provider.dart';
import 'package:emergency_assistance_app/providers/watch_connection_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('App renders HomeScreen with SOS button and Quick Action cards', (
    tester,
  ) async {
    await tester.pumpWidget(
      const ProviderScope(child: EmergencyAssistanceApp()),
    );
    await tester.pumpAndSettle();

    expect(find.text('Emergency Assistance'), findsOneWidget);
    expect(find.text('SOS'), findsOneWidget);
    expect(find.text('Offline First Aid'), findsOneWidget);
    expect(find.text('Nearby Hospitals'), findsOneWidget);
    expect(find.text('Offline Map'), findsOneWidget);
    expect(find.text('AI Medical Triage'), findsOneWidget);
    expect(find.text('Ambulance Fleet'), findsOneWidget);
    expect(find.text('Volunteer Hub'), findsOneWidget);
  });

  test('LocalStore saves and retrieves pending offline incidents', () async {
    final store = LocalStore();
    final testIncident = {
      'id': 'test-offline-001',
      'source': 'SMARTWATCH_AUTO',
      'category': 'FALL',
      'status': 'PENDING',
      'latitude': 16.3533,
      'longitude': 80.5238,
      'detectionReason': 'Simulated High Impact Fall',
      'deliveryStatus': 'Saved locally',
      'syncStatus': 'PENDING',
      'idempotencyKey': 'key-test-001',
      'createdAt': DateTime.now().toIso8601String(),
    };

    await store.savePendingIncident(testIncident);
    final incidents = await store.getPendingIncidents();

    expect(incidents.length, 1);
    expect(incidents.first['id'], 'test-offline-001');
    expect(incidents.first['deliveryStatus'], 'Saved locally');

    // Test idempotent update
    await store.markIncidentSynced('test-offline-001');
    final updated = await store.getPendingIncidents();
    expect(updated.first['syncStatus'], 'SYNCED');
    expect(updated.first['deliveryStatus'], 'DELIVERED');
  });

  test('FirstAidModel deserializes correctly from structured JSON', () {
    const jsonSample = '''
    {
      "id": "cardiac_arrest",
      "title": "Suspected Cardiac Arrest",
      "urgency": "CRITICAL",
      "icon": "heart",
      "attribution": "American Heart Association",
      "overview": "Victim unresponsive and not breathing.",
      "steps": ["Call emergency services", "Push hard and fast 100-120 bpm"],
      "warnings": ["Do not stop compressions for >10s"]
    }
    ''';

    final model = FirstAidModel.fromJson(jsonDecode(jsonSample));
    expect(model.id, 'cardiac_arrest');
    expect(model.urgency, 'CRITICAL');
    expect(model.steps.length, 2);
    expect(model.warnings.length, 1);
  });

  testWidgets(
    'Emergency Countdown can be triggered and cancelled via False Alarm',
    (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: Consumer(
            builder: (context, ref, child) {
              final emergencyState = ref.watch(emergencyNotifierProvider);
              return MaterialApp(
                home: Scaffold(
                  body: Column(
                    children: [
                      Text('Active: ${emergencyState.isCountdownActive}'),
                      Text('Seconds: ${emergencyState.countdownSeconds}'),
                      ElevatedButton(
                        onPressed: () {
                          ref
                              .read(emergencyNotifierProvider.notifier)
                              .startEmergencyCountdown(
                                source: 'MOBILE_SOS',
                                reason: 'Test Emergency',
                                category: 'ROAD_ACCIDENT',
                                countdownDuration: 10,
                              );
                        },
                        child: const Text('Start'),
                      ),
                      ElevatedButton(
                        onPressed: () {
                          ref
                              .read(emergencyNotifierProvider.notifier)
                              .cancelEmergency();
                        },
                        child: const Text('Cancel'),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      );

      // Initial state: not active
      expect(find.text('Active: false'), findsOneWidget);

      // Trigger start
      await tester.tap(find.text('Start'));
      await tester.pump();

      expect(find.text('Active: true'), findsOneWidget);
      expect(find.text('Seconds: 10'), findsOneWidget);

      // Cancel false alarm
      await tester.tap(find.text('Cancel'));
      await tester.pump();

      expect(find.text('Active: false'), findsOneWidget);
    },
  );

  test('Watch Sensor Replay triggers Phone Emergency Countdown', () async {
    final container = ProviderContainer();
    final watchNotifier = container.read(watchNotifierProvider.notifier);

    // Replay accident telemetry spike
    watchNotifier.replayAccidentTelemetrySpike();

    final emergencyState = container.read(emergencyNotifierProvider);
    expect(emergencyState.isCountdownActive, true);
    expect(emergencyState.activeIncident?.source, 'SMARTWATCH_SENSOR');
    expect(
      emergencyState.activeIncident?.detectionReason,
      contains('Severe impact'),
    );

    container.read(emergencyNotifierProvider.notifier).cancelEmergency();
    container.dispose();
  });

  test(
    'AI Assistant offline triage correctly classifies critical cardiac arrest',
    () async {
      final container = ProviderContainer();
      final aiNotifier = container.read(aiAssistantNotifierProvider.notifier);

      await aiNotifier.sendQuery(
        'Person collapsed on floor, no pulse and unresponsive',
      );

      final messages = container.read(aiAssistantNotifierProvider).messages;
      expect(messages.length, greaterThanOrEqualTo(2));

      final aiResponse = messages.last;
      expect(aiResponse.sender, 'ai');
      expect(aiResponse.triageData?.urgency, 'CRITICAL');
      expect(aiResponse.triageData?.category, contains('Cardiac'));
      expect(aiResponse.triageData?.cprRequired, true);

      container.dispose();
    },
  );

  test('AmbulanceNotifier loads fleet and advances dispatch status', () async {
    final container = ProviderContainer();
    final ambNotifier = container.read(ambulanceNotifierProvider.notifier);

    await ambNotifier.loadAmbulances();
    final state = container.read(ambulanceNotifierProvider);

    expect(state.ambulances.isNotEmpty, true);
    final firstAmb = state.ambulances.first;
    expect(firstAmb.type, contains('ALS'));

    await ambNotifier.advanceDispatchStatus(firstAmb.id, 'EN_ROUTE_TO_PATIENT');
    final updated = container
        .read(ambulanceNotifierProvider)
        .ambulances
        .firstWhere((a) => a.id == firstAmb.id);
    expect(updated.status, 'EN_ROUTE_TO_PATIENT');

    container.dispose();
  });

  test(
    'ResponderNotifier manages volunteer availability and mission acceptance',
    () async {
      final container = ProviderContainer();
      final respNotifier = container.read(responderNotifierProvider.notifier);

      await respNotifier.toggleAvailability(false);
      expect(container.read(responderNotifierProvider).isOnCall, false);

      await respNotifier.toggleAvailability(true);
      expect(container.read(responderNotifierProvider).isOnCall, true);

      respNotifier.triggerSimulatedDispatchAlert({
        'id': 'test-mission-101',
        'category': 'Road Accident',
        'distance': '200m',
      });
      expect(
        container.read(responderNotifierProvider).pendingDispatchAlert != null,
        true,
      );

      respNotifier.acceptMission('test-mission-101');
      expect(
        container.read(responderNotifierProvider).activeMissionId,
        'test-mission-101',
      );
      expect(
        container.read(responderNotifierProvider).pendingDispatchAlert,
        null,
      );

      container.dispose();
    },
  );

  test('NotificationNotifier tracks unread count and marks as read', () async {
    final container = ProviderContainer();
    final notifNotifier = container.read(notificationNotifierProvider.notifier);

    await notifNotifier.loadNotifications();
    final initialUnread = container
        .read(notificationNotifierProvider)
        .unreadCount;
    expect(initialUnread, greaterThan(0));

    await notifNotifier.markAllAsRead();
    expect(container.read(notificationNotifierProvider).unreadCount, 0);

    container.dispose();
  });

  test(
    'ExpenseNotifier correctly logs expenses and calculates total expenditure',
    () async {
      final container = ProviderContainer();
      final expNotifier = container.read(expenseNotifierProvider.notifier);

      await expNotifier.loadExpenses();
      final initialTotal = container
          .read(expenseNotifierProvider)
          .totalExpenditure;
      expect(initialTotal, greaterThan(0.0));

      await expNotifier.addExpense(
        category: 'MEDICINES',
        description: 'Emergency Epinephrine Autoinjector',
        amount: 450.0,
      );

      final updatedTotal = container
          .read(expenseNotifierProvider)
          .totalExpenditure;
      expect(updatedTotal, initialTotal + 450.0);

      container.dispose();
    },
  );
}
