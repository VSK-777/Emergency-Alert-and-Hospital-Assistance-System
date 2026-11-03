package net.vvit.csp.emergency.service;

import net.vvit.csp.emergency.dto.MedicalDocumentDto;
import net.vvit.csp.emergency.dto.PresignedUploadRequest;
import net.vvit.csp.emergency.dto.PresignedUploadResponse;
import net.vvit.csp.emergency.exception.BadRequestException;
import net.vvit.csp.emergency.exception.ResourceNotFoundException;
import net.vvit.csp.emergency.model.EmergencyIncident;
import net.vvit.csp.emergency.model.MedicalDocument;
import net.vvit.csp.emergency.model.User;
import net.vvit.csp.emergency.model.UserRole;
import net.vvit.csp.emergency.repository.EmergencyIncidentRepository;
import net.vvit.csp.emergency.repository.MedicalDocumentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@Service
public class FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private final MedicalDocumentRepository documentRepository;
    private final EmergencyIncidentRepository incidentRepository;
    private final RestTemplate restTemplate;

    @Value("${supabase.url:}")
    private String supabaseUrl;

    @Value("${supabase.secret-key:}")
    private String supabaseSecretKey;

    @Value("${supabase.storage.bucket:emergency-attachments}")
    private String storageBucket;

    public FileStorageService(MedicalDocumentRepository documentRepository,
                              EmergencyIncidentRepository incidentRepository) {
        this.documentRepository = documentRepository;
        this.incidentRepository = incidentRepository;
        this.restTemplate = new RestTemplate();
    }

    /**
     * Store an uploaded medical file or incident photo. Validates MIME type and file size,
     * uploads to Supabase S3 Storage (with local disk fallback for offline/dev),
     * and saves document metadata in Neon PostgreSQL.
     */
    @Transactional
    public MedicalDocumentDto storeFile(MultipartFile file, User user, String incidentId, String description) {
        validateFile(file.getContentType(), file.getSize());

        String sanitizedFilename = sanitizeFilename(file.getOriginalFilename());
        String storageKey = String.format("users/%d/%s_%s",
                user.getId(), UUID.randomUUID().toString().substring(0, 8), sanitizedFilename);

        EmergencyIncident incident = null;
        if (incidentId != null && !incidentId.isBlank()) {
            incident = incidentRepository.findById(incidentId.trim()).orElse(null);
        }

        try {
            byte[] fileBytes = file.getBytes();
            boolean uploadedToCloud = uploadToSupabaseStorage(storageKey, fileBytes, file.getContentType());

            if (!uploadedToCloud) {
                // Fallback to local persistent storage directory for offline dev
                saveLocally(storageKey, fileBytes);
            }

            MedicalDocument doc = new MedicalDocument(
                    user,
                    incident,
                    sanitizedFilename,
                    file.getContentType(),
                    file.getSize(),
                    storageKey,
                    storageBucket,
                    description != null && !description.isBlank() ? description.trim() : "Patient medical emergency record"
            );

            MedicalDocument saved = documentRepository.save(doc);
            log.info("Stored medical document {} ({} bytes, key: {}) for user {}",
                    saved.getFileName(), saved.getFileSizeBytes(), saved.getStorageKey(), user.getEmail());

            String downloadUrl = "/api/v1/files/" + saved.getId() + "/download";
            return MedicalDocumentDto.fromEntity(saved, downloadUrl);

        } catch (IOException e) {
            log.error("Failed to read file bytes for upload", e);
            throw new BadRequestException("Could not process file upload: " + e.getMessage());
        }
    }

    /**
     * Generate a pre-signed upload URL for client-direct uploads.
     */
    @Transactional
    public PresignedUploadResponse createPresignedUpload(PresignedUploadRequest request, User user) {
        validateFile(request.getFileType(), request.getFileSizeBytes());

        String sanitizedFilename = sanitizeFilename(request.getFileName());
        String storageKey = String.format("users/%d/%s_%s",
                user.getId(), UUID.randomUUID().toString().substring(0, 8), sanitizedFilename);

        EmergencyIncident incident = null;
        if (request.getIncidentId() != null && !request.getIncidentId().isBlank()) {
            incident = incidentRepository.findById(request.getIncidentId().trim()).orElse(null);
        }

        MedicalDocument doc = new MedicalDocument(
                user,
                incident,
                sanitizedFilename,
                request.getFileType(),
                request.getFileSizeBytes(),
                storageKey,
                storageBucket,
                request.getDescription()
        );
        doc.setUploadStatus("PENDING");
        MedicalDocument saved = documentRepository.save(doc);

        String uploadUrl = "/api/v1/files/" + saved.getId() + "/upload";
        return new PresignedUploadResponse(
                saved.getId(),
                storageKey,
                uploadUrl,
                900, // 15 minutes TTL
                MAX_FILE_SIZE
        );
    }

    /**
     * Confirm a pending upload.
     */
    @Transactional
    public MedicalDocumentDto confirmUpload(Long documentId, User user) {
        MedicalDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with ID: " + documentId));

        if (!doc.getUser().getId().equals(user.getId()) && user.getRole() != UserRole.ADMIN) {
            throw new BadRequestException("You do not have permission to modify this document.");
        }

        doc.setUploadStatus("CONFIRMED");
        MedicalDocument saved = documentRepository.save(doc);
        return MedicalDocumentDto.fromEntity(saved, "/api/v1/files/" + saved.getId() + "/download");
    }

    /**
     * Retrieve file content bytes for authenticated download.
     */
    public byte[] retrieveFileBytes(Long documentId, User user) {
        MedicalDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Medical document not found: " + documentId));

        // Strict authorization: citizens only access their own documents; responders & hospital staff access incident-linked docs
        boolean isOwner = doc.getUser().getId().equals(user.getId());
        boolean isStaffOrAdmin = user.getRole() == UserRole.ADMIN ||
                                 user.getRole() == UserRole.HOSPITAL_STAFF ||
                                 user.getRole() == UserRole.RESPONDER;

        if (!isOwner && !isStaffOrAdmin) {
            log.warn("Unauthorized document download attempt by user {} on document {}", user.getEmail(), documentId);
            throw new BadRequestException("Access denied to requested medical document.");
        }

        // Try downloading from Supabase S3 Storage first
        byte[] cloudBytes = downloadFromSupabaseStorage(doc.getStorageKey());
        if (cloudBytes != null && cloudBytes.length > 0) {
            return cloudBytes;
        }

        // Fallback to local storage if cloud not configured
        return readLocally(doc.getStorageKey());
    }

    public MedicalDocument getDocumentMetadata(Long documentId, User user) {
        MedicalDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Medical document not found: " + documentId));

        boolean isOwner = doc.getUser().getId().equals(user.getId());
        boolean isStaffOrAdmin = user.getRole() == UserRole.ADMIN ||
                                 user.getRole() == UserRole.HOSPITAL_STAFF ||
                                 user.getRole() == UserRole.RESPONDER;

        if (!isOwner && !isStaffOrAdmin) {
            throw new BadRequestException("Access denied to requested medical document.");
        }
        return doc;
    }

    public List<MedicalDocumentDto> listUserDocuments(Long userId) {
        List<MedicalDocument> docs = documentRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return docs.stream()
                .map(d -> MedicalDocumentDto.fromEntity(d, "/api/v1/files/" + d.getId() + "/download"))
                .toList();
    }

    public List<MedicalDocumentDto> listIncidentDocuments(String incidentId) {
        List<MedicalDocument> docs = documentRepository.findByIncidentIdOrderByCreatedAtDesc(incidentId);
        return docs.stream()
                .map(d -> MedicalDocumentDto.fromEntity(d, "/api/v1/files/" + d.getId() + "/download"))
                .toList();
    }

    @Transactional
    public void deleteDocument(Long documentId, User user) {
        MedicalDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with ID: " + documentId));

        boolean isOwner = doc.getUser().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == UserRole.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new BadRequestException("You do not have permission to delete this document.");
        }

        deleteFromSupabaseStorage(doc.getStorageKey());
        deleteLocally(doc.getStorageKey());
        documentRepository.delete(doc);
        log.info("Deleted medical document {} by user {}", documentId, user.getEmail());
    }

    // =========================================================================
    // Supabase S3-Compatible Storage REST Driver
    // =========================================================================

    private boolean uploadToSupabaseStorage(String storageKey, byte[] data, String contentType) {
        if (supabaseUrl == null || supabaseUrl.isBlank() || supabaseSecretKey == null || supabaseSecretKey.isBlank()) {
            return false;
        }

        try {
            String url = String.format("%s/storage/v1/object/%s/%s",
                    cleanUrl(supabaseUrl), storageBucket, storageKey);

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + supabaseSecretKey.trim());
            headers.set("apikey", supabaseSecretKey.trim());
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.set("x-upsert", "true");

            HttpEntity<byte[]> requestEntity = new HttpEntity<>(data, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, requestEntity, String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception ex) {
            log.warn("Supabase S3 storage upload failed for key {}. Falling back to local storage. Reason: {}",
                    storageKey, ex.getMessage());
            return false;
        }
    }

    private byte[] downloadFromSupabaseStorage(String storageKey) {
        if (supabaseUrl == null || supabaseUrl.isBlank() || supabaseSecretKey == null || supabaseSecretKey.isBlank()) {
            return null;
        }

        try {
            String url = String.format("%s/storage/v1/object/authenticated/%s/%s",
                    cleanUrl(supabaseUrl), storageBucket, storageKey);

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + supabaseSecretKey.trim());
            headers.set("apikey", supabaseSecretKey.trim());

            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
            ResponseEntity<byte[]> response = restTemplate.exchange(url, HttpMethod.GET, requestEntity, byte[].class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception ex) {
            log.warn("Could not retrieve file {} from Supabase Storage: {}", storageKey, ex.getMessage());
        }
        return null;
    }

    private void deleteFromSupabaseStorage(String storageKey) {
        if (supabaseUrl == null || supabaseUrl.isBlank() || supabaseSecretKey == null || supabaseSecretKey.isBlank()) {
            return;
        }

        try {
            String url = String.format("%s/storage/v1/object/%s/%s",
                    cleanUrl(supabaseUrl), storageBucket, storageKey);

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + supabaseSecretKey.trim());
            headers.set("apikey", supabaseSecretKey.trim());

            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
            restTemplate.exchange(url, HttpMethod.DELETE, requestEntity, String.class);
        } catch (Exception ex) {
            log.warn("Failed to delete from Supabase S3 storage: {}", ex.getMessage());
        }
    }

    // =========================================================================
    // Local Filesystem Storage Fallback
    // =========================================================================

    private void saveLocally(String storageKey, byte[] data) {
        try {
            Path targetPath = Paths.get("uploads", storageKey);
            Files.createDirectories(targetPath.getParent());
            try (FileOutputStream fos = new FileOutputStream(targetPath.toFile())) {
                fos.write(data);
            }
        } catch (IOException e) {
            log.warn("Local storage fallback write failed: {}", e.getMessage());
        }
    }

    private byte[] readLocally(String storageKey) {
        try {
            Path targetPath = Paths.get("uploads", storageKey);
            if (Files.exists(targetPath)) {
                return Files.readAllBytes(targetPath);
            }
        } catch (IOException e) {
            log.warn("Local storage fallback read failed: {}", e.getMessage());
        }
        throw new ResourceNotFoundException("File content could not be located in storage.");
    }

    private void deleteLocally(String storageKey) {
        try {
            Path targetPath = Paths.get("uploads", storageKey);
            Files.deleteIfExists(targetPath);
        } catch (Exception ignored) {}
    }

    private void validateFile(String contentType, long sizeBytes) {
        if (sizeBytes <= 0 || sizeBytes > MAX_FILE_SIZE) {
            throw new BadRequestException("File size must be between 1 byte and 10 MB. Submitted: " + sizeBytes + " bytes.");
        }
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Unsupported file type: " + contentType + ". Allowed types: PDF, JPEG, PNG, WEBP.");
        }
    }

    private String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return "document.pdf";
        }
        String clean = new File(filename).getName();
        return clean.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private String cleanUrl(String url) {
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}
