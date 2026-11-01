package net.vvit.csp.emergency.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import net.vvit.csp.emergency.dto.ContactDto;
import net.vvit.csp.emergency.model.User;
import net.vvit.csp.emergency.service.AuthService;
import net.vvit.csp.emergency.service.ContactService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/emergency-contacts")
@Tag(name = "Emergency Contacts", description = "Personal emergency contacts for instant SMS/FCM notifications")
public class ContactController {

    private final ContactService contactService;
    private final AuthService authService;

    public ContactController(ContactService contactService, AuthService authService) {
        this.contactService = contactService;
        this.authService = authService;
    }

    @GetMapping
    @Operation(summary = "Get emergency contacts for authenticated user")
    public ResponseEntity<List<ContactDto>> getContacts() {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(contactService.getUserContacts(user.getId()));
    }

    @PostMapping
    @Operation(summary = "Add an emergency contact")
    public ResponseEntity<ContactDto> addContact(@Valid @RequestBody ContactDto dto) {
        User user = authService.getCurrentAuthenticatedUser();
        ContactDto created = contactService.addContact(user.getId(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an emergency contact by ID")
    public ResponseEntity<Void> deleteContact(@PathVariable Long id) {
        User user = authService.getCurrentAuthenticatedUser();
        contactService.deleteContact(user.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
