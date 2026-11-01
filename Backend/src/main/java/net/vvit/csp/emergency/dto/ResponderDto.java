package net.vvit.csp.emergency.dto;

import net.vvit.csp.emergency.model.Responder;

public class ResponderDto {
    private Long id;
    private Long userId;
    private String name;
    private String phoneNumber;
    private String specialization;
    private String skills;
    private Boolean isAvailable;
    private Double latitude;
    private Double longitude;
    private Double distanceKm;

    public ResponderDto() {}

    public static ResponderDto fromEntity(Responder responder, Double distanceKm) {
        ResponderDto dto = new ResponderDto();
        dto.setId(responder.getId());
        if (responder.getUser() != null) {
            dto.setUserId(responder.getUser().getId());
            dto.setName(responder.getUser().getFullName());
            dto.setPhoneNumber(responder.getUser().getPhoneNumber());
        }
        dto.setSpecialization(responder.getSpecialization());
        dto.setSkills(responder.getSkills());
        dto.setIsAvailable(responder.getIsAvailable());
        dto.setLatitude(responder.getLatitude());
        dto.setLongitude(responder.getLongitude());
        dto.setDistanceKm(distanceKm != null ? Math.round(distanceKm * 10.0) / 10.0 : null);
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }

    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean available) { isAvailable = available; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public Double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(Double distanceKm) { this.distanceKm = distanceKm; }
}
