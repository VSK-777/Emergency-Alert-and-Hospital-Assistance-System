import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';
import 'router/app_router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: EmergencyAssistanceApp()));
}

class EmergencyAssistanceApp extends StatefulWidget {
  const EmergencyAssistanceApp({super.key});

  @override
  State<EmergencyAssistanceApp> createState() => _EmergencyAssistanceAppState();
}

class _EmergencyAssistanceAppState extends State<EmergencyAssistanceApp>
    with WidgetsBindingObserver {
  static const _channel = MethodChannel('net.vvit.csp.emergency/notifications');

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkPendingRoute();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _checkPendingRoute();
    }
  }

  Future<void> _checkPendingRoute() async {
    try {
      final res = await _channel.invokeMethod<Map<dynamic, dynamic>>(
        'getPendingNotificationRoute',
      );
      if (res != null && res.containsKey('route')) {
        final route = res['route'] as String;
        if (route.isNotEmpty) {
          appRouter.go(route);
        }
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Emergency Alert & Hospital Assistance',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.light,
      routerConfig: appRouter,
    );
  }
}
