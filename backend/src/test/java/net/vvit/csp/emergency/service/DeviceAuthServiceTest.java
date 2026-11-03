package net.vvit.csp.emergency.service;

import net.vvit.csp.emergency.dto.DeviceClaimRequest;
import net.vvit.csp.emergency.dto.DeviceClaimResponse;
import net.vvit.csp.emergency.dto.DevicePairingChallengeDto;
import net.vvit.csp.emergency.exception.BadRequestException;
import net.vvit.csp.emergency.model.DevicePairingChallenge;
import net.vvit.csp.emergency.model.DeviceType;
import net.vvit.csp.emergency.model.User;
import net.vvit.csp.emergency.model.UserDevice;
import net.vvit.csp.emergency.model.UserRole;
import net.vvit.csp.emergency.repository.DevicePairingChallengeRepository;
import net.vvit.csp.emergency.repository.DeviceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeviceAuthServiceTest {

    @Mock
    private DeviceRepository deviceRepository;

    @Mock
    private DevicePairingChallengeRepository challengeRepository;

    @InjectMocks
    private DeviceAuthService deviceAuthService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(101L);
        testUser.setEmail("citizen.test@vvit.net");
        testUser.setFullName("Test Citizen");
        testUser.setRole(UserRole.CITIZEN);
    }

    @Test
    void testHashTokenConsistency() {
        String token = "dvt_test_secret_12345";
        String hash1 = DeviceAuthService.hashToken(token);
        String hash2 = DeviceAuthService.hashToken(token);

        assertNotNull(hash1);
        assertEquals(hash1, hash2);
        assertEquals(64, hash1.length()); // SHA-256 hex string length
    }

    @Test
    void testCreatePairingChallengeGeneratesValidPayload() {
        when(challengeRepository.save(any(DevicePairingChallenge.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        DevicePairingChallengeDto challenge = deviceAuthService.createPairingChallenge(testUser, DeviceType.ESP32_TRIAGE);

        assertNotNull(challenge);
        assertTrue(challenge.getChallengeCode().startsWith("PAIR-"));
        assertNotNull(challenge.getClaimSecret());
        assertEquals(DeviceType.ESP32_TRIAGE, challenge.getDeviceType());
        assertEquals(300, challenge.getExpiresInSeconds());
        assertTrue(challenge.getQrPayload().contains("csp-triage-v1"));
        verify(challengeRepository, times(1)).save(any(DevicePairingChallenge.class));
    }

    @Test
    void testAuthenticateDeviceSuccess() {
        String rawToken = "dvt_sample_hardware_token_abc123";
        String tokenHash = DeviceAuthService.hashToken(rawToken);

        UserDevice device = new UserDevice();
        device.setId(1L);
        device.setDeviceIdentifier("CSP-Triage-V1");
        device.setAuthTokenHash(tokenHash);
        device.setIsActive(true);

        when(deviceRepository.findByDeviceIdentifier("CSP-Triage-V1")).thenReturn(Optional.of(device));
        when(deviceRepository.save(any(UserDevice.class))).thenReturn(device);

        Optional<UserDevice> authOpt = deviceAuthService.authenticateDevice("CSP-Triage-V1", rawToken);

        assertTrue(authOpt.isPresent());
        assertEquals("CSP-Triage-V1", authOpt.get().getDeviceIdentifier());
        assertNotNull(authOpt.get().getLastSyncedAt());
    }

    @Test
    void testAuthenticateDeviceFailsOnInvalidToken() {
        String rawToken = "dvt_sample_hardware_token_abc123";
        String tokenHash = DeviceAuthService.hashToken(rawToken);

        UserDevice device = new UserDevice();
        device.setId(1L);
        device.setDeviceIdentifier("CSP-Triage-V1");
        device.setAuthTokenHash(tokenHash);
        device.setIsActive(true);

        when(deviceRepository.findByDeviceIdentifier("CSP-Triage-V1")).thenReturn(Optional.of(device));

        Optional<UserDevice> authOpt = deviceAuthService.authenticateDevice("CSP-Triage-V1", "wrong_token");

        assertTrue(authOpt.isEmpty());
    }

    @Test
    void testAuthenticateDeviceFailsOnInactiveDevice() {
        UserDevice device = new UserDevice();
        device.setId(1L);
        device.setDeviceIdentifier("CSP-Triage-V1");
        device.setIsActive(false);

        when(deviceRepository.findByDeviceIdentifier("CSP-Triage-V1")).thenReturn(Optional.of(device));

        Optional<UserDevice> authOpt = deviceAuthService.authenticateDevice("CSP-Triage-V1", "any_token");

        assertTrue(authOpt.isEmpty());
    }

    @Test
    void testClaimDeviceSuccess() {
        DevicePairingChallenge challenge = new DevicePairingChallenge(
                testUser,
                "PAIR-A1B2C3",
                "secret_key_12345",
                DeviceType.ESP32_TRIAGE,
                LocalDateTime.now().plusMinutes(5)
        );

        when(challengeRepository.findByChallengeCodeAndIsConsumedFalseAndExpiresAtAfter(eq("PAIR-A1B2C3"), any(LocalDateTime.class)))
                .thenReturn(Optional.of(challenge));

        when(deviceRepository.findByDeviceIdentifier("CSP-ESP32-DEV1"))
                .thenReturn(Optional.empty());

        when(deviceRepository.save(any(UserDevice.class)))
                .thenAnswer(inv -> {
                    UserDevice dev = inv.getArgument(0);
                    dev.setId(10L);
                    return dev;
                });

        DeviceClaimRequest request = new DeviceClaimRequest();
        request.setChallengeCode("PAIR-A1B2C3");
        request.setClaimSecret("secret_key_12345");
        request.setDeviceIdentifier("CSP-ESP32-DEV1");
        request.setDeviceType(DeviceType.ESP32_TRIAGE);

        DeviceClaimResponse response = deviceAuthService.claimDevice(request, testUser);

        assertNotNull(response);
        assertEquals("CSP-ESP32-DEV1", response.getDeviceIdentifier());
        assertTrue(response.getRawDeviceToken().startsWith("dvt_"));
        assertEquals("PAIRED", response.getPairingStatus());
        assertTrue(challenge.getIsConsumed());
    }

    @Test
    void testUnpairDeviceRevokesAccess() {
        UserDevice device = new UserDevice();
        device.setId(5L);
        device.setUser(testUser);
        device.setDeviceIdentifier("CSP-ESP32-005");
        device.setIsActive(true);
        device.setPairingStatus("PAIRED");

        when(deviceRepository.findByDeviceIdentifier("CSP-ESP32-005")).thenReturn(Optional.of(device));

        deviceAuthService.unpairDevice("CSP-ESP32-005", testUser);

        assertFalse(device.getIsActive());
        assertEquals("REVOKED", device.getPairingStatus());
        verify(deviceRepository, times(1)).save(device);
    }
}
