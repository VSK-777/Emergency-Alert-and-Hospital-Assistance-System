package net.vvit.csp.emergency.service;

import net.vvit.csp.emergency.exception.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private static final long OTP_VALIDITY_SECONDS = 300; // 5 minutes
    private static final int MAX_ATTEMPTS = 5;

    public record OtpEntry(String code, Instant expiresAt, int attempts) {}

    private final Map<String, OtpEntry> otpStorage = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    public String generateAndSendOtp(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isBlank()) {
            throw new BadRequestException("Phone number cannot be blank.");
        }
        String cleanPhone = phoneNumber.replaceAll("\\s+", "").trim();

        // Generate 6-digit numeric OTP (100000 - 999999)
        int number = random.nextInt(900000) + 100000;
        String otpCode = String.valueOf(number);
        Instant expiresAt = Instant.now().plusSeconds(OTP_VALIDITY_SECONDS);

        otpStorage.put(cleanPhone, new OtpEntry(otpCode, expiresAt, 0));

        log.info("=================================================================");
        log.info("[OTP SERVICE] Verification OTP generated for {}: {}", cleanPhone, otpCode);
        log.info("[OTP SERVICE] Valid for {} seconds (Expires at: {})", OTP_VALIDITY_SECONDS, expiresAt);
        log.info("=================================================================");

        return otpCode;
    }

    public boolean verifyOtp(String phoneNumber, String enteredOtp) {
        if (phoneNumber == null || enteredOtp == null) {
            return false;
        }
        String cleanPhone = phoneNumber.replaceAll("\\s+", "").trim();
        OtpEntry entry = otpStorage.get(cleanPhone);

        if (entry == null) {
            log.warn("[OTP SERVICE] No active OTP found for {}", cleanPhone);
            return false;
        }

        if (Instant.now().isAfter(entry.expiresAt())) {
            otpStorage.remove(cleanPhone);
            log.warn("[OTP SERVICE] OTP expired for {}", cleanPhone);
            throw new BadRequestException("OTP has expired. Please request a new code.");
        }

        if (entry.attempts() >= MAX_ATTEMPTS) {
            otpStorage.remove(cleanPhone);
            log.warn("[OTP SERVICE] Max attempts exceeded for {}", cleanPhone);
            throw new BadRequestException("Maximum OTP verification attempts exceeded. Please request a new code.");
        }

        boolean matches = entry.code().equals(enteredOtp.trim());
        if (!matches) {
            otpStorage.put(cleanPhone, new OtpEntry(entry.code(), entry.expiresAt(), entry.attempts() + 1));
            return false;
        }

        // Successfully verified — remove from storage so it cannot be reused
        otpStorage.remove(cleanPhone);
        log.info("[OTP SERVICE] OTP verified successfully for {}", cleanPhone);
        return true;
    }

    public long getValiditySeconds() {
        return OTP_VALIDITY_SECONDS;
    }
}
