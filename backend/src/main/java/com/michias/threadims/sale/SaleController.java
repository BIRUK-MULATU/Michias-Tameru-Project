package com.michias.threadims.sale;

import com.michias.threadims.audit.AuditActions;
import com.michias.threadims.audit.AuditService;
import com.michias.threadims.common.exception.ApiException;
import com.michias.threadims.common.response.ApiResponse;
import com.michias.threadims.security.LocationAccessGuard;
import com.michias.threadims.security.UserPrincipal;
import com.michias.threadims.sale.dto.SaleCreateRequest;
import com.michias.threadims.sale.dto.SaleResponse;
import com.michias.threadims.user.Role;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sales")
public class SaleController {

    private final SaleService saleService;
    private final LocationAccessGuard locationAccessGuard;
    private final AuditService auditService;

    public SaleController(
            SaleService saleService, LocationAccessGuard locationAccessGuard, AuditService auditService) {
        this.saleService = saleService;
        this.locationAccessGuard = locationAccessGuard;
        this.auditService = auditService;
    }

    @GetMapping
    public ApiResponse<List<SaleResponse>> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) UUID locationId,
            @RequestParam(required = false) UUID salespersonUserId) {
        UUID resolvedLocationId = locationAccessGuard.resolve(principal, locationId);
        UUID resolvedSalespersonId = principal.getRole() == Role.ADMIN ? salespersonUserId : principal.getId();
        return ApiResponse.ok(saleService.findAll(resolvedLocationId, resolvedSalespersonId));
    }

    @GetMapping("/{id}")
    public ApiResponse<SaleResponse> get(
            @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        Sale sale = saleService.getWithDetails(id);
        if (principal.getRole() != Role.ADMIN && !sale.getSalespersonUserId().equals(principal.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Not authorized for this sale");
        }
        return ApiResponse.ok(saleService.getResponseById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SaleResponse> create(
            @Valid @RequestBody SaleCreateRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest httpRequest) {
        UUID resolvedLocationId = locationAccessGuard.resolve(principal, request.locationId());
        if (resolvedLocationId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "locationId is required");
        }
        SaleResponse created = saleService.create(resolvedLocationId, request, principal.getId());
        auditService.record(
                principal.getId(),
                principal.getUsername(),
                principal.getRole().name(),
                AuditActions.SALE_COMPLETED,
                AuditActions.MODULE_SALE,
                "Completed sale " + created.saleNumber() + " for " + created.totalAmount(),
                "Sale",
                created.id(),
                httpRequest.getRemoteAddr(),
                true);
        return ApiResponse.ok(created);
    }

    @PostMapping("/{id}/reverse")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<SaleResponse> reverse(
            @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal, HttpServletRequest httpRequest) {
        SaleResponse reversed = saleService.reverse(id, principal.getId());
        auditService.record(
                principal.getId(),
                principal.getUsername(),
                principal.getRole().name(),
                AuditActions.SALE_REVERSED,
                AuditActions.MODULE_SALE,
                "Reversed sale " + reversed.saleNumber(),
                "Sale",
                reversed.id(),
                httpRequest.getRemoteAddr(),
                true);
        return ApiResponse.ok(reversed);
    }
}
