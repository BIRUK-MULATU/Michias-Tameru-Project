package com.michias.threadims.auth;

import com.michias.threadims.auth.dto.AuthResponse;
import com.michias.threadims.auth.dto.LoginRequest;
import com.michias.threadims.auth.dto.RefreshRequest;
import com.michias.threadims.common.response.ApiResponse;
import com.michias.threadims.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(
            @Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        return ApiResponse.ok(
                authService.login(request.username(), request.password(), httpRequest.getRemoteAddr()));
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return ApiResponse.ok(authService.refresh(request.refreshToken()));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody(required = false) RefreshRequest request,
            HttpServletRequest httpRequest) {
        authService.logout(
                principal.getId(), request != null ? request.refreshToken() : null, httpRequest.getRemoteAddr());
        return ApiResponse.ok(null);
    }
}
