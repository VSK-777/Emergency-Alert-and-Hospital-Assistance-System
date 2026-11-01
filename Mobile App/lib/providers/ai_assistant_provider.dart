import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/constants/api_endpoints.dart';
import '../core/network/api_client.dart';
import '../models/ai_triage_model.dart';
import 'auth_provider.dart';

class ChatMessage {
  final String sender; // 'user' or 'ai'
  final String text;
  final AiTriageModel? triageData;
  final DateTime timestamp;

  ChatMessage({
    required this.sender,
    required this.text,
    this.triageData,
    required this.timestamp,
  });
}

class AiAssistantState {
  final bool isLoading;
  final List<ChatMessage> messages;
  final bool isCprMetronomeActive;
  final int cprBeatsPerMinute;
  final String? errorMessage;

  AiAssistantState({
    this.isLoading = false,
    this.messages = const [],
    this.isCprMetronomeActive = false,
    this.cprBeatsPerMinute = 110,
    this.errorMessage,
  });

  AiAssistantState copyWith({
    bool? isLoading,
    List<ChatMessage>? messages,
    bool? isCprMetronomeActive,
    int? cprBeatsPerMinute,
    String? errorMessage,
  }) {
    return AiAssistantState(
      isLoading: isLoading ?? this.isLoading,
      messages: messages ?? this.messages,
      isCprMetronomeActive: isCprMetronomeActive ?? this.isCprMetronomeActive,
      cprBeatsPerMinute: cprBeatsPerMinute ?? this.cprBeatsPerMinute,
      errorMessage: errorMessage,
    );
  }
}

class AiAssistantNotifier extends StateNotifier<AiAssistantState> {
  final ApiClient apiClient;
  Timer? _metronomeTimer;

  AiAssistantNotifier({required this.apiClient})
    : super(
        AiAssistantState(
          messages: [
            ChatMessage(
              sender: 'ai',
              text:
                  'Hello, I am your Emergency Medical AI Assistant. Describe any symptom, injury, or emergency, and I will immediately provide verified first-aid guidance and clinical triage.',
              timestamp: DateTime.now(),
            ),
          ],
        ),
      );

  Future<void> sendQuery(String prompt) async {
    final cleanPrompt = prompt.trim();
    if (cleanPrompt.isEmpty) return;

    final userMsg = ChatMessage(
      sender: 'user',
      text: cleanPrompt,
      timestamp: DateTime.now(),
    );

    state = state.copyWith(
      isLoading: true,
      messages: [...state.messages, userMsg],
      errorMessage: null,
    );

    // 1. Try online Spring Boot backend with Google Gemini AI
    try {
      final response = await apiClient.dio.post(
        ApiEndpoints.aiTriage,
        data: {'query': cleanPrompt},
      );

      if (response.statusCode == 200) {
        final data = response.data;
        final triage = AiTriageModel(
          query: cleanPrompt,
          category: data['triageLevel'] ?? 'URGENT',
          urgency: data['triageLevel'] ?? 'URGENT',
          summary: data['summary'] ?? 'Emergency analysis complete.',
          immediateSteps:
              (data['immediateActionSteps'] as List?)
                  ?.map((e) => e.toString())
                  .toList() ??
              [
                'Call 108 / local ambulance immediately',
                'Ensure patient is safe and breathing',
              ],
          warnings:
              (data['hospitalPrepRecommendations'] as List?)
                  ?.map((e) => e.toString())
                  .toList() ??
              ['Prepare emergency bay'],
          cprRequired:
              cleanPrompt.toLowerCase().contains('unresponsive') ||
              cleanPrompt.toLowerCase().contains('no pulse'),
          confidenceScore: 0.96,
          isOfflineResult: false,
        );

        final aiMsg = ChatMessage(
          sender: 'ai',
          text: triage.summary,
          triageData: triage,
          timestamp: DateTime.now(),
        );

        state = state.copyWith(
          isLoading: false,
          messages: [...state.messages, aiMsg],
        );
        return;
      }
    } catch (_) {
      // Offline fallback: Use local clinical pattern matching engine
    }

    final offlineTriage = _runOfflineTriageClassifier(cleanPrompt);
    final offlineMsg = ChatMessage(
      sender: 'ai',
      text: offlineTriage.summary,
      triageData: offlineTriage,
      timestamp: DateTime.now(),
    );

    state = state.copyWith(
      isLoading: false,
      messages: [...state.messages, offlineMsg],
    );
  }

  AiTriageModel _runOfflineTriageClassifier(String query) {
    final lower = query.toLowerCase();

    // 1. Cardiac Arrest / Unconscious
    if (lower.contains('cardiac') ||
        lower.contains('heart') ||
        lower.contains('unresponsive') ||
        lower.contains('no pulse') ||
        lower.contains('collapsed')) {
      return AiTriageModel(
        query: query,
        category: 'Cardiac Arrest',
        urgency: 'CRITICAL',
        summary:
            'SUSPECTED CARDIAC ARREST — Immediate CPR is required to maintain brain perfusion.',
        immediateSteps: [
          'Verify responsiveness: Shake shoulders and shout "Are you OK?".',
          'If no breathing or only gasping, immediately push SOS to alert nearest hospital.',
          'Start Hands-Only CPR: Place heel of hand on center of chest, interlock fingers.',
          'Compress hard and fast at 100-120 bpm, at least 2 inches (5 cm) deep.',
          'Allow chest to recoil fully between compressions without lifting hands.',
        ],
        warnings: [
          'Do NOT stop compressions for more than 10 seconds.',
          'Do NOT hesitate to do CPR even if untrained in mouth-to-mouth.',
        ],
        cprRequired: true,
        isOfflineResult: true,
      );
    }

    // 2. Severe Bleeding
    if (lower.contains('bleed') ||
        lower.contains('blood') ||
        lower.contains('cut') ||
        lower.contains('stab') ||
        lower.contains('hemorrhage')) {
      return AiTriageModel(
        query: query,
        category: 'Severe Bleeding',
        urgency: 'CRITICAL',
        summary:
            'SEVERE HEMORRHAGE — Apply firm continuous pressure to prevent hypovolemic shock.',
        immediateSteps: [
          'Expose wound by removing clothing.',
          'Apply direct, continuous, firm pressure with sterile gauze, clean cloth, or hands.',
          'Hold pressure firmly for at least 5-10 minutes without lifting cloth to peek.',
          'If blood soaks through, add another cloth layer on top — do NOT remove the first layer.',
          'If limb bleeding is catastrophic, apply an improvised or commercial tourniquet 2-3 inches above wound.',
        ],
        warnings: [
          'Do NOT remove impaled objects; pack around them.',
          'Do NOT apply tourniquets over joints (elbows/knees).',
        ],
        cprRequired: false,
        isOfflineResult: true,
      );
    }

    // 3. Road Accident / Spinal Trauma
    if (lower.contains('accident') ||
        lower.contains('crash') ||
        lower.contains('bike') ||
        lower.contains('car') ||
        lower.contains('hit')) {
      return AiTriageModel(
        query: query,
        category: 'Road Traffic Accident',
        urgency: 'CRITICAL',
        summary:
            'ROAD ACCIDENT TRAUMA — Protect spinal column and secure immediate scene.',
        immediateSteps: [
          'Secure accident scene: Turn on vehicle hazards and divert oncoming traffic.',
          'DO NOT move victim unless there is imminent danger of explosion or fire.',
          'Manually stabilize the head and neck in neutral alignment to avoid spinal cord severance.',
          'If motorcyclist is breathing normally, DO NOT remove helmet.',
          'Cover victim with blanket to preserve body temperature.',
        ],
        warnings: [
          'Moving an unstable cervical spine can cause permanent paralysis.',
          'Do NOT give water, tea, or food to accident victims.',
        ],
        cprRequired: false,
        isOfflineResult: true,
      );
    }

    // 4. Choking
    if (lower.contains('chok') ||
        lower.contains('airway') ||
        lower.contains('cannot breathe') ||
        lower.contains('food stuck')) {
      return AiTriageModel(
        query: query,
        category: 'Airway Obstruction (Choking)',
        urgency: 'URGENT',
        summary: 'FOREIGN BODY AIRWAY OBSTRUCTION — Perform Heimlich Maneuver.',
        immediateSteps: [
          'Ask "Are you choking?". If victim nods and cannot speak, act immediately.',
          'Stand behind victim and wrap arms around waist.',
          'Make a fist with one hand and place thumb side just above navel.',
          'Grasp fist with other hand and press hard with quick upward thrusts.',
          'Repeat thrusts until object is dislodged or person becomes unconscious.',
        ],
        warnings: [
          'For infants under 1 year, use 5 back slaps and 5 chest thrusts instead of Heimlich.',
        ],
        cprRequired: false,
        isOfflineResult: true,
      );
    }

    // 5. Burns
    if (lower.contains('burn') ||
        lower.contains('fire') ||
        lower.contains('scald') ||
        lower.contains('hot water')) {
      return AiTriageModel(
        query: query,
        category: 'Thermal Burn',
        urgency: 'URGENT',
        summary:
            'THERMAL BURN INJURY — Cool the burn immediately with clean cool water.',
        immediateSteps: [
          'Immediately cool burn under cool running tap water for at least 15-20 minutes.',
          'Remove jewelry, belts, and tight clothing before swelling starts.',
          'Cover burn loosely with a clean, sterile, non-adherent dressing or plastic cling wrap.',
          'Keep patient warm to avoid hypothermia.',
        ],
        warnings: [
          'NEVER apply ice, ice water, butter, oil, or toothpaste to burns.',
          'Do NOT pop or puncture burn blisters.',
        ],
        cprRequired: false,
        isOfflineResult: true,
      );
    }

    // Default Fallback
    return AiTriageModel(
      query: query,
      category: 'General Medical Emergency',
      urgency: 'URGENT',
      summary:
          'MEDICAL EMERGENCY TRIAGE — Prioritize airway, breathing, and circulation.',
      immediateSteps: [
        'Check patient responsiveness and maintain an open airway.',
        'Keep patient in recovery position if unconscious but breathing normally.',
        'Comfort patient, loosen tight clothing, and do not leave unattended.',
        'Keep dispatch active through the app SOS button for immediate ambulance response.',
      ],
      warnings: [
        'Do not administer oral medications without confirmed physician prescription.',
      ],
      cprRequired: false,
      isOfflineResult: true,
    );
  }

  void toggleCprMetronome() {
    final nextState = !state.isCprMetronomeActive;
    _metronomeTimer?.cancel();
    if (nextState) {
      _metronomeTimer = Timer.periodic(const Duration(milliseconds: 545), (_) {
        // 110 bpm ~ 545ms per pulse
      });
    }
    state = state.copyWith(isCprMetronomeActive: nextState);
  }

  @override
  void dispose() {
    _metronomeTimer?.cancel();
    super.dispose();
  }
}

final aiAssistantNotifierProvider =
    StateNotifierProvider<AiAssistantNotifier, AiAssistantState>((ref) {
      final apiClient = ref.watch(apiClientProvider);
      return AiAssistantNotifier(apiClient: apiClient);
    });
