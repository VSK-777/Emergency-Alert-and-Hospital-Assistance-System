import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_icons.dart';
import '../../models/medical_expense_model.dart';
import '../../providers/expense_provider.dart';

class ExpensesScreen extends ConsumerWidget {
  const ExpensesScreen({super.key});

  void _showAddExpenseDialog(BuildContext context, WidgetRef ref) {
    final descController = TextEditingController();
    final amountController = TextEditingController();
    String selectedCategory = 'AMBULANCE';

    final categories = [
      'AMBULANCE',
      'HOSPITAL',
      'CONSULTATION',
      'MEDICINES',
      'DIAGNOSTICS',
      'OTHER',
    ];

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Add Medical Expense'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<String>(
                  value: selectedCategory,
                  decoration: const InputDecoration(
                    labelText: 'Category',
                    border: OutlineInputBorder(),
                  ),
                  items: categories
                      .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                      .toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => selectedCategory = val);
                  },
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: descController,
                  decoration: const InputDecoration(
                    labelText: 'Service Description *',
                    hintText: 'e.g. Trauma X-Ray, Blood Test',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: amountController,
                  decoration: const InputDecoration(
                    labelText: 'Amount (₹) *',
                    prefixText: '₹ ',
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
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
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.trustBlue,
              ),
              onPressed: () {
                final amount =
                    double.tryParse(amountController.text.trim()) ?? 0.0;
                final desc = descController.text.trim();
                if (desc.isEmpty || amount <= 0) return;

                ref
                    .read(expenseNotifierProvider.notifier)
                    .addExpense(
                      category: selectedCategory,
                      description: desc,
                      amount: amount,
                    );
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text(
                      'Expense logged and synchronized to transparent ledger.',
                    ),
                  ),
                );
              },
              child: const Text(
                'Log Expense',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final expenseState = ref.watch(expenseNotifierProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Medical Expenses Ledger'),
        actions: [
          IconButton(
            tooltip: 'Add Expense',
            icon: const Icon(Icons.add),
            onPressed: () => _showAddExpenseDialog(context, ref),
          ),
          IconButton(
            tooltip: 'Refresh Ledger',
            icon: const Icon(Icons.refresh),
            onPressed: () =>
                ref.read(expenseNotifierProvider.notifier).loadExpenses(),
          ),
        ],
      ),
      body: expenseState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              child: Column(
                children: [
                  // Summary Banner
                  Container(
                    margin: const EdgeInsets.all(16),
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF1E3C72), Color(0xFF2A5298)],
                      ),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.15),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Total Emergency Healthcare Expenses',
                          style: TextStyle(color: Colors.white70, fontSize: 13),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          '₹ ${expenseState.totalExpenditure.toStringAsFixed(2)}',
                          style: const TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: 1.1,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            const Icon(
                              Icons.verified,
                              size: 14,
                              color: Colors.greenAccent,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '${expenseState.expenses.length} Itemized Records • Protected by CSP Audit Log',
                              style: const TextStyle(
                                fontSize: 11,
                                color: Colors.white70,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Itemized List Header
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16.0,
                      vertical: 4,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Itemized Bill & Receipts:',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        TextButton.icon(
                          icon: const Icon(Icons.add_circle_outline, size: 16),
                          label: const Text(
                            'Add Entry',
                            style: TextStyle(fontSize: 12),
                          ),
                          onPressed: () => _showAddExpenseDialog(context, ref),
                        ),
                      ],
                    ),
                  ),

                  if (expenseState.expenses.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(32.0),
                      child: Text(
                        'No expenses recorded. Tap Add Entry to log emergency care costs.',
                      ),
                    )
                  else
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: expenseState.expenses.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final exp = expenseState.expenses[index];
                        return _buildExpenseTile(context, exp);
                      },
                    ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
    );
  }

  Widget _buildExpenseTile(BuildContext context, MedicalExpenseModel exp) {
    IconData iconData = AppIcons.expenses;
    Color iconColor = AppTheme.trustBlue;

    if (exp.category == 'AMBULANCE') {
      iconData = AppIcons.ambulance;
      iconColor = Colors.deepOrange;
    } else if (exp.category == 'HOSPITAL') {
      iconData = AppIcons.hospital;
      iconColor = Colors.teal;
    } else if (exp.category == 'DIAGNOSTICS') {
      iconData = Icons.biotech_outlined;
      iconColor = Colors.purple;
    } else if (exp.category == 'MEDICINES') {
      iconData = AppIcons.medication;
      iconColor = Colors.green;
    }

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        leading: CircleAvatar(
          backgroundColor: iconColor.withOpacity(0.12),
          child: Icon(iconData, color: iconColor, size: 22),
        ),
        title: Text(
          exp.description,
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
        ),
        subtitle: Text(
          '${exp.category} • Status: ${exp.status}',
          style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
        ),
        trailing: Text(
          '₹ ${exp.amount.toStringAsFixed(2)}',
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
      ),
    );
  }
}
