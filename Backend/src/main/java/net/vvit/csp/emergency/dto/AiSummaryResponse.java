package net.vvit.csp.emergency.dto;

import java.util.List;

public class AiSummaryResponse {
    private String summary;
    private String triageLevel; // CRITICAL, URGENT, STABLE
    private List<String> immediateActionSteps;
    private List<String> hospitalPrepRecommendations;
    private String providerSource; // "GEMINI_PRO" or "RULE_BASED_OFFLINE_FALLBACK"
    private boolean isAIGenerated;

    public AiSummaryResponse() {}

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getTriageLevel() { return triageLevel; }
    public void setTriageLevel(String triageLevel) { this.triageLevel = triageLevel; }

    public List<String> getImmediateActionSteps() { return immediateActionSteps; }
    public void setImmediateActionSteps(List<String> immediateActionSteps) { this.immediateActionSteps = immediateActionSteps; }

    public List<String> getHospitalPrepRecommendations() { return hospitalPrepRecommendations; }
    public void setHospitalPrepRecommendations(List<String> hospitalPrepRecommendations) { this.hospitalPrepRecommendations = hospitalPrepRecommendations; }

    public String getProviderSource() { return providerSource; }
    public void setProviderSource(String providerSource) { this.providerSource = providerSource; }

    public boolean isAIGenerated() { return isAIGenerated; }
    public void setAIGenerated(boolean AIGenerated) { isAIGenerated = AIGenerated; }
}
