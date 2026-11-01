package net.vvit.csp.emergency.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);
    private static final String DEV_FALLBACK_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    private final Environment environment;

    @Value("${app.jwt.secret:}")
    private String secretKey;

    @Value("${app.jwt.expiration-ms:86400000}")
    private long jwtExpiration;

    public JwtService(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    public void validateConfiguration() {
        boolean isDev = Arrays.asList(environment.getActiveProfiles()).contains("dev")
                || (environment.getActiveProfiles().length == 0 && "dev".equalsIgnoreCase(environment.getProperty("spring.profiles.active")));

        if (secretKey == null || secretKey.trim().isEmpty()) {
            if (isDev) {
                log.warn("DEVELOPMENT WARNING: APP_JWT_SECRET is not set. Using local development fallback secret. NEVER use in production!");
                this.secretKey = DEV_FALLBACK_SECRET;
            } else {
                throw new IllegalStateException("CRITICAL CONFIGURATION ERROR: APP_JWT_SECRET environment variable is missing. A secure 256-bit Base64-encoded secret is required in production.");
            }
        }

        try {
            byte[] keyBytes = Decoders.BASE64.decode(secretKey.trim());
            if (keyBytes.length < 32) {
                throw new IllegalStateException("CRITICAL CONFIGURATION ERROR: APP_JWT_SECRET must decode to at least 256 bits (32 bytes). Current decoded key length is " + keyBytes.length + " bytes.");
            }
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("CRITICAL CONFIGURATION ERROR: APP_JWT_SECRET is not valid Base64: " + e.getMessage());
        }
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public String generateToken(UserDetails userDetails, Long userId, String role) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", userId);
        extraClaims.put("role", role);
        return buildToken(extraClaims, userDetails, jwtExpiration);
    }

    private String buildToken(Map<String, Object> extraClaims, UserDetails userDetails, long expiration) {
        return Jwts.builder()
                .claims(extraClaims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSignInKey())
                .compact();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSignInKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
