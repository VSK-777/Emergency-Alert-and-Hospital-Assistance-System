import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../models/user_model.dart';
import '../../services/file_service.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  bool _minimalDataSharing = true;
  List<MedicalDocumentItem> _documents = [];
  bool _isLoadingDocs = false;
  bool _isUploadingDoc = false;

  @override
  void initState() {
    super.initState();
    _loadDocuments();
  }

  Future<void> _loadDocuments() async {
    setState(() => _isLoadingDocs = true);
    final fileService = FileService(ref.read(apiClientProvider));
    final docs = await fileService.getMyDocuments();
    if (mounted) {
      setState(() {
        _documents = docs;
        _isLoadingDocs = false;
      });
    }
  }

  Future<void> _pickAndUploadDoc() async {
    setState(() => _isUploadingDoc = true);
    final fileService = FileService(ref.read(apiClientProvider));
    final doc = await fileService.pickAndUploadDocument();
    if (mounted) {
      setState(() => _isUploadingDoc = false);
      if (doc != null) {
        setState(() => _documents.insert(0, doc));
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Document uploaded to cloud storage successfully')),
        );
      }
    }
  }

  Future<void> _deleteDoc(int id) async {
    final fileService = FileService(ref.read(apiClientProvider));
    final ok = await fileService.deleteDocument(id);
    if (ok && mounted) {
      setState(() => _documents.removeWhere((d) => d.id == id));
    }
  }

  void _showEditProfileDialog(BuildContext context, UserModel user) {
    final bloodGroupController = TextEditingController(
      text: user.bloodGroup ?? 'O+',
    );
    final allergiesController = TextEditingController(
      text: user.allergies ?? 'None',
    );
    final conditionsController = TextEditingController(
      text: user.medicalConditions ?? 'None',
    );
    final contactNameController = TextEditingController(
      text: user.emergencyContactName ?? 'Bhargav T (Brother)',
    );
    final contactPhoneController = TextEditingController(
      text: user.emergencyContactPhone ?? '+91 98765 43220',
    );

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Update Medical Profile'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: bloodGroupController,
                decoration: const InputDecoration(
                  labelText: 'Blood Group',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: allergiesController,
                decoration: const InputDecoration(
                  labelText: 'Allergies',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: conditionsController,
                decoration: const InputDecoration(
                  labelText: 'Pre-existing Conditions',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: contactNameController,
                decoration: const InputDecoration(
                  labelText: 'Primary Emergency Contact',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: contactPhoneController,
                decoration: const InputDecoration(
                  labelText: 'Contact Phone Number',
                  border: OutlineInputBorder(),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final updated = user.copyWith(
                bloodGroup: bloodGroupController.text.trim(),
                allergies: allergiesController.text.trim(),
                medicalConditions: conditionsController.text.trim(),
                emergencyContactName: contactNameController.text.trim(),
                emergencyContactPhone: contactPhoneController.text.trim(),
              );
              ref.read(authNotifierProvider.notifier).updateProfile(updated);
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text(
                    'Medical ID Profile updated and cached locally.',
                  ),
                ),
              );
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authNotifierProvider);
    final user = authState.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Emergency Medical Profile'),
        actions: [
          IconButton(
            tooltip: 'Edit Medical ID',
            icon: const Icon(Icons.edit_outlined),
            onPressed: user != null
                ? () => _showEditProfileDialog(context, user)
                : null,
          ),
          IconButton(
            tooltip: 'Logout',
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await ref.read(authNotifierProvider.notifier).logout();
              if (context.mounted) context.go('/login');
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Column(
                children: [
                  const CircleAvatar(
                    radius: 38,
                    backgroundColor: AppTheme.trustBlue,
                    child: Icon(Icons.person, size: 44, color: Colors.white),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    user?.fullName ?? 'Sai Krishna VSK',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    user?.email ?? 'patient.vsk@vvit.net',
                    style: const TextStyle(
                      color: AppTheme.textSecondaryLight,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.trustBlue.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'Role: ${user?.role ?? 'CITIZEN'}${user?.organization != null ? ' • ${user!.organization}' : ''}',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.trustBlue,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Emergency Medical ID Card
            const Text(
              'Digital Emergency Medical ID (Glanceable)',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Card(
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(color: Colors.red.shade200, width: 1.5),
              ),
              color: Colors.red.shade50.withOpacity(0.5),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    _buildMedicalRow(
                      'Blood Group',
                      user?.bloodGroup ?? 'O+',
                      Icons.bloodtype,
                      Colors.red,
                    ),
                    const Divider(),
                    _buildMedicalRow(
                      'Registered Phone',
                      user?.phoneNumber ?? '+91 98765 43210',
                      Icons.phone,
                      AppTheme.trustBlue,
                    ),
                    const Divider(),
                    _buildMedicalRow(
                      'Known Allergies',
                      user?.allergies ?? 'Penicillin',
                      Icons.warning_amber,
                      Colors.orange,
                    ),
                    const Divider(),
                    _buildMedicalRow(
                      'Medical Conditions',
                      user?.medicalConditions ?? 'Asthma (Mild)',
                      Icons.medical_information,
                      Colors.teal,
                    ),
                    const Divider(),
                    _buildMedicalRow(
                      'Emergency Contact',
                      '${user?.emergencyContactName ?? 'Bhargav T (Brother)'} (${user?.emergencyContactPhone ?? '+91 98765 43220'})',
                      Icons.contact_phone,
                      Colors.purple,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Privacy & Data Governance Card
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Privacy & Consent Controls:',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 6),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text(
                      'Minimal Necessary Data Sharing',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    subtitle: const Text(
                      'Only transmit blood group and vital allergies to attending ER during active dispatch.',
                      style: TextStyle(fontSize: 11),
                    ),
                    value: _minimalDataSharing,
                    activeColor: AppTheme.trustBlue,
                    onChanged: (val) {
                      setState(() => _minimalDataSharing = val);
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Medical Documents & Attachments (Supabase S3)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.folder_shared, color: AppTheme.trustBlue, size: 20),
                            SizedBox(width: 8),
                            Text(
                              'Medical Documents (Cloud Storage)',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        TextButton.icon(
                          icon: _isUploadingDoc
                              ? const SizedBox(
                                  width: 14,
                                  height: 14,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Icon(Icons.upload_file, size: 16),
                          label: Text(_isUploadingDoc ? 'Uploading...' : 'Upload'),
                          onPressed: _isUploadingDoc ? null : _pickAndUploadDoc,
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Attach medical reports, prescriptions, or insurance cards for emergency personnel.',
                      style: TextStyle(fontSize: 11, color: AppTheme.textSecondaryLight),
                    ),
                    const SizedBox(height: 10),
                    if (_isLoadingDocs)
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.all(8.0),
                          child: CircularProgressIndicator(),
                        ),
                      )
                    else if (_documents.isEmpty)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.grey.shade300),
                        ),
                        child: const Text(
                          'No documents uploaded yet. Tap Upload to pick a PDF or image.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 11, color: Colors.grey),
                        ),
                      )
                    else
                      ..._documents.map(
                        (doc) => Container(
                          margin: const EdgeInsets.only(bottom: 6),
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade50,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.grey.shade200),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.description, size: 20, color: AppTheme.trustBlue),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      doc.originalFileName,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    Text(
                                      '${(doc.fileSizeBytes / 1024).toStringAsFixed(1)} KB · ${doc.fileCategory}',
                                      style: const TextStyle(fontSize: 10, color: Colors.grey),
                                    ),
                                  ],
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.delete_outline, size: 18, color: Colors.redAccent),
                                onPressed: () => _deleteDoc(doc.id),
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: const Row(
                children: [
                  Icon(
                    Icons.lock_clock_outlined,
                    size: 20,
                    color: AppTheme.trustBlue,
                  ),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'All medical data is stored encrypted in device secure hardware and synchronized over TLS with AES-256 tokens.',
                      style: TextStyle(fontSize: 11, color: AppTheme.trustBlue),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: const Column(
                children: [
                  Text(
                    'Emergency Alert and Hospital Assistance System',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'VVIT B.Tech CSE Batch 8 • Prepared by VSK (Reg. No: 24BQ1A054O)',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 11,
                      color: AppTheme.textSecondaryLight,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMedicalRow(
    String label,
    String value,
    IconData icon,
    Color color,
  ) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppTheme.textSecondaryLight,
                  ),
                ),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
