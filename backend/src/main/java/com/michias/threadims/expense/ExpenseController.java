package com.michias.threadims.expense;

import com.michias.threadims.audit.AuditActions;
import com.michias.threadims.audit.AuditService;
import com.michias.threadims.common.response.ApiResponse;
import com.michias.threadims.expense.dto.ExpenseRequest;
import com.michias.threadims.expense.dto.ExpenseResponse;
import com.michias.threadims.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/expenses")
@PreAuthorize("hasRole('ADMIN')")
public class ExpenseController {

    private final ExpenseService expenseService;
    private final AuditService auditService;

    public ExpenseController(ExpenseService expenseService, AuditService auditService) {
        this.expenseService = expenseService;
        this.auditService = auditService;
    }

    @GetMapping
    public ApiResponse<List<ExpenseResponse>> list(@RequestParam(required = false) UUID locationId) {
        return ApiResponse.ok(expenseService.findAll(locationId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ExpenseResponse> create(
            @Valid @RequestBody ExpenseRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest httpRequest) {
        ExpenseResponse created = expenseService.create(request, principal.getId());
        auditService.record(
                principal.getId(),
                principal.getUsername(),
                principal.getRole().name(),
                AuditActions.EXPENSE_CREATED,
                AuditActions.MODULE_EXPENSE,
                "Recorded expense: " + created.category() + " " + created.amount(),
                "Expense",
                created.id(),
                httpRequest.getRemoteAddr(),
                true);
        return ApiResponse.ok(created);
    }
}
