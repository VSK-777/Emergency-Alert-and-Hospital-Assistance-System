package net.vvit.csp.emergency.dto;

import net.vvit.csp.emergency.model.MedicalDocument;
import java.time.LocalDateTime;

public class MedicalDocumentDto {
    private Long id;
    private Long userId;
    private String incidentId;
    private String fileName;
    private String fileType;
    private Long fileSizeBytes;
    private String storageKey;
    private String description;
    private String downloadUrl;
    private LocalDateTime createdAt;

    public MedicalDocumentDto() {}

    public static MedicalDocumentDto fromEntity(MedicalDocument entity, String downloadUrl) {
        MedicalDocumentDto dto = new MedicalDocumentDto();
        dto.id = entity.getId();
        dto.userId = entity.getUser() != null ? entity.getUser().getId() : null;
        dto.incidentId = entity.getIncident() != null ? entity.getIncident().getId() : null;
        dto.fileName = entity.getFileName();
        dto.fileType = entity.getFileType();
        dto.fileSizeBytes = entity.getFileSizeBytes();
        dto.storageKey = entity.getStorageKey();
        dto.description = entity.getDescription();
        dto.downloadUrl = downloadUrl;
        dto.createdAt = entity.getCreatedAt();
        return dto;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getIncidentId() { return incidentId; }
    public String getFileName() { return fileName; }
    public String getFileType() { return fileType; }
    public Long getFileSizeBytes() { return fileSizeBytes; }
    public String getStorageKey() { return storageKey; }
    public String getDescription() { return description; }
    public String getDownloadUrl() { return downloadUrl; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
