package net.vvit.csp.emergency.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import net.vvit.csp.emergency.dto.HospitalDto;
import net.vvit.csp.emergency.exception.ResourceNotFoundException;
import net.vvit.csp.emergency.model.Hospital;
import net.vvit.csp.emergency.repository.HospitalRepository;
import net.vvit.csp.emergency.service.HospitalService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/hospitals")
@Tag(name = "Hospitals", description = "Hospital directory, coordinates, emergency capacity, and bed status")
public class HospitalController {

    private final HospitalService hospitalService;
    private final HospitalRepository hospitalRepository;

    public HospitalController(HospitalService hospitalService, HospitalRepository hospitalRepository) {
        this.hospitalService = hospitalService;
        this.hospitalRepository = hospitalRepository;
    }

    @GetMapping
    @Operation(summary = "Find nearby active hospitals sorted by distance from coordinates")
    public ResponseEntity<List<HospitalDto>> getNearbyHospitals(
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude
    ) {
        return ResponseEntity.ok(hospitalService.getNearbyHospitals(latitude, longitude));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get hospital details by ID")
    public ResponseEntity<HospitalDto> getHospitalById(@PathVariable Long id) {
        Hospital hospital = hospitalService.getHospitalById(id);
        return ResponseEntity.ok(HospitalDto.fromEntity(hospital, null));
    }

    @PostMapping
    @Operation(summary = "Register new partner hospital in the network")
    public ResponseEntity<Hospital> createHospital(@RequestBody Hospital hospital) {
        hospital.setIsActive(true);
        Hospital saved = hospitalRepository.save(hospital);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update hospital capacity, ICU availability, or ambulances")
    public ResponseEntity<Hospital> updateHospital(@PathVariable Long id, @RequestBody Hospital updateData) {
        Hospital hospital = hospitalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found with ID: " + id));

        if (updateData.getName() != null) hospital.setName(updateData.getName());
        if (updateData.getAddress() != null) hospital.setAddress(updateData.getAddress());
        if (updateData.getPhoneNumber() != null) hospital.setPhoneNumber(updateData.getPhoneNumber());
        if (updateData.getEmergencyCapacity() != null) hospital.setEmergencyCapacity(updateData.getEmergencyCapacity());
        if (updateData.getAvailableIcus() != null) hospital.setAvailableIcus(updateData.getAvailableIcus());
        if (updateData.getAvailableAmbulances() != null) hospital.setAvailableAmbulances(updateData.getAvailableAmbulances());
        if (updateData.getIsActive() != null) hospital.setIsActive(updateData.getIsActive());

        Hospital saved = hospitalRepository.save(hospital);
        return ResponseEntity.ok(saved);
    }
}
