package com.michias.threadims.user;

import com.michias.threadims.audit.AuditActions;
import com.michias.threadims.audit.AuditService;
import com.michias.threadims.common.response.ApiResponse;
import com.michias.threadims.security.UserPrincipal;
import com.michias.threadims.user.dto.UserCreateRequest;
import com.michias.threadims.user.dto.UserResponse;
import com.michias.threadims.user.dto.UserStatusRequest;
import com.michias.threadims.user.dto.UserUpdateRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserService userService;
    private final AuditService auditService;

    public UserController(UserService userService, AuditService auditService) {
        this.userService = userService;
        this.auditService = auditService;
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<UserResponse> me(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.ok(userService.getResponseById(principal.getId()));
    }

    @GetMapping
    public ApiResponse<List<UserResponse>> list() {
        return ApiResponse.ok(userService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<UserResponse> get(@PathVariable UUID id) {
        return ApiResponse.ok(userService.getResponseById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<UserResponse> create(
            @Valid @RequestBody UserCreateRequest request,
            @AuthenticationPrincipal UserPrincipal actor,
            HttpServletRequest httpRequest) {
        UserResponse created = userService.create(request);
        auditService.record(
                actor.getId(),
                actor.getUsername(),
                actor.getRole().name(),
                AuditActions.USER_CREATED,
                AuditActions.MODULE_USER,
                "Created user " + created.username() + " with role " + created.role(),
                "User",
                created.id(),
                httpRequest.getRemoteAddr(),
                true);
        return ApiResponse.ok(created);
    }

    @PutMapping("/{id}")
    public ApiResponse<UserResponse> update(
            @PathVariable UUID id, @Valid @RequestBody UserUpdateRequest request) {
        return ApiResponse.ok(userService.update(id, request));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<UserResponse> setStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UserStatusRequest request,
            @AuthenticationPrincipal UserPrincipal actor,
            HttpServletRequest httpRequest) {
        UserResponse updated = userService.setActive(id, request.active());
        auditService.record(
                actor.getId(),
                actor.getUsername(),
                actor.getRole().name(),
                AuditActions.USER_STATUS_CHANGED,
                AuditActions.MODULE_USER,
                "Set active=" + request.active() + " for user " + updated.username(),
                "User",
                updated.id(),
                httpRequest.getRemoteAddr(),
                true);
        return ApiResponse.ok(updated);
    }
}
