package net.vvit.csp.emergency.service;

import net.vvit.csp.emergency.dto.AuthRequest;
import net.vvit.csp.emergency.dto.AuthResponse;
import net.vvit.csp.emergency.dto.RegisterRequest;
import net.vvit.csp.emergency.exception.BadRequestException;
import net.vvit.csp.emergency.exception.DuplicateResourceException;
import net.vvit.csp.emergency.model.User;
import net.vvit.csp.emergency.model.UserRole;
import net.vvit.csp.emergency.repository.UserRepository;
import net.vvit.csp.emergency.security.JwtService;
import net.vvit.csp.emergency.security.UserPrincipal;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final OtpService otpService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuthenticationManager authenticationManager,
                       OtpService otpService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.otpService = otpService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("An account with email " + request.getEmail() + " already exists.");
        }

        if (request.getRole() == UserRole.ADMIN) {
            throw new BadRequestException("System administrator accounts cannot be self-registered through public signup.");
        }
        UserRole role = (request.getRole() != null) ? request.getRole() : UserRole.CITIZEN;
        User user = new User(
                request.getEmail().toLowerCase().trim(),
                passwordEncoder.encode(request.getPassword()),
                request.getFullName().trim(),
                request.getPhoneNumber().trim(),
                role
        );
        user.setBloodGroup((request.getBloodGroup() != null && !request.getBloodGroup().isBlank()) ? request.getBloodGroup().trim() : null);
        user.setAllergies((request.getAllergies() != null && !request.getAllergies().isBlank()) ? request.getAllergies().trim() : null);
        user.setMedicalConditions((request.getMedicalConditions() != null && !request.getMedicalConditions().isBlank()) ? request.getMedicalConditions().trim() : null);

        User savedUser = userRepository.save(user);
        UserPrincipal principal = new UserPrincipal(savedUser);
        String token = jwtService.generateToken(principal, savedUser.getId(), savedUser.getRole().name());

        return new AuthResponse(token, savedUser.getId(), savedUser.getEmail(), savedUser.getFullName(), savedUser.getPhoneNumber(), savedUser.getRole());
    }

    public AuthResponse login(AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().toLowerCase().trim(), request.getPassword())
        );

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = principal.getUser();
        String token = jwtService.generateToken(principal, user.getId(), user.getRole().name());

        return new AuthResponse(token, user.getId(), user.getEmail(), user.getFullName(), user.getPhoneNumber(), user.getRole());
    }

    public String generateOtp(String phoneNumber) {
        return otpService.generateAndSendOtp(phoneNumber);
    }

    @Transactional
    public AuthResponse verifyOtpAndLogin(String phoneNumber, String otp, String fullName, UserRole role) {
        if (phoneNumber == null || phoneNumber.isBlank()) {
            throw new BadRequestException("Phone number is required.");
        }
        if (otp == null || otp.isBlank()) {
            throw new BadRequestException("OTP code is required.");
        }

        boolean isValid = otpService.verifyOtp(phoneNumber, otp);
        if (!isValid) {
            throw new BadRequestException("Invalid OTP code. Please enter the correct 6-digit code.");
        }

        return phoneLogin(phoneNumber, "VERIFIED_OTP_" + otp, fullName, role);
    }

    @Transactional
    public AuthResponse phoneLogin(String phoneNumber, String verificationToken, String fullName, UserRole role) {
        if (phoneNumber == null || phoneNumber.isBlank()) {
            throw new BadRequestException("Phone number is required for phone verification.");
        }
        String cleanPhone = phoneNumber.trim();
        String altPhone = cleanPhone.startsWith("+91")
                ? cleanPhone.substring(3).trim()
                : "+91" + cleanPhone;

        User user = userRepository.findByPhoneNumber(cleanPhone)
                .or(() -> userRepository.findByPhoneNumber(altPhone))
                .orElseGet(() -> {
                    String name = (fullName != null && !fullName.isBlank()) ? fullName.trim() : "Citizen User";
                    String dummyEmail = "phone." + cleanPhone.replaceAll("[^0-9]", "") + "@vvit.net";
                    User newUser = new User(
                            dummyEmail,
                            passwordEncoder.encode("PhoneAuth@" + cleanPhone.hashCode()),
                            name,
                            cleanPhone,
                            role != null ? role : UserRole.CITIZEN
                    );
                    return userRepository.save(newUser);
                });

        UserPrincipal principal = new UserPrincipal(user);
        String token = jwtService.generateToken(principal, user.getId(), user.getRole().name());
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getFullName(), user.getPhoneNumber(), user.getRole());
    }

    public User getCurrentAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new BadRequestException("No authenticated user found in current security context.");
        }
        return principal.getUser();
    }

    public User getUserByEmail(String email) {
        if (email == null) {
            throw new BadRequestException("Email cannot be null");
        }
        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new BadRequestException("User not found with email: " + email));
    }
}
