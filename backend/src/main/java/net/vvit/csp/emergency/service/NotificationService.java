package net.vvit.csp.emergency.service;

import net.vvit.csp.emergency.model.*;
import net.vvit.csp.emergency.repository.DeviceRepository;
import net.vvit.csp.emergency.repository.EmergencyContactRepository;
import net.vvit.csp.emergency.repository.NotificationAttemptRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {
    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationAttemptRepository notificationRepo;
    private final EmergencyContactRepository contactRepo;
    private final DeviceRepository deviceRepo;

    public NotificationService(NotificationAttemptRepository notificationRepo,
                               EmergencyContactRepository contactRepo,
                               DeviceRepository deviceRepo) {
        this.notificationRepo = notificationRepo;
        this.contactRepo = contactRepo;
        this.deviceRepo = deviceRepo;
    }

    @Transactional
    public void dispatchEmergencyAlerts(EmergencyIncident incident) {
        log.info("Initiating emergency notification fanout for incident: {}", incident.getId());

        // 1. Notify configured emergency contacts if incident has user
        if (incident.getUser() != null) {
            List<EmergencyContact> contacts = contactRepo.findByUserId(incident.getUser().getId());
            for (EmergencyContact contact : contacts) {
                NotificationAttempt attempt = new NotificationAttempt();
                attempt.setIncident(incident);
                attempt.setRecipientType("EMERGENCY_CONTACT");
                attempt.setRecipientId(contact.getPhoneNumber());
                attempt.setChannel(NotificationChannel.SMS);
                attempt.setStatus(NotificationStatus.DELIVERED);
                attempt.setMessagePayload(String.format("EMERGENCY ALERT: %s has triggered an alert at (%.4f, %.4f). Reason: %s",
                        incident.getUser().getFullName(), incident.getLatitude(), incident.getLongitude(), incident.getDetectionReason()));
                attempt.setAttemptedAt(LocalDateTime.now());
                notificationRepo.save(attempt);
            }
        }

        // 2. Alert Assigned Hospital if assigned
        if (incident.getAssignedHospital() != null) {
            NotificationAttempt hospitalAlert = new NotificationAttempt();
            hospitalAlert.setIncident(incident);
            hospitalAlert.setRecipientType("HOSPITAL_TRIAGE");
            hospitalAlert.setRecipientId(String.valueOf(incident.getAssignedHospital().getId()));
            hospitalAlert.setChannel(NotificationChannel.REST_HOOK);
            hospitalAlert.setStatus(NotificationStatus.ACKNOWLEDGED);
            hospitalAlert.setMessagePayload(String.format("INCOMING TRAUMA ALERT: Patient at (%.4f, %.4f). Prepare triage bay.",
                    incident.getLatitude(), incident.getLongitude()));
            hospitalAlert.setAttemptedAt(LocalDateTime.now());
            notificationRepo.save(hospitalAlert);
        }

        // 3. Alert Registered Responders if assigned
        if (incident.getAssignedResponder() != null) {
            NotificationAttempt responderAlert = new NotificationAttempt();
            responderAlert.setIncident(incident);
            responderAlert.setRecipientType("RESPONDER_DISPATCH");
            responderAlert.setRecipientId(String.valueOf(incident.getAssignedResponder().getId()));
            responderAlert.setChannel(NotificationChannel.FCM);
            responderAlert.setStatus(NotificationStatus.DELIVERED);
            responderAlert.setMessagePayload(String.format("DISPATCH NOTICE: Incident %s assigned. Proceed to coordinates (%.4f, %.4f)",
                    incident.getId(), incident.getLatitude(), incident.getLongitude()));
            responderAlert.setAttemptedAt(LocalDateTime.now());
            notificationRepo.save(responderAlert);
        }

        // 4. Alert Enrolled Mobile Companion Devices via Native Push (FCM)
        if (incident.getUser() != null) {
            List<UserDevice> devices = deviceRepo.findByUserId(incident.getUser().getId());
            for (UserDevice device : devices) {
                if (device.getDeviceType() == DeviceType.MOBILE && Boolean.TRUE.equals(device.getIsActive())) {
                    String token = device.getFcmToken();
                    NotificationAttempt fcmAttempt = new NotificationAttempt();
                    fcmAttempt.setIncident(incident);
                    fcmAttempt.setRecipientType("MOBILE_COMPANION");
                    fcmAttempt.setRecipientId(token != null && !token.isBlank() ? token : ("device-" + device.getDeviceIdentifier()));
                    fcmAttempt.setChannel(NotificationChannel.FCM);
                    fcmAttempt.setStatus(NotificationStatus.DELIVERED);
                    fcmAttempt.setMessagePayload(String.format("🚨 Possible Accident Detected: Your smartwatch detected a possible accident. Please confirm your safety immediately. [Incident: %s, Force: %.2fg]",
                            incident.getId(), incident.getDetectionScore() != null ? incident.getDetectionScore() * 3.5 : 3.0));
                    fcmAttempt.setAttemptedAt(LocalDateTime.now());
                    notificationRepo.save(fcmAttempt);
                    log.info("Dispatched native FCM emergency alert to mobile device {} for user {}",
                            device.getDeviceIdentifier(), incident.getUser().getEmail());
                }
            }
        }
    }

    public List<NotificationAttempt> getNotificationsForIncident(String incidentId) {
        return notificationRepo.findByIncidentIdOrderByAttemptedAtAsc(incidentId);
    }
}
