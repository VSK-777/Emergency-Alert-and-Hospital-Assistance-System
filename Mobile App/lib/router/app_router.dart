import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../views/ai/ai_assistant_screen.dart';
import '../views/ambulance/ambulance_screen.dart';
import '../views/auth/login_screen.dart';
import '../views/auth/register_screen.dart';
import '../views/contacts/contacts_screen.dart';
import '../views/expenses/expenses_screen.dart';
import '../views/first_aid/first_aid_screen.dart';
import '../views/home/home_screen.dart';
import '../views/hospitals/hospitals_screen.dart';
import '../views/map/offline_map_screen.dart';
import '../views/notifications/notifications_screen.dart';
import '../views/profile/profile_screen.dart';
import '../views/responder/responder_dashboard_screen.dart';
import '../views/sos/sos_screen.dart';
import '../views/watch/watch_status_screen.dart';

final appRouter = GoRouter(
  initialLocation: '/home',
  routes: [
    GoRoute(path: '/home', builder: (context, state) => const HomeScreen()),
    GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
    GoRoute(
      path: '/register',
      builder: (context, state) => const RegisterScreen(),
    ),
    GoRoute(path: '/sos', builder: (context, state) => const SosScreen()),
    GoRoute(
      path: '/first-aid',
      builder: (context, state) => const FirstAidScreen(),
    ),
    GoRoute(
      path: '/map',
      builder: (context, state) => const OfflineMapScreen(),
    ),
    GoRoute(
      path: '/hospitals',
      builder: (context, state) => const HospitalsScreen(),
    ),
    GoRoute(
      path: '/ambulance',
      builder: (context, state) => const AmbulanceScreen(),
    ),
    GoRoute(
      path: '/responder',
      builder: (context, state) => const ResponderDashboardScreen(),
    ),
    GoRoute(
      path: '/ai',
      builder: (context, state) => const AiAssistantScreen(),
    ),
    GoRoute(
      path: '/contacts',
      builder: (context, state) => const ContactsScreen(),
    ),
    GoRoute(
      path: '/watch',
      builder: (context, state) => const WatchStatusScreen(),
    ),
    GoRoute(
      path: '/profile',
      builder: (context, state) => const ProfileScreen(),
    ),
    GoRoute(
      path: '/expenses',
      builder: (context, state) => const ExpensesScreen(),
    ),
    GoRoute(
      path: '/notifications',
      builder: (context, state) => const NotificationsScreen(),
    ),
  ],
);
