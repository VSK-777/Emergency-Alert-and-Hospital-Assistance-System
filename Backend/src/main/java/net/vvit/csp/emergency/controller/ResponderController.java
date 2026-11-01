package net.vvit.csp.emergency.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import net.vvit.csp.emergency.dto.ResponderDto;
import net.vvit.csp.emergency.model.User;
import net.vvit.csp.emergency.service.AuthService;
import net.vvit.csp.emergency.service.ResponderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/responders")
@Tag(name = "Responders", description = "Community and professional emergency responder management")
public class ResponderController {

    private final ResponderService responderService;
    private final AuthService authService;

    public ResponderController(ResponderService responderService, AuthService authService) {
        this.responderService = responderService;
        this.authService = authService;
    }

    @GetMapping
    @Operation(summary = "Find nearby available responders sorted by proximity")
    public ResponseEntity<List<ResponderDto>> getNearbyResponders(
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude
    ) {
        return ResponseEntity.ok(responderService.getNearbyAvailableResponders(latitude, longitude));
    }

    @PutMapping("/availability")
    @Operation(summary = "Update responder availability and live coordinates")
    public ResponseEntity<ResponderDto> updateAvailability(
            @RequestParam(required = false) Boolean isAvailable,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude
    ) {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(responderService.updateAvailability(user.getId(), isAvailable, latitude, longitude));
    }
}
