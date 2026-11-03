package net.vvit.csp.emergency.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.vvit.csp.emergency.dto.AiSummaryRequest;
import net.vvit.csp.emergency.dto.AiSummaryResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class AiAssistantService {
    private static final Logger log = LoggerFactory.getLogger(AiAssistantService.class);

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent}")
    private String geminiApiUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AiSummaryResponse generateEmergencyTriage(AiSummaryRequest request) {
        // If Gemini API key is configured, attempt cloud LLM query
        if (geminiApiKey != null && !geminiApiKey.isBlank() && !geminiApiKey.equals("your_gemini_api_key_optional")) {
            try {
                return callGeminiApi(request);
            } catch (Exception ex) {
                log.warn("Gemini AI API call failed or timed out: {}. Seamlessly falling back to rule-based triage.", ex.getMessage());
            }
        }

        // Safe deterministic clinical fallback
        return generateRuleBasedFallback(request);
    }

    private AiSummaryResponse callGeminiApi(AiSummaryRequest request) throws Exception {
        String prompt = String.format(
                "You are an emergency medical assistance AI coordinator for an Emergency Response System. " +
                "Evaluate this emergency incident:\n" +
                "Query / Symptoms: %s\n" +
                "Emergency Type: %s\n" +
                "Patient Medical Profile: %s\n\n" +
                "Provide a JSON response with:\n" +
                "1. 'summary': concise summary for hospital trauma staff\n" +
                "2. 'triageLevel': 'CRITICAL', 'URGENT', or 'STABLE'\n" +
                "3. 'immediateActionSteps': array of immediate non-diagnostic first aid steps for bystanders\n" +
                "4. 'hospitalPrepRecommendations': array of equipment/ICU/blood unit preparations needed\n" +
                "Respond ONLY with valid JSON without markdown tags.",
                request.getQuery(),
                request.getEmergencyType() != null ? request.getEmergencyType() : "Unknown",
                request.getPatientMedicalNotes() != null ? request.getPatientMedicalNotes() : "None reported"
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> part = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(part));
        Map<String, Object> requestBody = Map.of("contents", List.of(content));

        String url = geminiApiUrl + "?key=" + geminiApiKey;
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            JsonNode root = objectMapper.readTree(response.getBody());
            String text = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
            
            // Clean up possible markdown code blocks ```json ... ```
            text = text.replaceAll("```json", "").replaceAll("```", "").trim();
            JsonNode jsonResult = objectMapper.readTree(text);

            AiSummaryResponse aiResponse = new AiSummaryResponse();
            aiResponse.setSummary(jsonResult.path("summary").asText());
            aiResponse.setTriageLevel(jsonResult.path("triageLevel").asText("URGENT"));

            List<String> steps = new ArrayList<>();
            jsonResult.path("immediateActionSteps").forEach(n -> steps.add(n.asText()));
            aiResponse.setImmediateActionSteps(steps);

            List<String> preps = new ArrayList<>();
            jsonResult.path("hospitalPrepRecommendations").forEach(n -> preps.add(n.asText()));
            aiResponse.setHospitalPrepRecommendations(preps);

            aiResponse.setProviderSource("GEMINI_1.5_FLASH");
            aiResponse.setAIGenerated(true);
            return aiResponse;
        }

        throw new RuntimeException("Empty or non-200 response from Gemini API");
    }

    private AiSummaryResponse generateRuleBasedFallback(AiSummaryRequest request) {
        String query = (request.getQuery() != null ? request.getQuery() : "").toLowerCase();
        String type = (request.getEmergencyType() != null ? request.getEmergencyType() : "").toLowerCase();

        AiSummaryResponse response = new AiSummaryResponse();
        response.setProviderSource("RULE_BASED_CLINICAL_PROTOCOL_FALLBACK");
        response.setAIGenerated(false);

        if (query.contains("fall") || type.contains("fall") || query.contains("impact") || query.contains("accident")) {
            response.setTriageLevel("CRITICAL");
            response.setSummary("High-impact trauma or fall event detected with potential cranial/spinal involvement.");
            response.setImmediateActionSteps(List.of(
                    "Do not move the victim unless in immediate physical danger (fire/traffic).",
                    "Keep cervical spine and head immobilized in neutral alignment.",
                    "Check for airway patency and continuous breathing.",
                    "Control active external hemorrhage with direct firm pressure using clean cloth."
            ));
            response.setHospitalPrepRecommendations(List.of(
                    "Prepare Trauma Bay 1 with cervical collar and spinal backboard.",
                    "Ready emergency non-contrast CT Head and C-Spine scanner.",
                    "Ensure immediate availability of 2 units O-negative blood.",
                    "Alert on-duty Orthopedic and Neurotrauma surgical teams."
            ));
        } else if (query.contains("heart") || query.contains("chest") || query.contains("cardiac")) {
            response.setTriageLevel("CRITICAL");
            response.setSummary("Suspected Acute Coronary Syndrome or Cardiac Distress event.");
            response.setImmediateActionSteps(List.of(
                    "Have victim sit in comfortable resting position with knees bent.",
                    "Loosen tight clothing around neck and chest.",
                    "If unconscious and pulseless, commence hands-only CPR immediately (100-120 bpm).",
                    "Retrieve AED if in a public facility."
            ));
            response.setHospitalPrepRecommendations(List.of(
                    "Activate Cath Lab team for primary percutaneous coronary intervention (PCI).",
                    "Prepare 12-lead ECG and continuous defibrillator monitor in ER Bay.",
                    "Ready IV Heparin, Aspirin 325mg, and Sublingual Nitroglycerin."
            ));
        } else if (query.contains("bleed") || query.contains("cut") || query.contains("hemorrhage")) {
            response.setTriageLevel("URGENT");
            response.setSummary("Severe external hemorrhage with potential hypovolemic risk.");
            response.setImmediateActionSteps(List.of(
                    "Apply continuous firm direct pressure over wound using sterile gauze or clean cloth.",
                    "Do not remove soaked dressings; pack additional layers on top.",
                    "Keep victim lying flat with legs elevated if conscious to maintain cerebral perfusion."
            ));
            response.setHospitalPrepRecommendations(List.of(
                    "Prepare vascular repair tray and sterile suturing packs in Minor OT.",
                    "Have IV Crystalloid fluids (Normal Saline / Ringer's Lactate) ready for rapid bolus.",
                    "Cross-match blood type and verify hematocrit levels."
            ));
        } else {
            response.setTriageLevel("URGENT");
            response.setSummary("General Medical Emergency incident triggered via SOS.");
            response.setImmediateActionSteps(List.of(
                    "Ensure scene safety for both victim and bystander.",
                    "Assess responsiveness and maintain open airway.",
                    "Keep victim calm and covered with a light blanket to prevent shock.",
                    "Monitor vital signs until emergency medical services arrive."
            ));
            response.setHospitalPrepRecommendations(List.of(
                    "Assign Emergency Triage Bay with vitals monitor.",
                    "Prepare triage registration and notify attending emergency medical officer."
            ));
        }

        return response;
    }
}
