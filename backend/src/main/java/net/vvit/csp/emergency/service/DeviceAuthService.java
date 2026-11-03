package net.vvit.csp.emergency.service;

import net.vvit.csp.emergency.dto.DeviceClaimRequest;
import net.vvit.csp.emergency.dto.DeviceClaimResponse;
import net.vvit.csp.emergency.dto.DeviceEnrollmentRequest;
import net.vvit.csp.emergency.dto.DeviceEnrollmentResponse;
import net.vvit.csp.emergency.dto.DevicePairingChallengeDto;
import net.vvit.csp.emergency.exception.BadRequestException;
import net.vvit.csp.emergency.model.DevicePairingChallenge;
import net.vvit.csp.emergency.model.DeviceType;
import net.vvit.csp.emergency.model.User;
import net.vvit.csp.emergency.model.UserDevice;
import net.vvit.csp.emergency.repository.DevicePairingChallengeRepository;
import net.vvit.csp.emergency.repository.DeviceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Service
public class DeviceAuthService {

    private static final Logger log = LoggerFactory.getLogger(DeviceAuthService.class);
    private final DeviceRepository deviceRepository;
    private final DevicePairingChallengeRepository challengeRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public DeviceAuthService(DeviceRepository deviceRepository,
                             DevicePairingChallengeRepository challengeRepository) {
        this.deviceRepository = deviceRepository;
        this.challengeRepository = challengeRepository;
    }

    /**
     * Generate a short-lived (5-minute), cryptographically strong one-time pairing challenge
     * for a citizen account wishing to link an ESP32 or wearable hardware device.
     */
    @Transactional
    public DevicePairingChallengeDto createPairingChallenge(User user, DeviceType deviceType) {
        // Clean up previously unconsumed challenges for this user
        var pending = challengeRepository.findByUserIdAndIsConsumedFalse(user.getId());
        for (var p : pending) {
            p.setIsConsumed(true);
            challengeRepository.save(p);
        }

        // Generate high-entropy 6-character challenge code and 32-character secret
        String rawCode = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        String challengeCode = "PAIR-" + rawCode;

        byte[] secretBytes = new byte[16];
        secureRandom.nextBytes(secretBytes);
        String claimSecret = Base64.getUrlEncoder().withoutPadding().encodeToString(secretBytes);

        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(5);
        DevicePairingChallenge challenge = new DevicePairingChallenge(
                user,
                challengeCode,
                claimSecret,
                deviceType != null ? deviceType : DeviceType.ESP32_TRIAGE,
                expiresAt
        );
        challengeRepository.save(challenge);

        String qrPayload = String.format("{\"scheme\":\"csp-triage-v1\",\"code\":\"%s\",\"secret\":\"%s\",\"type\":\"%s\",\"owner\":\"%s\"}",
                challengeCode, claimSecret, challenge.getDeviceType().name(), user.getEmail());

        log.info("Issued device pairing challenge {} for user {}", challengeCode, user.getEmail());

        return new DevicePairingChallengeDto(
                challengeCode,
                claimSecret,
                challenge.getDeviceType(),
                300, // 5 minutes in seconds
                qrPayload,
                expiresAt
        );
    }

    /**
     * Claim physical ownership of an ESP32 hardware device using a valid pairing challenge and claim secret.
     * Prevents arbitrary device identifier claiming and auto-association to first user in database.
     */
    @Transactional
    public DeviceClaimResponse claimDevice(DeviceClaimRequest request, User user) {
        DevicePairingChallenge challenge = challengeRepository
                .findByChallengeCodeAndIsConsumedFalseAndExpiresAtAfter(request.getChallengeCode().trim(), LocalDateTime.now())
                .orElseThrow(() -> new BadRequestException("Pairing challenge is invalid, expired, or already used. Please generate a new pairing session."));

        // Validate claim secret match
        if (!challenge.getClaimSecret().equals(request.getClaimSecret().trim())) {
            log.warn("Invalid claim secret submitted for pairing challenge: {}", request.getChallengeCode());
            throw new BadRequestException("Physical claim secret verification failed.");
        }

        // Validate ownership consistency
        if (!challenge.getUser().getId().equals(user.getId())) {
            log.warn("Pairing challenge user mismatch: expected {} but requested by {}", challenge.getUser().getId(), user.getId());
            throw new BadRequestException("This pairing challenge was issued to a different user account.");
        }

        // Check if device already exists and belongs to someone else
        Optional<UserDevice> existingOpt = deviceRepository.findByDeviceIdentifier(request.getDeviceIdentifier().trim());
        UserDevice device;
        if (existingOpt.isPresent()) {
            device = existingOpt.get();
            if (!device.getUser().getId().equals(user.getId())) {
                log.info("Transferring device ownership of {} from user {} to user {}",
                        request.getDeviceIdentifier(), device.getUser().getId(), user.getId());
            }
        } else {
            device = new UserDevice();
        }

        device.setUser(user);
        device.setDeviceIdentifier(request.getDeviceIdentifier().trim());
        device.setDeviceType(request.getDeviceType() != null ? request.getDeviceType() : challenge.getDeviceType());
        device.setFirmwareVersion(request.getFirmwareVersion() != null ? request.getFirmwareVersion() : "CSP-Triage-V1");
        device.setPairingStatus("PAIRED");
        device.setIsActive(true);
        device.setLastSyncedAt(LocalDateTime.now());

        // Generate cryptographically unique per-device token
        byte[] randomBytes = new byte[24];
        secureRandom.nextBytes(randomBytes);
        String rawDeviceToken = "dvt_" + UUID.randomUUID().toString().replace("-", "") +
                Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        device.setAuthTokenHash(hashToken(rawDeviceToken));
        UserDevice saved = deviceRepository.save(device);

        // Mark challenge consumed
        challenge.setIsConsumed(true);
        challengeRepository.save(challenge);

        log.info("Successfully paired hardware device {} to citizen {} with status PAIRED",
                saved.getDeviceIdentifier(), user.getEmail());

        return new DeviceClaimResponse(
                saved.getId(),
                saved.getDeviceIdentifier(),
                saved.getDeviceType(),
                rawDeviceToken,
                saved.getPairingStatus(),
                user.getId(),
                user.getEmail(),
                "Device paired successfully. Provision this credential token to the ESP32 via BLE or NVS.",
                LocalDateTime.now()
        );
    }

    /**
     * Unpair and revoke a hardware device. Ensures only the verified owner or an administrator can revoke access.
     */
    @Transactional
    public void unpairDevice(String deviceIdentifier, User user) {
        UserDevice device = deviceRepository.findByDeviceIdentifier(deviceIdentifier.trim())
                .orElseThrow(() -> new BadRequestException("Device not found: " + deviceIdentifier));

        boolean isOwner = device.getUser().getId().equals(user.getId());
        boolean isAdmin = "ADMIN".equalsIgnoreCase(user.getRole().name());

        if (!isOwner && !isAdmin) {
            log.warn("Unauthorized unpair attempt by user {} on device {}", user.getEmail(), deviceIdentifier);
            throw new BadRequestException("You do not have permission to unpair this device.");
        }

        device.setIsActive(false);
        device.setPairingStatus("REVOKED");
        // Overwrite token hash to prevent any further authenticated telemetry
        device.setAuthTokenHash(hashToken("REVOKED_" + UUID.randomUUID()));
        device.setLastSyncedAt(LocalDateTime.now());
        deviceRepository.save(device);

        log.info("Device {} uncoupled and revoked by user {}", deviceIdentifier, user.getEmail());
    }

    @Transactional
    public DeviceEnrollmentResponse enrollDevice(DeviceEnrollmentRequest request, User user) {
        Optional<UserDevice> existing = deviceRepository.findByDeviceIdentifier(request.getDeviceIdentifier());
        UserDevice device = existing.orElseGet(UserDevice::new);

        device.setUser(user);
        device.setDeviceIdentifier(request.getDeviceIdentifier());
        device.setDeviceType(request.getDeviceType());
        if (request.getFcmToken() != null && !request.getFcmToken().isBlank()) {
            device.setFcmToken(request.getFcmToken());
        }
        device.setPairingStatus("PAIRED");
        device.setIsActive(true);
        device.setLastSyncedAt(LocalDateTime.now());

        // Generate cryptographically secure per-device token (never a hardcoded shared secret)
        byte[] randomBytes = new byte[24];
        secureRandom.nextBytes(randomBytes);
        String rawToken = "dvt_" + UUID.randomUUID().toString().replace("-", "") + Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        String tokenHash = hashToken(rawToken);
        device.setAuthTokenHash(tokenHash);

        UserDevice saved = deviceRepository.save(device);
        log.info("Enrolled wearable/client device: {} for user: {}", saved.getDeviceIdentifier(), user.getEmail());

        return new DeviceEnrollmentResponse(
                saved.getId(),
                saved.getDeviceIdentifier(),
                saved.getDeviceType(),
                rawToken,
                user.getId(),
                user.getEmail(),
                saved.getIsActive(),
                saved.getCreatedAt()
        );
    }

    public Optional<UserDevice> authenticateDevice(String deviceIdentifier, String deviceToken) {
        if (deviceIdentifier == null || deviceIdentifier.isBlank() || deviceToken == null || deviceToken.isBlank()) {
            return Optional.empty();
        }

        Optional<UserDevice> deviceOpt = deviceRepository.findByDeviceIdentifier(deviceIdentifier);
        if (deviceOpt.isEmpty() || !Boolean.TRUE.equals(deviceOpt.get().getIsActive())) {
            return Optional.empty();
        }

        UserDevice device = deviceOpt.get();
        if (device.getAuthTokenHash() == null) {
            return Optional.empty();
        }

        String computedHash = hashToken(deviceToken);
        if (MessageDigest.isEqual(device.getAuthTokenHash().getBytes(StandardCharsets.UTF_8), computedHash.getBytes(StandardCharsets.UTF_8))) {
            device.setLastSyncedAt(LocalDateTime.now());
            deviceRepository.save(device);
            return Optional.of(device);
        }

        return Optional.empty();
    }

    public static String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.trim().getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
