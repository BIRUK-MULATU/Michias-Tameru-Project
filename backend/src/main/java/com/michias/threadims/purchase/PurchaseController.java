package com.michias.threadims.purchase;

import com.michias.threadims.audit.AuditActions;
import com.michias.threadims.audit.AuditService;
import com.michias.threadims.common.response.ApiResponse;
import com.michias.threadims.purchase.dto.PurchaseCreateRequest;
import com.michias.threadims.purchase.dto.PurchaseResponse;
import com.michias.threadims.security.UserPrincipal;
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
@RequestMapping("/api/purchases")
@PreAuthorize("hasRole('ADMIN')")
public class PurchaseController {

    private final PurchaseService purchaseService;
    private final AuditService auditService;

    public PurchaseController(PurchaseService purchaseService, AuditService auditService) {
        this.purchaseService = purchaseService;
        this.auditService = auditService;
    }

    @GetMapping
    public ApiResponse<List<PurchaseResponse>> list(
            @RequestParam(required = false) UUID locationId,
            @RequestParam(required = false) PurchaseStatus status) {
        return ApiResponse.ok(purchaseService.findAll(locationId, status));
    }

    @GetMapping("/{id}")
    public ApiResponse<PurchaseResponse> get(@PathVariable UUID id) {
        return ApiResponse.ok(purchaseService.getResponseById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PurchaseResponse> create(
            @Valid @RequestBody PurchaseCreateRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest httpRequest) {
        PurchaseResponse created = purchaseService.create(request, principal.getId());
        audit(principal, AuditActions.PURCHASE_CREATED, "Created purchase from " + created.supplierName(), created.id(), httpRequest);
        return ApiResponse.ok(created);
    }

    @PostMapping("/{id}/receive")
    public ApiResponse<PurchaseResponse> receive(
            @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal, HttpServletRequest httpRequest) {
        PurchaseResponse received = purchaseService.receive(id, principal.getId());
        audit(principal, AuditActions.PURCHASE_RECEIVED, "Received purchase", received.id(), httpRequest);
        return ApiResponse.ok(received);
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<PurchaseResponse> cancel(
            @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal, HttpServletRequest httpRequest) {
        PurchaseResponse cancelled = purchaseService.cancel(id);
        audit(principal, AuditActions.PURCHASE_CANCELLED, "Cancelled purchase", cancelled.id(), httpRequest);
        return ApiResponse.ok(cancelled);
    }

    private void audit(UserPrincipal actor, String action, String description, UUID entityId, HttpServletRequest httpRequest) {
        auditService.record(
                actor.getId(),
                actor.getUsername(),
                actor.getRole().name(),
                action,
                AuditActions.MODULE_PURCHASE,
                description,
                "Purchase",
                entityId,
                httpRequest.getRemoteAddr(),
                true);
    }
}
