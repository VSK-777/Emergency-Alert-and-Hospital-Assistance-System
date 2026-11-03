package net.vvit.csp.emergency.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import net.vvit.csp.emergency.model.NotificationAttempt;
import net.vvit.csp.emergency.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notifications", description = "Emergency alert delivery and acknowledgement audit trails")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/incident/{incidentId}")
    @Operation(summary = "Get delivery and acknowledgement audit logs for an incident")
    public ResponseEntity<List<NotificationAttempt>> getIncidentNotifications(@PathVariable String incidentId) {
        return ResponseEntity.ok(notificationService.getNotificationsForIncident(incidentId));
    }
}
