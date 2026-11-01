package net.vvit.csp.emergency.service;

import net.vvit.csp.emergency.dto.ExpenseDto;
import net.vvit.csp.emergency.exception.ResourceNotFoundException;
import net.vvit.csp.emergency.model.EmergencyIncident;
import net.vvit.csp.emergency.model.ExpenseStatus;
import net.vvit.csp.emergency.model.MedicalExpense;
import net.vvit.csp.emergency.model.User;
import net.vvit.csp.emergency.repository.EmergencyIncidentRepository;
import net.vvit.csp.emergency.repository.MedicalExpenseRepository;
import net.vvit.csp.emergency.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExpenseService {

    private final MedicalExpenseRepository expenseRepository;
    private final EmergencyIncidentRepository incidentRepository;
    private final UserRepository userRepository;

    public ExpenseService(MedicalExpenseRepository expenseRepository,
                          EmergencyIncidentRepository incidentRepository,
                          UserRepository userRepository) {
        this.expenseRepository = expenseRepository;
        this.incidentRepository = incidentRepository;
        this.userRepository = userRepository;
    }

    public List<ExpenseDto> getExpensesByIncident(String incidentId) {
        return expenseRepository.findByIncidentId(incidentId).stream()
                .map(ExpenseDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ExpenseDto> getUserExpenses(Long userId) {
        return expenseRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(ExpenseDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public ExpenseDto addExpense(ExpenseDto dto, User user) {
        EmergencyIncident incident = incidentRepository.findById(dto.getIncidentId())
                .orElseThrow(() -> new ResourceNotFoundException("Emergency incident not found: " + dto.getIncidentId()));

        MedicalExpense expense = new MedicalExpense();
        expense.setIncident(incident);
        expense.setUser(user);
        expense.setCategory(dto.getCategory());
        expense.setDescription(dto.getDescription());
        expense.setAmount(dto.getAmount());
        expense.setStatus(dto.getStatus() != null ? dto.getStatus() : ExpenseStatus.PENDING);

        MedicalExpense saved = expenseRepository.save(expense);
        return ExpenseDto.fromEntity(saved);
    }

    @Transactional
    public ExpenseDto updateStatus(Long expenseId, ExpenseStatus status) {
        MedicalExpense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Medical expense not found: " + expenseId));
        expense.setStatus(status);
        MedicalExpense saved = expenseRepository.save(expense);
        return ExpenseDto.fromEntity(saved);
    }
}
