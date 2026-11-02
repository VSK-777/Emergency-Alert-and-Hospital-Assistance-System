package net.vvit.csp.emergency.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import net.vvit.csp.emergency.dto.AuthRequest;
import net.vvit.csp.emergency.dto.AuthResponse;
import net.vvit.csp.emergency.dto.RegisterRequest;
import net.vvit.csp.emergency.dto.UserProfileDto;
import net.vvit.csp.emergency.model.User;
import net.vvit.csp.emergency.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "User registration, authentication, and session identity")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user account")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Log in with email and password to receive a JWT access token")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/send-otp")
    @Operation(summary = "Generate and dispatch a 6-digit OTP to a mobile phone number")
    public ResponseEntity<Map<String, Object>> sendOtp(@RequestBody Map<String, String> payload) {
        String phoneNumber = payload.get("phoneNumber");
        if (phoneNumber == null || phoneNumber.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Phone number is required."));
        }
        String otp = authService.generateOtp(phoneNumber);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Verification OTP dispatched successfully to " + phoneNumber,
                "phoneNumber", phoneNumber,
                "expiresInSeconds", 300,
                "devOtp", otp
        ));
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verify 6-digit OTP and authenticate user")
    public ResponseEntity<AuthResponse> verifyOtp(@RequestBody Map<String, String> payload) {
        String phoneNumber = payload.get("phoneNumber");
        String otp = payload.get("otp");
        String fullName = payload.get("fullName");
        String roleStr = payload.get("role");
        net.vvit.csp.emergency.model.UserRole role = net.vvit.csp.emergency.model.UserRole.CITIZEN;
        if (roleStr != null && !roleStr.isBlank()) {
            try {
                role = net.vvit.csp.emergency.model.UserRole.valueOf(roleStr.toUpperCase());
            } catch (Exception ignored) {}
        }
        AuthResponse response = authService.verifyOtpAndLogin(phoneNumber, otp, fullName, role);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/phone-login")
    @Operation(summary = "Sign in or register with verified phone number (Phone.email verification)")
    public ResponseEntity<AuthResponse> phoneLogin(@RequestBody Map<String, String> payload) {
        String phoneNumber = payload.get("phoneNumber");
        String verificationToken = payload.get("verificationToken");
        String fullName = payload.get("fullName");
        String roleStr = payload.get("role");
        net.vvit.csp.emergency.model.UserRole role = net.vvit.csp.emergency.model.UserRole.CITIZEN;
        if (roleStr != null && !roleStr.isBlank()) {
            try {
                role = net.vvit.csp.emergency.model.UserRole.valueOf(roleStr.toUpperCase());
            } catch (Exception ignored) {}
        }
        AuthResponse response = authService.phoneLogin(phoneNumber, verificationToken, fullName, role);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile")
    public ResponseEntity<UserProfileDto> getCurrentUser() {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(UserProfileDto.fromEntity(user));
    }
}
