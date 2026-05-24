package com.checkpoint.store.auth;

public record AuthResponse(
        String tokenType,
        String accessToken,
        long expiresInSeconds,
        AuthCustomerResponse customer
) {
}
