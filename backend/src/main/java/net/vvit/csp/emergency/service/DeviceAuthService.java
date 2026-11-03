package net.vvit.csp.emergency.service;

import net.vvit.csp.emergency.dto.DeviceEnrollmentRequest;
import net.vvit.csp.emergency.dto.DeviceEnrollmentResponse;
import net.vvit.csp.emergency.model.User;
import net.vvit.csp.emergency.model.UserDevice;
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
    private final SecureRandom secureRandom = new SecureRandom();

    public DeviceAuthService(DeviceRepository deviceRepository) {
        this.deviceRepository = deviceRepository;
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
