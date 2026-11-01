class FirstAidModel {
  final String id;
  final String title;
  final String urgency; // CRITICAL, URGENT
  final String icon;
  final String attribution;
  final String overview;
  final List<String> steps;
  final List<String> warnings;

  FirstAidModel({
    required this.id,
    required this.title,
    required this.urgency,
    required this.icon,
    required this.attribution,
    required this.overview,
    required this.steps,
    required this.warnings,
  });

  factory FirstAidModel.fromJson(Map<String, dynamic> json) {
    return FirstAidModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      urgency: json['urgency'] ?? 'URGENT',
      icon: json['icon'] ?? 'shield',
      attribution: json['attribution'] ?? '',
      overview: json['overview'] ?? '',
      steps: List<String>.from(json['steps'] ?? []),
      warnings: List<String>.from(json['warnings'] ?? []),
    );
  }
}
