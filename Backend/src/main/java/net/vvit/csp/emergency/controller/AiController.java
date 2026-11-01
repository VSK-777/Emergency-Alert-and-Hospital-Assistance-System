package net.vvit.csp.emergency.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import net.vvit.csp.emergency.dto.AiSummaryRequest;
import net.vvit.csp.emergency.dto.AiSummaryResponse;
import net.vvit.csp.emergency.service.AiAssistantService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai")
@Tag(name = "AI Assistance", description = "AI-assisted triage, bystander emergency action steps, and hospital preparation summaries")
public class AiController {

    private final AiAssistantService aiService;

    public AiController(AiAssistantService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/triage")
    @Operation(summary = "Generate AI triage evaluation and hospital preparation checklist")
    public ResponseEntity<AiSummaryResponse> generateTriage(@Valid @RequestBody AiSummaryRequest request) {
        return ResponseEntity.ok(aiService.generateEmergencyTriage(request));
    }
}
