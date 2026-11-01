package net.vvit.csp.emergency.service;

import net.vvit.csp.emergency.dto.ContactDto;
import net.vvit.csp.emergency.exception.ResourceNotFoundException;
import net.vvit.csp.emergency.model.EmergencyContact;
import net.vvit.csp.emergency.model.User;
import net.vvit.csp.emergency.repository.EmergencyContactRepository;
import net.vvit.csp.emergency.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ContactService {

    private final EmergencyContactRepository contactRepo;
    private final UserRepository userRepo;

    public ContactService(EmergencyContactRepository contactRepo, UserRepository userRepo) {
        this.contactRepo = contactRepo;
        this.userRepo = userRepo;
    }

    public List<ContactDto> getUserContacts(Long userId) {
        return contactRepo.findByUserId(userId).stream()
                .map(ContactDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public ContactDto addContact(Long userId, ContactDto dto) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        EmergencyContact contact = new EmergencyContact(
                user,
                dto.getName(),
                dto.getRelationship(),
                dto.getPhoneNumber(),
                dto.getIsPrimary()
        );
        EmergencyContact saved = contactRepo.save(contact);
        return ContactDto.fromEntity(saved);
    }

    @Transactional
    public void deleteContact(Long userId, Long contactId) {
        EmergencyContact contact = contactRepo.findById(contactId)
                .orElseThrow(() -> new ResourceNotFoundException("Contact not found with ID: " + contactId));

        if (!contact.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Contact does not belong to the authenticated user.");
        }
        contactRepo.delete(contact);
    }
}
