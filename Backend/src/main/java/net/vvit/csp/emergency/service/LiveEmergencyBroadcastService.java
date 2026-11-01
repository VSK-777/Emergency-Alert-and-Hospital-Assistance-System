package net.vvit.csp.emergency.service;

import net.vvit.csp.emergency.dto.IncidentResponse;
import net.vvit.csp.emergency.model.EmergencyIncident;
import net.vvit.csp.emergency.model.UserRole;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Real-time Server-Sent Events (SSE) broadcaster for emergency incidents.
 * Pushes live emergency notifications to connected Web and Mobile clients
 * with patient data isolation and role-aware filtering.
 */
@Service
public class LiveEmergencyBroadcastService {

    private static final Logger log = LoggerFactory.getLogger(LiveEmergencyBroadcastService.class);

    public record ClientSubscriber(SseEmitter emitter, Long userId, UserRole userRole) {}

    // Concurrent thread-safe list of active subscriber emitters
    private final List<ClientSubscriber> subscribers = new CopyOnWriteArrayList<>();

    public SseEmitter registerClient() {
        return registerClient(null, null);
    }

    /**
     * Registers an authenticated Web or Mobile client for live emergency push alerts.
     */
    public SseEmitter registerClient(Long userId, UserRole userRole) {
        // 30-minute timeout for client connection
        SseEmitter emitter = new SseEmitter(1800_000L);
        ClientSubscriber subscriber = new ClientSubscriber(emitter, userId, userRole);

        subscribers.add(subscriber);
        log.info("Registered SSE subscriber (User ID: {}, Role: {}). Total active: {}", userId, userRole, subscribers.size());

        emitter.onCompletion(() -> {
            subscribers.remove(subscriber);
            log.info("SSE stream completed for user {}. Active: {}", userId, subscribers.size());
        });

        emitter.onTimeout(() -> {
            emitter.complete();
            subscribers.remove(subscriber);
            log.info("SSE stream timed out for user {}. Active: {}", userId, subscribers.size());
        });

        emitter.onError(ex -> {
            subscribers.remove(subscriber);
            log.warn("SSE stream error for user {}: {}. Active: {}", userId, ex.getMessage(), subscribers.size());
        });

        // Send initial connection heartbeat event
        try {
            emitter.send(SseEmitter.event()
                    .name("CONNECTED")
                    .data("Connected to VVIT CSP Emergency Live Alert Dispatch Stream"));
        } catch (IOException e) {
            subscribers.remove(subscriber);
        }

        return emitter;
    }

    /**
     * Broadcasts newly created or updated emergency incident to all connected web and phone apps.
     */
    public void broadcastEmergencyAlert(EmergencyIncident incident) {
        broadcastIncident(IncidentResponse.fromEntity(incident));
    }

    /**
     * Broadcasts newly created or updated emergency incident payload with role-based privacy isolation.
     */
    public void broadcastIncident(IncidentResponse payload) {
        if (subscribers.isEmpty()) {
            log.info("No active SSE subscribers to broadcast incident {}", payload.getId());
            return;
        }

        log.info("Broadcasting emergency alert {} to {} connected clients", payload.getId(), subscribers.size());

        for (ClientSubscriber sub : subscribers) {
            // Patient privacy filter: Citizens only receive their own incident alerts
            if (sub.userRole() == UserRole.CITIZEN) {
                if (payload.getUserId() == null || !payload.getUserId().equals(sub.userId())) {
                    continue; // Do not broadcast other patients' trauma incidents to citizen clients
                }
            }

            try {
                sub.emitter().send(SseEmitter.event()
                        .name("EMERGENCY_ALERT")
                        .data(payload));
            } catch (Exception ex) {
                subscribers.remove(sub);
                log.warn("Failed to dispatch alert to subscriber: {}", ex.getMessage());
            }
        }
    }
}
