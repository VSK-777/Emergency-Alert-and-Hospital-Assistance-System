package net.vvit.csp.emergency.service;

import net.vvit.csp.emergency.dto.HospitalDto;
import net.vvit.csp.emergency.exception.ResourceNotFoundException;
import net.vvit.csp.emergency.model.Hospital;
import net.vvit.csp.emergency.repository.HospitalRepository;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class HospitalService {

    private final HospitalRepository hospitalRepository;

    public HospitalService(HospitalRepository hospitalRepository) {
        this.hospitalRepository = hospitalRepository;
    }

    public List<HospitalDto> getNearbyHospitals(Double lat, Double lng) {
        List<Hospital> hospitals = hospitalRepository.findByIsActiveTrue();
        if (lat == null || lng == null) {
            return hospitals.stream()
                    .map(h -> HospitalDto.fromEntity(h, null))
                    .collect(Collectors.toList());
        }

        return hospitals.stream()
                .map(h -> {
                    double dist = calculateDistance(lat, lng, h.getLatitude(), h.getLongitude());
                    return HospitalDto.fromEntity(h, dist);
                })
                .sorted(Comparator.comparing(HospitalDto::getDistanceKm, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    public Hospital getHospitalById(Long id) {
        return hospitalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found with ID: " + id));
    }

    public static double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in kilometers
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
