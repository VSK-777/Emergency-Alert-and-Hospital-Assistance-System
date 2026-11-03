package net.vvit.csp.emergency.dto;

public class PresignedUploadResponse {
    private Long documentId;
    private String storageKey;
    private String uploadUrl;
    private long expiresInSeconds;
    private long maxSizeBytes;

    public PresignedUploadResponse() {}

    public PresignedUploadResponse(Long documentId, String storageKey, String uploadUrl, long expiresInSeconds, long maxSizeBytes) {
        this.documentId = documentId;
        this.storageKey = storageKey;
        this.uploadUrl = uploadUrl;
        this.expiresInSeconds = expiresInSeconds;
        this.maxSizeBytes = maxSizeBytes;
    }

    public Long getDocumentId() { return documentId; }
    public String getStorageKey() { return storageKey; }
    public String getUploadUrl() { return uploadUrl; }
    public long getExpiresInSeconds() { return expiresInSeconds; }
    public long getMaxSizeBytes() { return maxSizeBytes; }
}
