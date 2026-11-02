package net.vvit.csp.emergency.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import net.vvit.csp.emergency.dto.ExpenseDto;
import net.vvit.csp.emergency.exception.ResourceNotFoundException;
import net.vvit.csp.emergency.model.EmergencyIncident;
import net.vvit.csp.emergency.model.ExpenseStatus;
import net.vvit.csp.emergency.model.User;
import net.vvit.csp.emergency.model.UserRole;
import net.vvit.csp.emergency.repository.EmergencyIncidentRepository;
import net.vvit.csp.emergency.service.AuthService;
import net.vvit.csp.emergency.service.ExpenseService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/medical-expenses")
@Tag(name = "Medical Expenses", description = "Transparent digital medical, pharmacy, and ambulance cost tracking")
public class ExpenseController {

    private final ExpenseService expenseService;
    private final AuthService authService;
    private final EmergencyIncidentRepository incidentRepository;

    public ExpenseController(ExpenseService expenseService, AuthService authService, EmergencyIncidentRepository incidentRepository) {
        this.expenseService = expenseService;
        this.authService = authService;
        this.incidentRepository = incidentRepository;
    }

    @GetMapping
    @Operation(summary = "Get all medical expenses for current user")
    public ResponseEntity<List<ExpenseDto>> getAllExpenses() {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(expenseService.getUserExpenses(user.getId()));
    }

    @GetMapping("/incident/{incidentId}")
    @Operation(summary = "Get all medical expenses logged for an emergency incident")
    public ResponseEntity<List<ExpenseDto>> getExpensesForIncident(@PathVariable String incidentId) {
        User user = authService.getCurrentAuthenticatedUser();
        EmergencyIncident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency incident not found: " + incidentId));

        if (user.getRole() == UserRole.CITIZEN) {
            if (incident.getUser() == null || !incident.getUser().getId().equals(user.getId())) {
                throw new AccessDeniedException("Access denied: You are not authorized to view expenses for this incident.");
            }
        }
        return ResponseEntity.ok(expenseService.getExpensesByIncident(incidentId));
    }

    @GetMapping("/my")
    @Operation(summary = "Get all medical expenses for current user")
    public ResponseEntity<List<ExpenseDto>> getMyExpenses() {
        User user = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(expenseService.getUserExpenses(user.getId()));
    }

    @PostMapping
    @Operation(summary = "Add a new medical expense entry")
    public ResponseEntity<ExpenseDto> addExpense(@Valid @RequestBody ExpenseDto dto) {
        User user = authService.getCurrentAuthenticatedUser();
        ExpenseDto created = expenseService.addExpense(dto, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update expense status (PENDING, VERIFIED, PAID)")
    public ResponseEntity<ExpenseDto> updateStatus(
            @PathVariable Long id,
            @RequestParam ExpenseStatus status
    ) {
        return ResponseEntity.ok(expenseService.updateStatus(id, status));
    }
}
