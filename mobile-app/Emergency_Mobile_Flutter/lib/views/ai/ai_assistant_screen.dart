import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/ai_assistant_provider.dart';

class AiAssistantScreen extends ConsumerStatefulWidget {
  const AiAssistantScreen({super.key});

  @override
  ConsumerState<AiAssistantScreen> createState() => _AiAssistantScreenState();
}

class _AiAssistantScreenState extends ConsumerState<AiAssistantScreen> {
  final _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  final List<String> _quickPrompts = [
    'Person collapsed with no pulse',
    'Severe bleeding from arm',
    'Child is choking on food',
    'Motorcycle crash spinal trauma',
    'Hot oil burn on forearm',
    'Suspected snake bite on leg',
  ];

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _sendMessage([String? textToSend]) {
    final text = textToSend ?? _textController.text;
    if (text.trim().isEmpty) return;
    _textController.clear();
    ref.read(aiAssistantNotifierProvider.notifier).sendQuery(text);

    Future.delayed(const Duration(milliseconds: 200), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final aiState = ref.watch(aiAssistantNotifierProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Emergency Medical Assistant'),
        backgroundColor: Colors.purple.shade800,
        actions: [
          IconButton(
            tooltip: aiState.isCprMetronomeActive
                ? 'Stop CPR Metronome'
                : 'Start CPR Metronome (110 bpm)',
            icon: Icon(
              Icons.favorite,
              color: aiState.isCprMetronomeActive
                  ? Colors.redAccent
                  : Colors.white,
            ),
            onPressed: () {
              ref
                  .read(aiAssistantNotifierProvider.notifier)
                  .toggleCprMetronome();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Clinical Safety Disclaimer
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: Colors.amber.shade100,
            child: Row(
              children: [
                Icon(
                  Icons.info_outline,
                  size: 18,
                  color: Colors.amber.shade900,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'AI first-aid triage is supplemental guidance. Emergency dispatch remains active.',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.amber.shade900,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // CPR Metronome Banner if active
          if (aiState.isCprMetronomeActive)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: Colors.red.shade900,
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.heart_broken, color: Colors.white, size: 18),
                  SizedBox(width: 8),
                  Text(
                    'CPR METRONOME ACTIVE: 110 BEATS/MIN • PUSH HARD & FAST',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),

          // Chat Messages View
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: aiState.messages.length,
              itemBuilder: (context, index) {
                final msg = aiState.messages[index];
                final isUser = msg.sender == 'user';
                return _buildMessageBubble(context, msg, isUser);
              },
            ),
          ),

          // Loading Typing Indicator
          if (aiState.isLoading)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Row(
                children: [
                  const SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.purple,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'AI evaluating medical protocol and triage level...',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.purple.shade700,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ),
            ),

          // Quick Prompt Pills
          Container(
            height: 38,
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _quickPrompts.length,
              separatorBuilder: (_, __) => const SizedBox(width: 6),
              itemBuilder: (context, idx) {
                final prompt = _quickPrompts[idx];
                return ActionChip(
                  label: Text(prompt, style: const TextStyle(fontSize: 11)),
                  backgroundColor: Colors.purple.shade50,
                  side: BorderSide(color: Colors.purple.shade200),
                  onPressed: () => _sendMessage(prompt),
                );
              },
            ),
          ),
          const SizedBox(height: 6),

          // Input Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Colors.grey.shade300)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _textController,
                    decoration: const InputDecoration(
                      hintText: 'Describe emergency symptom or injury...',
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 8,
                      ),
                    ),
                    onSubmitted: (val) => _sendMessage(),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.send, color: Colors.purple),
                  onPressed: () => _sendMessage(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(
    BuildContext context,
    ChatMessage msg,
    bool isUser,
  ) {
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.85,
        ),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isUser ? Colors.purple.shade700 : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(12),
          border: isUser ? null : Border.all(color: Colors.grey.shade300),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  isUser ? Icons.person : Icons.psychology,
                  size: 14,
                  color: isUser ? Colors.white70 : Colors.purple.shade800,
                ),
                const SizedBox(width: 4),
                Text(
                  isUser ? 'You' : 'AI Medical Assistant',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: isUser ? Colors.white70 : Colors.purple.shade800,
                  ),
                ),
                if (!isUser && msg.triageData != null) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 5,
                      vertical: 1,
                    ),
                    decoration: BoxDecoration(
                      color: msg.triageData!.isOfflineResult
                          ? Colors.orange.shade100
                          : Colors.green.shade100,
                      borderRadius: BorderRadius.circular(3),
                    ),
                    child: Text(
                      msg.triageData!.isOfflineResult
                          ? 'OFFLINE PROTOCOL'
                          : 'ONLINE GEMINI',
                      style: TextStyle(
                        fontSize: 8,
                        fontWeight: FontWeight.bold,
                        color: msg.triageData!.isOfflineResult
                            ? Colors.orange.shade900
                            : Colors.green.shade900,
                      ),
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 6),
            Text(
              msg.text,
              style: TextStyle(
                fontSize: 13,
                color: isUser ? Colors.white : Colors.black87,
                height: 1.3,
              ),
            ),
            // Triage steps and warnings if present
            if (!isUser && msg.triageData != null) ...[
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: msg.triageData!.urgency == 'CRITICAL'
                                ? Colors.red.shade100
                                : Colors.amber.shade100,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            'TRIAGE: ${msg.triageData!.urgency}',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: msg.triageData!.urgency == 'CRITICAL'
                                  ? Colors.red.shade900
                                  : Colors.amber.shade900,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          msg.triageData!.category,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Immediate Action Steps:',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    ...msg.triageData!.immediateSteps.map(
                      (step) => Padding(
                        padding: const EdgeInsets.only(bottom: 3),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              '• ',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 11,
                              ),
                            ),
                            Expanded(
                              child: Text(
                                step,
                                style: const TextStyle(fontSize: 11),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    if (msg.triageData!.warnings.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      const Text(
                        'Critical Precautions:',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: Colors.red,
                        ),
                      ),
                      const SizedBox(height: 2),
                      ...msg.triageData!.warnings.map(
                        (warn) => Text(
                          '⚠️ $warn',
                          style: const TextStyle(
                            fontSize: 10,
                            color: Colors.red,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
