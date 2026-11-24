package com.michias.threadims.returns;

import com.michias.threadims.audit.AuditActions;
import com.michias.threadims.audit.AuditService;
import com.michias.threadims.common.ApprovalStatus;
import com.michias.threadims.common.exception.ApiException;
import com.michias.threadims.common.response.ApiResponse;
import com.michias.threadims.notification.NotificationService;
import com.michias.threadims.notification.NotificationTypes;
import com.michias.threadims.returns.dto.ReturnCreateRequest;
import com.michias.threadims.returns.dto.ReturnResponse;
import com.michias.threadims.sale.Sale;
import com.michias.threadims.sale.SaleService;
import com.michias.threadims.security.LocationAccessGuard;
import com.michias.threadims.security.UserPrincipal;
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
@RequestMapping("/api/returns")
public class ReturnController {

    private final ReturnService returnService;
    private final SaleService saleService;
    private final LocationAccessGuard locationAccessGuard;
    private final AuditService auditService;
    private final NotificationService notificationService;

    public ReturnController(
            ReturnService returnService,
            SaleService saleService,
            LocationAccessGuard locationAccessGuard,
            AuditService auditService,
            NotificationService notificationService) {
        this.returnService = returnService;
        this.saleService = saleService;
        this.locationAccessGuard = locationAccessGuard;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    @GetMapping
    public ApiResponse<List<ReturnResponse>> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) UUID locationId,
            @RequestParam(required = false) ApprovalStatus status) {
        UUID resolved = locationAccessGuard.resolve(principal, locationId);
        return ApiResponse.ok(returnService.findAll(resolved, status));
    }

    @GetMapping("/{id}")
    public ApiResponse<ReturnResponse> get(
            @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        Return returnRequest = returnService.getWithItems(id);
        requireInvolvedLocation(principal, returnRequest.getOriginalSale());
        return ApiResponse.ok(returnService.getResponseById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ReturnResponse> create(
            @Valid @RequestBody ReturnCreateRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest httpRequest) {
        Sale sale = saleService.getWithDetails(request.saleId());
        locationAccessGuard.resolve(principal, sale.getLocation().getId());

        ReturnResponse created = returnService.create(request, principal.getId());
        audit(
                principal,
                AuditActions.RETURN_REQUESTED,
                "Requested return against " + created.originalSaleNumber(),
                created.id(),
                httpRequest);
        notificationService.notify(
                null,
                NotificationTypes.RETURN_REQUESTED,
                "Return requested",
                principal.getUsername() + " requested a return against " + created.originalSaleNumber()
                        + " at " + created.locationName(),
                "Return",
                created.id());
        return ApiResponse.ok(created);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ReturnResponse> approve(
            @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal, HttpServletRequest httpRequest) {
        ReturnResponse approved = returnService.approve(id, principal.getId());
        audit(principal, AuditActions.RETURN_APPROVED, "Approved return", approved.id(), httpRequest);
        return ApiResponse.ok(approved);
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ReturnResponse> reject(
            @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal, HttpServletRequest httpRequest) {
        ReturnResponse rejected = returnService.reject(id, principal.getId());
        audit(principal, AuditActions.RETURN_REJECTED, "Rejected return", rejected.id(), httpRequest);
        return ApiResponse.ok(rejected);
    }

    private void requireInvolvedLocation(UserPrincipal principal, Sale sale) {
        if (principal.getRole() == Role.ADMIN) {
            return;
        }
        if (principal.getLocationId() == null || !principal.getLocationId().equals(sale.getLocation().getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Not authorized for this return");
        }
    }

    private void audit(UserPrincipal actor, String action, String description, UUID entityId, HttpServletRequest httpRequest) {
        auditService.record(
                actor.getId(),
                actor.getUsername(),
                actor.getRole().name(),
                action,
                AuditActions.MODULE_RETURN,
                description,
                "Return",
                entityId,
                httpRequest.getRemoteAddr(),
                true);
    }
}
