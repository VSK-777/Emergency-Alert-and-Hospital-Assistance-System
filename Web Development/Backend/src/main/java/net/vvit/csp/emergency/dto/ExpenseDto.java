package net.vvit.csp.emergency.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import net.vvit.csp.emergency.model.ExpenseCategory;
import net.vvit.csp.emergency.model.ExpenseStatus;
import net.vvit.csp.emergency.model.MedicalExpense;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ExpenseDto {
    private Long id;

    @NotBlank(message = "Incident ID is required")
    private String incidentId;

    private Long userId;

    @NotNull(message = "Category is required")
    private ExpenseCategory category;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Amount must be greater than zero")
    private BigDecimal amount;

    private ExpenseStatus status = ExpenseStatus.PENDING;
    private LocalDateTime createdAt;

    public ExpenseDto() {}

    public static ExpenseDto fromEntity(MedicalExpense expense) {
        ExpenseDto dto = new ExpenseDto();
        dto.setId(expense.getId());
        dto.setIncidentId(expense.getIncident().getId());
        dto.setUserId(expense.getUser().getId());
        dto.setCategory(expense.getCategory());
        dto.setDescription(expense.getDescription());
        dto.setAmount(expense.getAmount());
        dto.setStatus(expense.getStatus());
        dto.setCreatedAt(expense.getCreatedAt());
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getIncidentId() { return incidentId; }
    public void setIncidentId(String incidentId) { this.incidentId = incidentId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public ExpenseCategory getCategory() { return category; }
    public void setCategory(ExpenseCategory category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public ExpenseStatus getStatus() { return status; }
    public void setStatus(ExpenseStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
