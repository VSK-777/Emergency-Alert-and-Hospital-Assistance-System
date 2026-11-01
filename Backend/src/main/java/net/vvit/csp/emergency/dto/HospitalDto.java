package net.vvit.csp.emergency.dto;

import net.vvit.csp.emergency.model.Hospital;

public class HospitalDto {
    private Long id;
    private String name;
    private String address;
    private Double latitude;
    private Double longitude;
    private String phoneNumber;
    private Integer emergencyCapacity;
    private Integer availableIcus;
    private Integer availableAmbulances;
    private Double distanceKm;

    public HospitalDto() {}

    public static HospitalDto fromEntity(Hospital hospital, Double distanceKm) {
        HospitalDto dto = new HospitalDto();
        dto.setId(hospital.getId());
        dto.setName(hospital.getName());
        dto.setAddress(hospital.getAddress());
        dto.setLatitude(hospital.getLatitude());
        dto.setLongitude(hospital.getLongitude());
        dto.setPhoneNumber(hospital.getPhoneNumber());
        dto.setEmergencyCapacity(hospital.getEmergencyCapacity());
        dto.setAvailableIcus(hospital.getAvailableIcus());
        dto.setAvailableAmbulances(hospital.getAvailableAmbulances());
        dto.setDistanceKm(distanceKm != null ? Math.round(distanceKm * 10.0) / 10.0 : null);
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public Integer getEmergencyCapacity() { return emergencyCapacity; }
    public void setEmergencyCapacity(Integer emergencyCapacity) { this.emergencyCapacity = emergencyCapacity; }

    public Integer getAvailableIcus() { return availableIcus; }
    public void setAvailableIcus(Integer availableIcus) { this.availableIcus = availableIcus; }

    public Integer getAvailableAmbulances() { return availableAmbulances; }
    public void setAvailableAmbulances(Integer availableAmbulances) { this.availableAmbulances = availableAmbulances; }

    public Double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(Double distanceKm) { this.distanceKm = distanceKm; }
}
