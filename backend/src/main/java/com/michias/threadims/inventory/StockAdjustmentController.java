package com.michias.threadims.inventory;

import com.michias.threadims.audit.AuditActions;
import com.michias.threadims.audit.AuditService;
import com.michias.threadims.common.response.ApiResponse;
import com.michias.threadims.inventory.dto.StockAdjustmentRequestDto;
import com.michias.threadims.inventory.dto.StockAdjustmentResponse;
import com.michias.threadims.notification.NotificationService;
import com.michias.threadims.notification.NotificationTypes;
import com.michias.threadims.security.LocationAccessGuard;
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
@RequestMapping("/api/inventory/adjustments")
public class StockAdjustmentController {

    private final InventoryService inventoryService;
    private final LocationAccessGuard locationAccessGuard;
    private final AuditService auditService;
    private final NotificationService notificationService;

    public StockAdjustmentController(
            InventoryService inventoryService,
            LocationAccessGuard locationAccessGuard,
            AuditService auditService,
            NotificationService notificationService) {
        this.inventoryService = inventoryService;
        this.locationAccessGuard = locationAccessGuard;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    @GetMapping
    public ApiResponse<List<StockAdjustmentResponse>> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) UUID locationId) {
        UUID resolved = locationAccessGuard.resolve(principal, locationId);
        return ApiResponse.ok(inventoryService.findAdjustments(resolved));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<StockAdjustmentResponse> request(
            @Valid @RequestBody StockAdjustmentRequestDto request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest httpRequest) {
        UUID resolvedLocationId = locationAccessGuard.resolve(principal, request.locationId());
        StockAdjustmentResponse created = inventoryService.requestAdjustment(
                new StockAdjustmentRequestDto(
                        resolvedLocationId, request.productVariantId(), request.quantityDelta(), request.reason()),
                principal.getId());
        audit(
                principal,
                AuditActions.STOCK_ADJUSTMENT_REQUESTED,
                "Requested adjustment of " + created.quantityDelta() + " for " + created.sku(),
                created.id(),
                httpRequest);
        notificationService.notify(
                null,
                NotificationTypes.STOCK_ADJUSTMENT_REQUESTED,
                "Stock adjustment requested",
                principal.getUsername() + " requested a " + created.quantityDelta() + " adjustment for "
                        + created.sku() + " at " + created.locationName(),
                "StockAdjustment",
                created.id());
        return ApiResponse.ok(created);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<StockAdjustmentResponse> approve(
            @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal, HttpServletRequest httpRequest) {
        StockAdjustmentResponse approved = inventoryService.approveAdjustment(id, principal.getId());
        audit(
                principal,
                AuditActions.STOCK_ADJUSTMENT_APPROVED,
                "Approved adjustment of " + approved.quantityDelta() + " for " + approved.sku(),
                approved.id(),
                httpRequest);
        return ApiResponse.ok(approved);
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<StockAdjustmentResponse> reject(
            @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal, HttpServletRequest httpRequest) {
        StockAdjustmentResponse rejected = inventoryService.rejectAdjustment(id, principal.getId());
        audit(
                principal,
                AuditActions.STOCK_ADJUSTMENT_REJECTED,
                "Rejected adjustment for " + rejected.sku(),
                rejected.id(),
                httpRequest);
        return ApiResponse.ok(rejected);
    }

    private void audit(UserPrincipal actor, String action, String description, UUID entityId, HttpServletRequest httpRequest) {
        auditService.record(
                actor.getId(),
                actor.getUsername(),
                actor.getRole().name(),
                action,
                AuditActions.MODULE_INVENTORY,
                description,
                "StockAdjustment",
                entityId,
                httpRequest.getRemoteAddr(),
                true);
    }
}
