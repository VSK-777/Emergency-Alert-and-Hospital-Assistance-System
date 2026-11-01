package net.vvit.csp.emergency.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import net.vvit.csp.emergency.dto.SyncBatchRequest;
import net.vvit.csp.emergency.dto.SyncBatchResponse;
import net.vvit.csp.emergency.model.User;
import net.vvit.csp.emergency.service.AuthService;
import net.vvit.csp.emergency.service.SyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/sync")
@Tag(name = "Synchronization", description = "Offline-first batch incident upload and idempotency synchronization")
public class SyncController {

    private final SyncService syncService;
    private final AuthService authService;

    public SyncController(SyncService syncService, AuthService authService) {
        this.syncService = syncService;
        this.authService = authService;
    }

    @PostMapping
    @Operation(summary = "Batch upload offline pending emergency incidents with idempotency keys")
    public ResponseEntity<SyncBatchResponse> syncBatch(@Valid @RequestBody SyncBatchRequest request) {
        User user = null;
        try {
            user = authService.getCurrentAuthenticatedUser();
        } catch (Exception ignored) {
            // Allow device syncing even if auth token has expired during disconnection
        }
        SyncBatchResponse response = syncService.processBatchSync(request, user);
        return ResponseEntity.ok(response);
    }
}
