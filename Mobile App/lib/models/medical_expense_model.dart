class MedicalExpenseModel {
  final int? id;
  final String incidentId;
  final int userId;
  final String category;
  final String description;
  final double amount;
  final String status;
  final DateTime createdAt;

  MedicalExpenseModel({
    this.id,
    required this.incidentId,
    this.userId = 1,
    required this.category,
    required this.description,
    required this.amount,
    this.status = 'PENDING',
    required this.createdAt,
  });

  factory MedicalExpenseModel.fromJson(Map<String, dynamic> json) {
    return MedicalExpenseModel(
      id: json['id'] is int
          ? json['id']
          : int.tryParse(json['id']?.toString() ?? ''),
      incidentId: json['incidentId'] ?? '',
      userId: json['userId'] is int
          ? json['userId']
          : int.tryParse(json['userId']?.toString() ?? '1') ?? 1,
      category: json['category'] ?? 'MISC',
      description: json['description'] ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      status: json['status'] ?? 'PENDING',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt']) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'incidentId': incidentId,
      'userId': userId,
      'category': category,
      'description': description,
      'amount': amount,
      'status': status,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
