package net.vvit.csp.emergency.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class SyncBatchResponse {
    private List<String> syncedIncidentIds = new ArrayList<>();
    private List<String> duplicateIgnoredIds = new ArrayList<>();
    private List<SyncFailureItem> failures = new ArrayList<>();
    private LocalDateTime serverTimestamp = LocalDateTime.now();

    public SyncBatchResponse() {}

    public static class SyncFailureItem {
        private String incidentId;
        private String reason;

        public SyncFailureItem() {}
        public SyncFailureItem(String incidentId, String reason) {
            this.incidentId = incidentId;
            this.reason = reason;
        }

        public String getIncidentId() { return incidentId; }
        public void setIncidentId(String incidentId) { this.incidentId = incidentId; }

        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    public List<String> getSyncedIncidentIds() { return syncedIncidentIds; }
    public void setSyncedIncidentIds(List<String> syncedIncidentIds) { this.syncedIncidentIds = syncedIncidentIds; }

    public List<String> getDuplicateIgnoredIds() { return duplicateIgnoredIds; }
    public void setDuplicateIgnoredIds(List<String> duplicateIgnoredIds) { this.duplicateIgnoredIds = duplicateIgnoredIds; }

    public List<SyncFailureItem> getFailures() { return failures; }
    public void setFailures(List<SyncFailureItem> failures) { this.failures = failures; }

    public LocalDateTime getServerTimestamp() { return serverTimestamp; }
    public void setServerTimestamp(LocalDateTime serverTimestamp) { this.serverTimestamp = serverTimestamp; }
}
