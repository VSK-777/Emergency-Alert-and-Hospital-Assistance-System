package net.vvit.csp.emergency.service;

import net.vvit.csp.emergency.dto.IncidentResponse;
import net.vvit.csp.emergency.model.EmergencyIncident;
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
 * whenever an incident is reported from Smartwatch, Mobile SOS, or manual triggers.
 */
@Service
public class LiveEmergencyBroadcastService {

    private static final Logger log = LoggerFactory.getLogger(LiveEmergencyBroadcastService.class);

    // Concurrent thread-safe list of active subscriber emitters
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    /**
     * Registers a new Web or Phone client for live emergency push alerts.
     */
    public SseEmitter registerClient() {
        // 30-minute timeout for client connection
        SseEmitter emitter = new SseEmitter(1800_000L);

        emitters.add(emitter);
        log.info("New client registered for live emergency alerts. Active subscribers: {}", emitters.size());

        emitter.onCompletion(() -> {
            emitters.remove(emitter);
            log.info("Client alert stream completed. Active subscribers: {}", emitters.size());
        });

        emitter.onTimeout(() -> {
            emitter.complete();
            emitters.remove(emitter);
            log.info("Client alert stream timed out. Active subscribers: {}", emitters.size());
        });

        emitter.onError(ex -> {
            emitters.remove(emitter);
            log.warn("Client alert stream error: {}. Active subscribers: {}", ex.getMessage(), emitters.size());
        });

        // Send initial connection heartbeat event
        try {
            emitter.send(SseEmitter.event()
                    .name("CONNECTED")
                    .data("Connected to VVIT CSP Emergency Live Alert Dispatch Stream"));
        } catch (IOException e) {
            emitters.remove(emitter);
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
     * Broadcasts newly created or updated emergency incident payload to all connected clients.
     */
    public void broadcastIncident(IncidentResponse payload) {
        if (emitters.isEmpty()) {
            log.info("No active SSE subscribers to broadcast incident {}", payload.getId());
            return;
        }

        log.info("Broadcasting emergency alert {} to {} connected clients", payload.getId(), emitters.size());

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("EMERGENCY_ALERT")
                        .data(payload));
            } catch (Exception ex) {
                emitters.remove(emitter);
                log.warn("Failed to dispatch alert to an emitter: {}", ex.getMessage());
            }
        }
    }
}
