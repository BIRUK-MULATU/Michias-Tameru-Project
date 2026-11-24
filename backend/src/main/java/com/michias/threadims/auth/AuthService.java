package com.michias.threadims.auth;

import com.michias.threadims.audit.AuditActions;
import com.michias.threadims.audit.AuditService;
import com.michias.threadims.auth.dto.AuthResponse;
import com.michias.threadims.common.exception.ApiException;
import com.michias.threadims.security.JwtService;
import com.michias.threadims.security.UserPrincipal;
import com.michias.threadims.user.User;
import com.michias.threadims.user.UserRepository;
import com.michias.threadims.user.UserService;
import com.michias.threadims.user.dto.UserResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final UserService userService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuditService auditService;

    public AuthService(
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            UserRepository userRepository,
            UserService userService,
            RefreshTokenRepository refreshTokenRepository,
            AuditService auditService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.userService = userService;
        this.refreshTokenRepository = refreshTokenRepository;
        this.auditService = auditService;
    }

    public AuthResponse login(String username, String password, String ipAddress) {
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(username, password));
        } catch (BadCredentialsException | DisabledException ex) {
            auditService.record(
                    null,
                    username,
                    null,
                    AuditActions.LOGIN_FAILED,
                    AuditActions.MODULE_AUTH,
                    "Failed login attempt for username: " + username,
                    "User",
                    null,
                    ipAddress,
                    false);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }

        User user = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid username or password"));

        UserPrincipal principal = UserPrincipal.from(user);
        String accessToken = jwtService.generateAccessToken(principal);
        String refreshToken = issueRefreshToken(user);
        userService.recordLogin(user);

        auditService.record(
                user.getId(),
                user.getUsername(),
                user.getRole().name(),
                AuditActions.LOGIN,
                AuditActions.MODULE_AUTH,
                "Successful login",
                "User",
                user.getId(),
                ipAddress,
                true);

        return new AuthResponse(accessToken, refreshToken, userService.getResponseById(user.getId()));
    }

    public AuthResponse refresh(String rawRefreshToken) {
        RefreshToken existing = refreshTokenRepository
                .findByTokenHash(hash(rawRefreshToken))
                .filter(RefreshToken::isActive)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid or expired refresh token"));

        existing.setRevokedAt(Instant.now());
        refreshTokenRepository.save(existing);

        User user = existing.getUser();
        if (!user.isActive()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Account is deactivated");
        }

        String accessToken = jwtService.generateAccessToken(UserPrincipal.from(user));
        String newRefreshToken = issueRefreshToken(user);

        UserResponse userResponse = userService.getResponseById(user.getId());
        return new AuthResponse(accessToken, newRefreshToken, userResponse);
    }

    public void logout(UUID userId, String rawRefreshToken, String ipAddress) {
        if (rawRefreshToken != null) {
            refreshTokenRepository
                    .findByTokenHash(hash(rawRefreshToken))
                    .ifPresent(token -> {
                        token.setRevokedAt(Instant.now());
                        refreshTokenRepository.save(token);
                    });
        }
        User user = userRepository.findById(userId).orElse(null);
        auditService.record(
                userId,
                user != null ? user.getUsername() : null,
                user != null ? user.getRole().name() : null,
                AuditActions.LOGOUT,
                AuditActions.MODULE_AUTH,
                "User logged out",
                "User",
                userId,
                ipAddress,
                true);
    }

    private String issueRefreshToken(User user) {
        String raw = UUID.randomUUID().toString();
        RefreshToken token = new RefreshToken();
        token.setUser(user);
        token.setTokenHash(hash(raw));
        token.setExpiresAt(Instant.now().plusSeconds(jwtService.refreshTokenExpirationSeconds()));
        refreshTokenRepository.save(token);
        return raw;
    }

    private String hash(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 not available", ex);
        }
    }
}
