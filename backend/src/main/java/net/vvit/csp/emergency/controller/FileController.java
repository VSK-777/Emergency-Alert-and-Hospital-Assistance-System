package net.vvit.csp.emergency.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import net.vvit.csp.emergency.dto.MedicalDocumentDto;
import net.vvit.csp.emergency.dto.PresignedUploadRequest;
import net.vvit.csp.emergency.dto.PresignedUploadResponse;
import net.vvit.csp.emergency.model.MedicalDocument;
import net.vvit.csp.emergency.model.User;
import net.vvit.csp.emergency.service.AuthService;
import net.vvit.csp.emergency.service.FileStorageService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/files")
@Tag(name = "Medical Files & Object Storage", description = "Supabase S3-compatible file storage for medical records, patient PDFs, and incident photos")
public class FileController {

    private final FileStorageService fileStorageService;
    private final AuthService authService;

    public FileController(FileStorageService fileStorageService, AuthService authService) {
        this.fileStorageService = fileStorageService;
        this.authService = authService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a medical document or emergency attachment (PDF, PNG, JPG up to 10MB)")
    public ResponseEntity<MedicalDocumentDto> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "incidentId", required = false) String incidentId,
            @RequestParam(value = "description", required = false) String description
    ) {
        User user = authService.getCurrentAuthenticatedUser();
        MedicalDocumentDto dto = fileStorageService.storeFile(file, user, incidentId, description);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @PostMapping("/presign-upload")
    @Operation(summary = "Request pre-signed upload metadata for client-side direct upload")
    public ResponseEntity<PresignedUploadResponse> presignUpload(
            @Valid @RequestBody PresignedUploadRequest request
    ) {
        User user = authService.getCurrentAuthenticatedUser();
        PresignedUploadResponse response = fileStorageService.createPresignedUpload(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{id}/confirm")
    @Operation(summary = "Confirm successful client-side upload of a medical document")
    public ResponseEntity<MedicalDocumentDto> confirmUpload(@PathVariable Long id) {
        User user = authService.getCurrentAuthenticatedUser();
        MedicalDocumentDto dto = fileStorageService.confirmUpload(id, user);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/my")
    @Operation(summary = "List all medical documents and attachments for the authenticated citizen")
    public ResponseEntity<List<MedicalDocumentDto>> getMyDocuments() {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(fileStorageService.listUserDocuments(user.getId()));
    }

    @GetMapping("/incident/{incidentId}")
    @Operation(summary = "List all medical documents and photos attached to an emergency incident")
    public ResponseEntity<List<MedicalDocumentDto>> getIncidentDocuments(@PathVariable String incidentId) {
        return ResponseEntity.ok(fileStorageService.listIncidentDocuments(incidentId));
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "Download an authenticated medical file or attachment")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long id) {
        User user = authService.getCurrentAuthenticatedUser();
        MedicalDocument metadata = fileStorageService.getDocumentMetadata(id, user);
        byte[] data = fileStorageService.retrieveFileBytes(id, user);

        ByteArrayResource resource = new ByteArrayResource(data);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(metadata.getFileType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + metadata.getFileName() + "\"")
                .contentLength(data.length)
                .body(resource);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a medical document (Owner or Admin only)")
    public ResponseEntity<Map<String, Object>> deleteFile(@PathVariable Long id) {
        User user = authService.getCurrentAuthenticatedUser();
        fileStorageService.deleteDocument(id, user);
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Medical document deleted successfully."
        ));
    }
}
