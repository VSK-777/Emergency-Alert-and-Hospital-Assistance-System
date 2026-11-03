package net.vvit.csp.emergency.service;

import net.vvit.csp.emergency.model.User;
import net.vvit.csp.emergency.model.UserRole;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service managing short-lived, single-use stream tickets for Server-Sent Events (SSE).
 * Solves the browser EventSource limitation where custom Authorization headers cannot be passed.
 */
@Service
public class StreamTicketService {

    private static final Logger log = LoggerFactory.getLogger(StreamTicketService.class);
    private static final long TICKET_VALIDITY_SECONDS = 60L;

    public record StreamTicket(
            String ticket,
            Long userId,
            UserRole userRole,
            String userEmail,
            Instant createdAt,
            Instant expiresAt
    ) {
        public boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }

    private final Map<String, StreamTicket> ticketStore = new ConcurrentHashMap<>();

    /**
     * Issues a short-lived single-use ticket for the authenticated user.
     */
    public String issueTicket(User user) {
        purgeExpiredTickets();

        String ticket = "st_" + UUID.randomUUID().toString().replace("-", "");
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(TICKET_VALIDITY_SECONDS);

        StreamTicket streamTicket = new StreamTicket(
                ticket,
                user.getId(),
                user.getRole(),
                user.getEmail(),
                now,
                expiresAt
        );

        ticketStore.put(ticket, streamTicket);
        log.info("Issued SSE stream ticket for user: {} (Role: {}), expires in {}s", user.getEmail(), user.getRole(), TICKET_VALIDITY_SECONDS);
        return ticket;
    }

    /**
     * Validates and consumes the ticket (single-use semantics).
     */
    public Optional<StreamTicket> consumeTicket(String ticket) {
        if (ticket == null || ticket.isBlank()) {
            return Optional.empty();
        }

        StreamTicket streamTicket = ticketStore.remove(ticket.trim());
        if (streamTicket == null) {
            log.warn("Invalid or already consumed SSE stream ticket attempted: {}", ticket);
            return Optional.empty();
        }

        if (streamTicket.isExpired()) {
            log.warn("Expired SSE stream ticket attempted by user: {}", streamTicket.userEmail());
            return Optional.empty();
        }

        log.info("Successfully validated and consumed SSE stream ticket for user: {}", streamTicket.userEmail());
        return Optional.of(streamTicket);
    }

    private void purgeExpiredTickets() {
        ticketStore.entrySet().removeIf(entry -> entry.getValue().isExpired());
    }
}
