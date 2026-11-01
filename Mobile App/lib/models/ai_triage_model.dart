class AiTriageModel {
  final String query;
  final String
  category; // Road accident, Cardiac arrest, Severe bleeding, Fall, Choking, Burn, Fracture, Other
  final String urgency; // CRITICAL, URGENT, STABLE
  final String summary;
  final List<String> immediateSteps;
  final List<String> warnings;
  final bool cprRequired;
  final double confidenceScore;
  final bool isOfflineResult;

  AiTriageModel({
    required this.query,
    required this.category,
    required this.urgency,
    required this.summary,
    required this.immediateSteps,
    this.warnings = const [],
    this.cprRequired = false,
    this.confidenceScore = 0.95,
    this.isOfflineResult = false,
  });

  factory AiTriageModel.fromJson(
    Map<String, dynamic> json, {
    String query = '',
    bool isOffline = false,
  }) {
    return AiTriageModel(
      query: query.isNotEmpty ? query : (json['query'] ?? ''),
      category:
          json['category'] ?? json['detectedEmergency'] ?? 'Medical Emergency',
      urgency: json['urgency'] ?? json['severity'] ?? 'URGENT',
      summary:
          json['summary'] ??
          json['triageSummary'] ??
          'First-aid guidance recommended.',
      immediateSteps:
          (json['immediateSteps'] as List?)
              ?.map((e) => e.toString())
              .toList() ??
          (json['steps'] as List?)?.map((e) => e.toString()).toList() ??
          [
            'Ensure scene safety',
            'Call local emergency helpline',
            'Keep patient calm and still',
          ],
      warnings:
          (json['warnings'] as List?)?.map((e) => e.toString()).toList() ??
          ['Do not give fluids to an unconscious person'],
      cprRequired: json['cprRequired'] ?? false,
      confidenceScore: (json['confidenceScore'] as num?)?.toDouble() ?? 0.90,
      isOfflineResult: isOffline || (json['isOfflineResult'] ?? false),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'query': query,
      'category': category,
      'urgency': urgency,
      'summary': summary,
      'immediateSteps': immediateSteps,
      'warnings': warnings,
      'cprRequired': cprRequired,
      'confidenceScore': confidenceScore,
      'isOfflineResult': isOfflineResult,
    };
  }
}
