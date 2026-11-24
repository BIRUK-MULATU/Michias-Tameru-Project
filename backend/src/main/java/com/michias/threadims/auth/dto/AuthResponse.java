package com.michias.threadims.auth.dto;

import com.michias.threadims.user.dto.UserResponse;

public record AuthResponse(String accessToken, String refreshToken, UserResponse user) {
}
