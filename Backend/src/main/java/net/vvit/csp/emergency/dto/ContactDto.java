package net.vvit.csp.emergency.dto;

import jakarta.validation.constraints.NotBlank;
import net.vvit.csp.emergency.model.EmergencyContact;

public class ContactDto {
    private Long id;

    @NotBlank(message = "Contact name is required")
    private String name;

    @NotBlank(message = "Relationship is required")
    private String relationship;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    private Boolean isPrimary = false;

    public ContactDto() {}

    public static ContactDto fromEntity(EmergencyContact contact) {
        ContactDto dto = new ContactDto();
        dto.setId(contact.getId());
        dto.setName(contact.getName());
        dto.setRelationship(contact.getRelationship());
        dto.setPhoneNumber(contact.getPhoneNumber());
        dto.setIsPrimary(contact.getIsPrimary());
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getRelationship() { return relationship; }
    public void setRelationship(String relationship) { this.relationship = relationship; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public Boolean getIsPrimary() { return isPrimary; }
    public void setIsPrimary(Boolean primary) { isPrimary = primary; }
}
