package net.vvit.csp.emergency.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory sliding window rate limiter for emergency creation endpoints.
 * Prevents denial-of-service or fake alert spam while ensuring legitimate emergency dispatches are never blocked.
 */
@Component
public class EmergencyRateLimiter {

    private static final Logger log = LoggerFactory.getLogger(EmergencyRateLimiter.class);
    private static final int MAX_REQUESTS_PER_MINUTE = 10;
    private static final long WINDOW_SECONDS = 60L;

    private final Map<String, Deque<Instant>> ipRequestWindows = new ConcurrentHashMap<>();

    /**
     * Checks if the request from client IP is permitted.
     * @param clientIp IP address of the client
     * @return true if allowed, false if rate limit exceeded
     */
    public boolean allowRequest(String clientIp) {
        if (clientIp == null || clientIp.isBlank()) {
            clientIp = "UNKNOWN";
        }

        Instant now = Instant.now();
        Instant cutoff = now.minusSeconds(WINDOW_SECONDS);

        Deque<Instant> timestamps = ipRequestWindows.computeIfAbsent(clientIp, k -> new ArrayDeque<>());

        synchronized (timestamps) {
            // Evict timestamps outside the sliding window
            while (!timestamps.isEmpty() && timestamps.peekFirst().isBefore(cutoff)) {
                timestamps.pollFirst();
            }

            if (timestamps.size() >= MAX_REQUESTS_PER_MINUTE) {
                log.warn("Rate limit exceeded for IP: {}. Requests in last {}s: {}", clientIp, WINDOW_SECONDS, timestamps.size());
                return false;
            }

            timestamps.addLast(now);
            return true;
        }
    }

    /**
     * Resets rate limiter memory for testing purposes.
     */
    public void reset() {
        ipRequestWindows.clear();
    }
}
