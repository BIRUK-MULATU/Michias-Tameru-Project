package com.michias.threadims.transfer;

import com.michias.threadims.audit.AuditActions;
import com.michias.threadims.audit.AuditService;
import com.michias.threadims.common.exception.ApiException;
import com.michias.threadims.common.response.ApiResponse;
import com.michias.threadims.notification.NotificationService;
import com.michias.threadims.notification.NotificationTypes;
import com.michias.threadims.security.LocationAccessGuard;
import com.michias.threadims.security.UserPrincipal;
import com.michias.threadims.transfer.dto.TransferCloseRequest;
import com.michias.threadims.transfer.dto.TransferCreateRequest;
import com.michias.threadims.transfer.dto.TransferReceiveRequest;
import com.michias.threadims.transfer.dto.TransferResponse;
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
@RequestMapping("/api/transfers")
public class TransferController {

    private final TransferService transferService;
    private final LocationAccessGuard locationAccessGuard;
    private final AuditService auditService;
    private final NotificationService notificationService;

    public TransferController(
            TransferService transferService,
            LocationAccessGuard locationAccessGuard,
            AuditService auditService,
            NotificationService notificationService) {
        this.transferService = transferService;
        this.locationAccessGuard = locationAccessGuard;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    @GetMapping
    public ApiResponse<List<TransferResponse>> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) UUID locationId,
            @RequestParam(required = false) TransferStatus status) {
        UUID resolved = locationAccessGuard.resolve(principal, locationId);
        return ApiResponse.ok(transferService.findAll(resolved, status));
    }

    @GetMapping("/{id}")
    public ApiResponse<TransferResponse> get(
            @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        StockTransfer transfer = transferService.getWithItems(id);
        requireInvolvedLocation(principal, transfer);
        return ApiResponse.ok(transferService.getResponseById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<TransferResponse> create(
            @Valid @RequestBody TransferCreateRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest httpRequest) {
        TransferResponse created = transferService.create(request, principal.getId());
        audit(
                principal,
                AuditActions.TRANSFER_CREATED,
                "Created transfer " + created.fromLocationName() + " -> " + created.toLocationName(),
                created.id(),
                httpRequest);
        return ApiResponse.ok(created);
    }

    @PostMapping("/{id}/dispatch")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<TransferResponse> dispatch(
            @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal, HttpServletRequest httpRequest) {
        TransferResponse dispatched = transferService.dispatch(id, principal.getId());
        audit(principal, AuditActions.TRANSFER_DISPATCHED, "Dispatched transfer", dispatched.id(), httpRequest);
        return ApiResponse.ok(dispatched);
    }

    @PostMapping("/{id}/receive")
    public ApiResponse<TransferResponse> receive(
            @PathVariable UUID id,
            @Valid @RequestBody TransferReceiveRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest httpRequest) {
        StockTransfer transfer = transferService.getWithItems(id);
        locationAccessGuard.resolve(principal, transfer.getToLocation().getId());
        TransferResponse received = transferService.receive(id, request, principal.getId());
        audit(
                principal,
                AuditActions.TRANSFER_RECEIVED,
                "Recorded receipt for transfer (" + received.status() + ")",
                received.id(),
                httpRequest);
        return ApiResponse.ok(received);
    }

    @PostMapping("/{id}/close")
    public ApiResponse<TransferResponse> close(
            @PathVariable UUID id,
            @Valid @RequestBody(required = false) TransferCloseRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest httpRequest) {
        StockTransfer transfer = transferService.getWithItems(id);
        locationAccessGuard.resolve(principal, transfer.getToLocation().getId());
        TransferResponse closed =
                transferService.close(id, request != null ? request : new TransferCloseRequest(null), principal.getId());
        audit(principal, AuditActions.TRANSFER_CLOSED, "Closed transfer", closed.id(), httpRequest);
        boolean hasDiscrepancy = closed.items().stream().anyMatch(item -> item.outstandingQuantity().signum() > 0);
        if (hasDiscrepancy) {
            notificationService.notify(
                    null,
                    NotificationTypes.TRANSFER_DISCREPANCY,
                    "Transfer discrepancy",
                    "Transfer from " + closed.fromLocationName() + " to " + closed.toLocationName()
                            + " closed with a shortfall",
                    "StockTransfer",
                    closed.id());
        }
        return ApiResponse.ok(closed);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<TransferResponse> cancel(
            @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal, HttpServletRequest httpRequest) {
        TransferResponse cancelled = transferService.cancel(id);
        audit(principal, AuditActions.TRANSFER_CANCELLED, "Cancelled transfer", cancelled.id(), httpRequest);
        return ApiResponse.ok(cancelled);
    }

    private void requireInvolvedLocation(UserPrincipal principal, StockTransfer transfer) {
        if (principal.getRole() == Role.ADMIN) {
            return;
        }
        UUID locationId = principal.getLocationId();
        boolean involved = locationId != null
                && (locationId.equals(transfer.getFromLocation().getId())
                        || locationId.equals(transfer.getToLocation().getId()));
        if (!involved) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Not authorized for this transfer");
        }
    }

    private void audit(UserPrincipal actor, String action, String description, UUID entityId, HttpServletRequest httpRequest) {
        auditService.record(
                actor.getId(),
                actor.getUsername(),
                actor.getRole().name(),
                action,
                AuditActions.MODULE_TRANSFER,
                description,
                "StockTransfer",
                entityId,
                httpRequest.getRemoteAddr(),
                true);
    }
}
