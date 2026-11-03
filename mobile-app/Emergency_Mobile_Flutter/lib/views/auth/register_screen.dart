import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _phoneController = TextEditingController();
  final _allergiesController = TextEditingController(text: 'None');
  final _conditionsController = TextEditingController(text: 'None');

  String _selectedRole = 'CITIZEN';
  String _selectedBloodGroup = 'O+';
  String _selectedOrganization = 'NSS - National Service Scheme';

  final List<String> _bloodGroups = [
    'A+',
    'A-',
    'B+',
    'B-',
    'AB+',
    'AB-',
    'O+',
    'O-',
  ];
  final List<String> _organizations = [
    'NSS - National Service Scheme',
    'NCC - National Cadet Corps',
    'Youth Red Cross (IRCS)',
    'Community First Responder NGO',
    'Local Good Samaritan',
  ];

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _phoneController.dispose();
    _allergiesController.dispose();
    _conditionsController.dispose();
    super.dispose();
  }

  void _handleRegister() async {
    if (_fullNameController.text.trim().isEmpty ||
        _emailController.text.trim().isEmpty ||
        _passwordController.text.isEmpty ||
        _phoneController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all required fields.')),
      );
      return;
    }

    final regData = {
      'fullName': _fullNameController.text.trim(),
      'email': _emailController.text.trim(),
      'password': _passwordController.text,
      'phoneNumber': _phoneController.text.trim(),
      'role': _selectedRole,
      'bloodGroup': _selectedBloodGroup,
      'allergies': _allergiesController.text.trim(),
      'medicalConditions': _conditionsController.text.trim(),
      'organization': _selectedRole == 'RESPONDER'
          ? _selectedOrganization
          : null,
    };

    final success = await ref
        .read(authNotifierProvider.notifier)
        .register(regData);
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Registration successful! Welcome to the ecosystem.'),
        ),
      );
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authNotifierProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Create New Account')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Join the Emergency Response Network',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimaryLight,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Select your participation role and provide essential emergency information.',
              style: TextStyle(
                fontSize: 12,
                color: AppTheme.textSecondaryLight,
              ),
            ),
            const SizedBox(height: 20),

            // Role Selector Radio Cards
            const Text(
              'Account Role:',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: ChoiceChip(
                    avatar: const Icon(Icons.person, size: 16),
                    label: const Text('Citizen'),
                    selected: _selectedRole == 'CITIZEN',
                    selectedColor: AppTheme.trustBlue.withOpacity(0.2),
                    onSelected: (val) {
                      if (val) setState(() => _selectedRole = 'CITIZEN');
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ChoiceChip(
                    avatar: const Icon(Icons.volunteer_activism, size: 16),
                    label: const Text('Volunteer'),
                    selected: _selectedRole == 'RESPONDER',
                    selectedColor: AppTheme.verifiedGreen.withOpacity(0.2),
                    onSelected: (val) {
                      if (val) setState(() => _selectedRole = 'RESPONDER');
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ChoiceChip(
                    avatar: const Icon(Icons.local_hospital, size: 16),
                    label: const Text('Medical Staff'),
                    selected: _selectedRole == 'HOSPITAL_STAFF',
                    selectedColor: AppTheme.emergencyRed.withOpacity(0.2),
                    onSelected: (val) {
                      if (val) setState(() => _selectedRole = 'HOSPITAL_STAFF');
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Responder Organization Selection
            if (_selectedRole == 'RESPONDER') ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.green.shade50,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.green.shade200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Volunteer Corps Affiliation:',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.green,
                      ),
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: _selectedOrganization,
                      decoration: const InputDecoration(
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 8,
                        ),
                      ),
                      items: _organizations.map((org) {
                        return DropdownMenuItem(
                          value: org,
                          child: Text(
                            org,
                            style: const TextStyle(fontSize: 12),
                          ),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null)
                          setState(() => _selectedOrganization = val);
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            TextField(
              controller: _fullNameController,
              decoration: const InputDecoration(
                labelText: 'Full Name *',
                prefixIcon: Icon(Icons.badge_outlined),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _emailController,
              decoration: const InputDecoration(
                labelText: 'Email Address *',
                prefixIcon: Icon(Icons.email_outlined),
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _passwordController,
              decoration: const InputDecoration(
                labelText: 'Password *',
                prefixIcon: Icon(Icons.lock_outline),
                border: OutlineInputBorder(),
              ),
              obscureText: true,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _phoneController,
              decoration: const InputDecoration(
                labelText: 'Phone Number *',
                prefixIcon: Icon(Icons.phone_outlined),
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.phone,
            ),
            const SizedBox(height: 16),

            // Medical Information section
            const Text(
              'Emergency Medical ID Information:',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: AppTheme.emergencyDarkRed,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  flex: 1,
                  child: DropdownButtonFormField<String>(
                    value: _selectedBloodGroup,
                    decoration: const InputDecoration(
                      labelText: 'Blood Group',
                      border: OutlineInputBorder(),
                    ),
                    items: _bloodGroups.map((bg) {
                      return DropdownMenuItem(value: bg, child: Text(bg));
                    }).toList(),
                    onChanged: (val) {
                      if (val != null)
                        setState(() => _selectedBloodGroup = val);
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: TextField(
                    controller: _allergiesController,
                    decoration: const InputDecoration(
                      labelText: 'Known Allergies',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _conditionsController,
              decoration: const InputDecoration(
                labelText: 'Chronic Conditions (e.g. Asthma, Diabetes)',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 20),

            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.emergencyDarkRed,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              onPressed: authState.isLoading ? null : _handleRegister,
              child: authState.isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : const Text(
                      'Complete Registration & Create Profile',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
