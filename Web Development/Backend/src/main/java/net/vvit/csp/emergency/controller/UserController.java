package net.vvit.csp.emergency.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import net.vvit.csp.emergency.dto.UserProfileDto;
import net.vvit.csp.emergency.exception.ResourceNotFoundException;
import net.vvit.csp.emergency.model.User;
import net.vvit.csp.emergency.model.UserRole;
import net.vvit.csp.emergency.repository.UserRepository;
import net.vvit.csp.emergency.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "Users", description = "User profile and medical record management")
public class UserController {

    private final AuthService authService;
    private final UserRepository userRepository;

    public UserController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @GetMapping
    @Operation(summary = "List all registered users / patients with optional role filter")
    public ResponseEntity<List<UserProfileDto>> getAllUsers(@RequestParam(required = false) UserRole role) {
        List<User> users = (role != null) ? userRepository.findByRole(role) : userRepository.findAll();
        return ResponseEntity.ok(users.stream().map(UserProfileDto::fromEntity).toList());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user details by ID")
    public ResponseEntity<UserProfileDto> getUserById(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));
        return ResponseEntity.ok(UserProfileDto.fromEntity(user));
    }

    @GetMapping("/profile")
    @Operation(summary = "Retrieve current user profile and medical info")
    public ResponseEntity<UserProfileDto> getProfile() {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(UserProfileDto.fromEntity(user));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update user profile and medical emergency details")
    public ResponseEntity<UserProfileDto> updateProfile(@RequestBody UserProfileDto updateDto) {
        User user = authService.getCurrentAuthenticatedUser();
        if (updateDto.getFullName() != null) user.setFullName(updateDto.getFullName());
        if (updateDto.getPhoneNumber() != null) user.setPhoneNumber(updateDto.getPhoneNumber());
        if (updateDto.getBloodGroup() != null) user.setBloodGroup(updateDto.getBloodGroup());
        if (updateDto.getAllergies() != null) user.setAllergies(updateDto.getAllergies());
        if (updateDto.getMedicalConditions() != null) user.setMedicalConditions(updateDto.getMedicalConditions());

        User saved = userRepository.save(user);
        return ResponseEntity.ok(UserProfileDto.fromEntity(saved));
    }
}
