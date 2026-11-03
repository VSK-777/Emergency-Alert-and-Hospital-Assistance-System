package net.vvit.csp.emergency.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "device_pairing_challenges")
public class DevicePairingChallenge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "challenge_code", nullable = false, unique = true, length = 64)
    private String challengeCode;

    @Column(name = "claim_secret", nullable = false, length = 64)
    private String claimSecret;

    @Enumerated(EnumType.STRING)
    @Column(name = "device_type", nullable = false, length = 30)
    private DeviceType deviceType;

    @Column(name = "is_consumed", nullable = false)
    private Boolean isConsumed = false;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public DevicePairingChallenge() {}

    public DevicePairingChallenge(User user, String challengeCode, String claimSecret, DeviceType deviceType, LocalDateTime expiresAt) {
        this.user = user;
        this.challengeCode = challengeCode;
        this.claimSecret = claimSecret;
        this.deviceType = deviceType;
        this.expiresAt = expiresAt;
        this.isConsumed = false;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getChallengeCode() { return challengeCode; }
    public void setChallengeCode(String challengeCode) { this.challengeCode = challengeCode; }

    public String getClaimSecret() { return claimSecret; }
    public void setClaimSecret(String claimSecret) { this.claimSecret = claimSecret; }

    public DeviceType getDeviceType() { return deviceType; }
    public void setDeviceType(DeviceType deviceType) { this.deviceType = deviceType; }

    public Boolean getIsConsumed() { return isConsumed; }
    public void setIsConsumed(Boolean consumed) { isConsumed = consumed; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(this.expiresAt);
    }
}
