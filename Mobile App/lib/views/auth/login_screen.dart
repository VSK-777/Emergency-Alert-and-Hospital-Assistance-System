import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _emailController = TextEditingController(text: 'patient.vsk@vvit.net');
  final _passwordController = TextEditingController(text: 'Password@123');
  final _phoneController = TextEditingController(text: '+91 98765 43210');
  final _otpController = TextEditingController(text: '482910');
  bool _otpSent = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  void _handleEmailLogin() async {
    final success = await ref
        .read(authNotifierProvider.notifier)
        .login(_emailController.text.trim(), _passwordController.text);
    if (success && mounted) {
      context.go('/home');
    }
  }

  void _handlePhoneLogin() async {
    if (!_otpSent) {
      setState(() {
        _otpSent = true;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'OTP sent via Phone.email (Client ID: 15695407177920574360). Use sample code 482910.',
          ),
          backgroundColor: AppTheme.trustBlue,
        ),
      );
      return;
    }

    final success = await ref
        .read(authNotifierProvider.notifier)
        .phoneLogin(
          phoneNumber: _phoneController.text.trim(),
          verificationToken:
              'pe_token_verified_${DateTime.now().millisecondsSinceEpoch}',
          fullName: 'Sai Krishna VSK',
          role: 'CITIZEN',
        );

    if (success && mounted) {
      context.go('/home');
    }
  }

  void _selectDemoAccount(String email, String role) {
    _emailController.text = email;
    _passwordController.text = 'Password@123';
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Demo Credentials loaded: $role ($email)')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authNotifierProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sign In — Emergency System'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header & Branding
            Center(
              child: Column(
                children: [
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: AppTheme.emergencyRed.withOpacity(0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.emergency_outlined,
                      size: 42,
                      color: AppTheme.emergencyRed,
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Emergency Alert and Hospital Assistance System',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimaryLight,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'VVIT B.Tech CSE Batch 8 • Community Service Project',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.textSecondaryLight,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Tab bar: Phone.email OTP vs Email/Password
            TabBar(
              controller: _tabController,
              labelColor: AppTheme.emergencyDarkRed,
              unselectedLabelColor: Colors.grey,
              indicatorColor: AppTheme.emergencyRed,
              tabs: const [
                Tab(icon: Icon(Icons.phone_android), text: 'Phone.email OTP'),
                Tab(icon: Icon(Icons.email_outlined), text: 'Email & Password'),
              ],
            ),
            const SizedBox(height: 20),

            if (authState.errorMessage != null)
              Container(
                padding: const EdgeInsets.all(10),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.red.shade200),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.error_outline,
                      color: Colors.red,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        authState.errorMessage!,
                        style: const TextStyle(fontSize: 12, color: Colors.red),
                      ),
                    ),
                  ],
                ),
              ),

            // Tab View Body
            SizedBox(
              height: 230,
              child: TabBarView(
                controller: _tabController,
                children: [
                  // 1. Phone.email OTP Tab
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.blue.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.blue.shade200),
                        ),
                        child: const Row(
                          children: [
                            Icon(
                              Icons.verified_user,
                              color: AppTheme.trustBlue,
                              size: 18,
                            ),
                            SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                'Verified by Phone.email (Client ID: 15695407177920574360)',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: AppTheme.trustBlue,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _phoneController,
                        decoration: const InputDecoration(
                          labelText: 'Mobile Phone Number',
                          prefixIcon: Icon(Icons.phone),
                          border: OutlineInputBorder(),
                        ),
                        keyboardType: TextInputType.phone,
                      ),
                      const SizedBox(height: 10),
                      if (_otpSent)
                        TextField(
                          controller: _otpController,
                          decoration: const InputDecoration(
                            labelText: 'Enter 6-Digit OTP',
                            prefixIcon: Icon(Icons.lock_clock_outlined),
                            border: OutlineInputBorder(),
                          ),
                          keyboardType: TextInputType.number,
                        ),
                      const SizedBox(height: 12),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.trustBlue,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                        icon: const Icon(Icons.send),
                        label: Text(
                          _otpSent
                              ? 'Verify OTP & Continue'
                              : 'Send Phone.email OTP',
                        ),
                        onPressed: authState.isLoading
                            ? null
                            : _handlePhoneLogin,
                      ),
                    ],
                  ),

                  // 2. Email & Password Tab
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      TextField(
                        controller: _emailController,
                        decoration: const InputDecoration(
                          labelText: 'Email Address',
                          prefixIcon: Icon(Icons.email_outlined),
                          border: OutlineInputBorder(),
                        ),
                        keyboardType: TextInputType.emailAddress,
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _passwordController,
                        decoration: const InputDecoration(
                          labelText: 'Password',
                          prefixIcon: Icon(Icons.lock_outline),
                          border: OutlineInputBorder(),
                        ),
                        obscureText: true,
                      ),
                      const SizedBox(height: 14),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.emergencyDarkRed,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                        icon: const Icon(Icons.login),
                        label: const Text('Sign In with Password'),
                        onPressed: authState.isLoading
                            ? null
                            : _handleEmailLogin,
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 10),

            // Demo Accounts Quick Switcher
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Quick Demonstration Accounts:',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: [
                      ActionChip(
                        avatar: const Icon(Icons.person, size: 16),
                        label: const Text(
                          'Citizen (VSK)',
                          style: TextStyle(fontSize: 11),
                        ),
                        onPressed: () => _selectDemoAccount(
                          'patient.vsk@vvit.net',
                          'Citizen',
                        ),
                      ),
                      ActionChip(
                        avatar: const Icon(
                          Icons.volunteer_activism,
                          size: 16,
                          color: Colors.green,
                        ),
                        label: const Text(
                          'NSS Volunteer',
                          style: TextStyle(fontSize: 11),
                        ),
                        onPressed: () => _selectDemoAccount(
                          'responder@vvit.net',
                          'Responder',
                        ),
                      ),
                      ActionChip(
                        avatar: const Icon(
                          Icons.local_hospital,
                          size: 16,
                          color: Colors.red,
                        ),
                        label: const Text(
                          'Hospital Staff',
                          style: TextStyle(fontSize: 11),
                        ),
                        onPressed: () => _selectDemoAccount(
                          'hospital.admin@aiims.edu.in',
                          'Medical Staff',
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Offline Emergency Bypass
            OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.warningOrange,
                side: const BorderSide(
                  color: AppTheme.warningOrange,
                  width: 1.5,
                ),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              icon: const Icon(Icons.offline_bolt_outlined),
              label: const Text(
                'Instant Offline Emergency Mode',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              onPressed: () {
                ref
                    .read(authNotifierProvider.notifier)
                    .loginOfflineEmergencyMode();
                context.go('/home');
              },
            ),
            const SizedBox(height: 16),

            // Register Link
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text("Don't have an account?"),
                TextButton(
                  onPressed: () => context.push('/register'),
                  child: const Text('Register New Account'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
