import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/api_endpoints.dart';
import '../../core/theme/app_theme.dart';
import '../../models/emergency_contact_model.dart';
import '../../providers/auth_provider.dart';

final contactsProvider = FutureProvider<List<EmergencyContactModel>>((
  ref,
) async {
  final apiClient = ref.watch(apiClientProvider);
  final localStore = ref.watch(localStoreProvider);

  try {
    final response = await apiClient.dio.get(ApiEndpoints.emergencyContacts);
    if (response.statusCode == 200) {
      final List list = response.data;
      final contacts = list
          .map((e) => EmergencyContactModel.fromJson(e))
          .toList();
      await localStore.cacheContacts(list.cast<Map<String, dynamic>>());
      return contacts;
    }
  } catch (_) {
    final cached = await localStore.getCachedContacts();
    if (cached.isNotEmpty) {
      return cached.map((e) => EmergencyContactModel.fromJson(e)).toList();
    }
  }

  // Pre-seeded fallback contacts
  return [
    EmergencyContactModel(
      id: 1,
      name: 'Bhargav T (Guardian)',
      relationship: 'Brother',
      phoneNumber: '+919876543220',
      isPrimary: true,
    ),
    EmergencyContactModel(
      id: 2,
      name: 'Teja Y (Emergency Contact)',
      relationship: 'Friend',
      phoneNumber: '+919876543221',
      isPrimary: false,
    ),
  ];
});

class ContactsScreen extends ConsumerWidget {
  const ContactsScreen({super.key});

  void _showAddDialog(BuildContext context, WidgetRef ref) {
    final nameCtrl = TextEditingController();
    final relCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    bool isPrimary = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Add Emergency Contact'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameCtrl,
                  decoration: const InputDecoration(labelText: 'Full Name'),
                ),
                TextField(
                  controller: relCtrl,
                  decoration: const InputDecoration(labelText: 'Relationship'),
                ),
                TextField(
                  controller: phoneCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Phone Number (+91...)',
                  ),
                ),
                CheckboxListTile(
                  title: const Text('Primary Contact'),
                  value: isPrimary,
                  onChanged: (val) => setState(() => isPrimary = val ?? false),
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
              onPressed: () async {
                final apiClient = ref.read(apiClientProvider);
                try {
                  await apiClient.dio.post(
                    ApiEndpoints.emergencyContacts,
                    data: {
                      'name': nameCtrl.text.trim(),
                      'relationship': relCtrl.text.trim(),
                      'phoneNumber': phoneCtrl.text.trim(),
                      'isPrimary': isPrimary,
                    },
                  );
                  ref.refresh(contactsProvider);
                } catch (_) {}
                if (context.mounted) Navigator.pop(ctx);
              },
              child: const Text('Save Contact'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final contactsAsync = ref.watch(contactsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Emergency Contacts'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _showAddDialog(context, ref),
          ),
        ],
      ),
      body: contactsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: $err')),
        data: (contacts) {
          if (contacts.isEmpty) {
            return const Center(
              child: Text('No emergency contacts added yet.'),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: contacts.length,
            itemBuilder: (context, index) {
              final contact = contacts[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: contact.isPrimary
                        ? AppTheme.emergencyRed.withOpacity(0.15)
                        : AppTheme.trustBlue.withOpacity(0.12),
                    child: Icon(
                      Icons.person,
                      color: contact.isPrimary
                          ? AppTheme.emergencyRed
                          : AppTheme.trustBlue,
                    ),
                  ),
                  title: Row(
                    children: [
                      Text(
                        contact.name,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(width: 8),
                      if (contact.isPrimary)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: AppTheme.emergencyRed,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'PRIMARY',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                    ],
                  ),
                  subtitle: Text(
                    '${contact.relationship} • ${contact.phoneNumber}',
                  ),
                  trailing: IconButton(
                    icon: const Icon(Icons.call, color: AppTheme.verifiedGreen),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            'Dialing ${contact.name} (${contact.phoneNumber})...',
                          ),
                        ),
                      );
                    },
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
