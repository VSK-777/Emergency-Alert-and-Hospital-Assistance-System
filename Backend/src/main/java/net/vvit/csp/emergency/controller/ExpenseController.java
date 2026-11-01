package net.vvit.csp.emergency.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import net.vvit.csp.emergency.dto.ExpenseDto;
import net.vvit.csp.emergency.model.ExpenseStatus;
import net.vvit.csp.emergency.model.User;
import net.vvit.csp.emergency.service.AuthService;
import net.vvit.csp.emergency.service.ExpenseService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/medical-expenses")
@Tag(name = "Medical Expenses", description = "Transparent digital medical, pharmacy, and ambulance cost tracking")
public class ExpenseController {

    private final ExpenseService expenseService;
    private final AuthService authService;

    public ExpenseController(ExpenseService expenseService, AuthService authService) {
        this.expenseService = expenseService;
        this.authService = authService;
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
