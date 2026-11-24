package com.michias.threadims.closing;

import com.michias.threadims.audit.AuditActions;
import com.michias.threadims.audit.AuditService;
import com.michias.threadims.closing.dto.ClosingPreviewResponse;
import com.michias.threadims.closing.dto.ClosingResponse;
import com.michias.threadims.closing.dto.ClosingSubmitRequest;
import com.michias.threadims.common.exception.ApiException;
import com.michias.threadims.common.response.ApiResponse;
import com.michias.threadims.notification.NotificationService;
import com.michias.threadims.notification.NotificationTypes;
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
@RequestMapping("/api/closings")
public class ClosingController {

    private final ClosingService closingService;
    private final LocationAccessGuard locationAccessGuard;
    private final AuditService auditService;
    private final NotificationService notificationService;

    public ClosingController(
            ClosingService closingService,
            LocationAccessGuard locationAccessGuard,
            AuditService auditService,
            NotificationService notificationService) {
        this.closingService = closingService;
        this.locationAccessGuard = locationAccessGuard;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    @GetMapping
    public ApiResponse<List<ClosingResponse>> list(
            @AuthenticationPrincipal UserPrincipal principal, @RequestParam(required = false) UUID locationId) {
        UUID resolved = locationAccessGuard.resolve(principal, locationId);
        return ApiResponse.ok(closingService.findAll(resolved));
    }

    @GetMapping("/{id}")
    public ApiResponse<ClosingResponse> get(
            @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        DailyClosing closing = closingService.getWithItems(id);
        if (principal.getRole() != Role.ADMIN
                && (principal.getLocationId() == null
                        || !principal.getLocationId().equals(closing.getLocation().getId()))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Not authorized for this closing");
        }
        return ApiResponse.ok(closingService.getResponseById(id));
    }

    @GetMapping("/preview")
    public ApiResponse<ClosingPreviewResponse> preview(
            @AuthenticationPrincipal UserPrincipal principal, @RequestParam(required = false) UUID locationId) {
        UUID resolved = requireLocation(locationAccessGuard.resolve(principal, locationId));
        return ApiResponse.ok(closingService.preview(resolved));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ClosingResponse> submit(
            @Valid @RequestBody ClosingSubmitRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest httpRequest) {
        UUID resolved = requireLocation(locationAccessGuard.resolve(principal, request.locationId()));
        ClosingResponse created = closingService.submit(request, resolved, principal.getId());
        auditService.record(
                principal.getId(),
                principal.getUsername(),
                principal.getRole().name(),
                AuditActions.CLOSING_SUBMITTED,
                AuditActions.MODULE_CLOSING,
                "Submitted daily closing for " + created.locationName(),
                "DailyClosing",
                created.id(),
                httpRequest.getRemoteAddr(),
                true);
        boolean hasDiscrepancy = created.items().stream().anyMatch(item -> item.discrepancyQty().signum() != 0);
        if (hasDiscrepancy) {
            notificationService.notify(
                    null,
                    NotificationTypes.CLOSING_DISCREPANCY,
                    "Closing discrepancy",
                    "Daily closing for " + created.locationName() + " has a stock discrepancy",
                    "DailyClosing",
                    created.id());
        }
        return ApiResponse.ok(created);
    }

    @PostMapping("/{id}/review")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ClosingResponse> review(
            @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal, HttpServletRequest httpRequest) {
        ClosingResponse reviewed = closingService.review(id, principal.getId());
        auditService.record(
                principal.getId(),
                principal.getUsername(),
                principal.getRole().name(),
                AuditActions.CLOSING_REVIEWED,
                AuditActions.MODULE_CLOSING,
                "Reviewed daily closing",
                "DailyClosing",
                reviewed.id(),
                httpRequest.getRemoteAddr(),
                true);
        return ApiResponse.ok(reviewed);
    }

    private UUID requireLocation(UUID locationId) {
        if (locationId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "locationId is required");
        }
        return locationId;
    }
}
