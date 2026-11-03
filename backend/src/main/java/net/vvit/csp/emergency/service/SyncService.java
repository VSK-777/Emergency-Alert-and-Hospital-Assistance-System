package net.vvit.csp.emergency.service;

import net.vvit.csp.emergency.dto.IncidentCreateRequest;
import net.vvit.csp.emergency.dto.SyncBatchRequest;
import net.vvit.csp.emergency.dto.SyncBatchResponse;
import net.vvit.csp.emergency.model.User;
import net.vvit.csp.emergency.repository.EmergencyIncidentRepository;
import net.vvit.csp.emergency.repository.SyncRecordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SyncService {
    private static final Logger log = LoggerFactory.getLogger(SyncService.class);

    private final EmergencyService emergencyService;
    private final SyncRecordRepository syncRecordRepo;
    private final EmergencyIncidentRepository incidentRepo;

    public SyncService(EmergencyService emergencyService,
                       SyncRecordRepository syncRecordRepo,
                       EmergencyIncidentRepository incidentRepo) {
        this.emergencyService = emergencyService;
        this.syncRecordRepo = syncRecordRepo;
        this.incidentRepo = incidentRepo;
    }

    @Transactional
    public SyncBatchResponse processBatchSync(SyncBatchRequest request, User user) {
        SyncBatchResponse response = new SyncBatchResponse();
        log.info("Processing sync batch from device {} with {} incidents",
                request.getDeviceId(), request.getIncidents().size());

        for (IncidentCreateRequest incidentReq : request.getIncidents()) {
            String id = incidentReq.getId();
            String key = incidentReq.getIdempotencyKey();

            try {
                // Check if already processed by idempotency key or ID
                boolean alreadyProcessed = false;
                if (key != null && !key.isBlank() && syncRecordRepo.existsByIdempotencyKey(key)) {
                    alreadyProcessed = true;
                } else if (id != null && !id.isBlank() && incidentRepo.existsById(id)) {
                    alreadyProcessed = true;
                }

                if (alreadyProcessed) {
                    log.info("Duplicate incident detected during sync, skipping: ID={}", id);
                    response.getDuplicateIgnoredIds().add(id != null ? id : key);
                    continue;
                }

                emergencyService.createIncident(incidentReq, user);
                response.getSyncedIncidentIds().add(incidentReq.getId());
                log.info("Successfully synced incident: {}", incidentReq.getId());

            } catch (Exception ex) {
                log.error("Failed to sync incident ID={}: {}", id, ex.getMessage());
                response.getFailures().add(new SyncBatchResponse.SyncFailureItem(id, ex.getMessage()));
            }
        }

        return response;
    }
}
