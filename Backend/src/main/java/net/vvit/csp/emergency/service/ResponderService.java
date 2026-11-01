package net.vvit.csp.emergency.service;

import net.vvit.csp.emergency.dto.ResponderDto;
import net.vvit.csp.emergency.exception.ResourceNotFoundException;
import net.vvit.csp.emergency.model.Responder;
import net.vvit.csp.emergency.repository.ResponderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ResponderService {

    private final ResponderRepository responderRepository;

    public ResponderService(ResponderRepository responderRepository) {
        this.responderRepository = responderRepository;
    }

    public List<ResponderDto> getNearbyAvailableResponders(Double lat, Double lng) {
        List<Responder> responders = responderRepository.findByIsAvailableTrue();
        if (lat == null || lng == null) {
            return responders.stream()
                    .map(r -> ResponderDto.fromEntity(r, null))
                    .collect(Collectors.toList());
        }

        return responders.stream()
                .filter(r -> r.getLatitude() != null && r.getLongitude() != null)
                .map(r -> {
                    double dist = HospitalService.calculateDistance(lat, lng, r.getLatitude(), r.getLongitude());
                    return ResponderDto.fromEntity(r, dist);
                })
                .sorted(Comparator.comparing(ResponderDto::getDistanceKm, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    public Responder getResponderById(Long id) {
        return responderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Responder not found with ID: " + id));
    }

    @Transactional
    public ResponderDto updateAvailability(Long userId, Boolean isAvailable, Double lat, Double lng) {
        Responder responder = responderRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Responder profile not found for user: " + userId));

        if (isAvailable != null) {
            responder.setIsAvailable(isAvailable);
        }
        if (lat != null && lng != null) {
            responder.setLatitude(lat);
            responder.setLongitude(lng);
        }
        responder.setLastActiveAt(LocalDateTime.now());
        responderRepository.save(responder);
        return ResponderDto.fromEntity(responder, null);
    }
}
