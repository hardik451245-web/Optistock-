package com.optistock.security;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

@Service
public class AuthTokenService {

	private static final long EXPIRY_SECONDS = 8 * 60 * 60;

	private final Map<String, TokenEntry> tokens = new ConcurrentHashMap<>();

	public String issueToken(AppUserDetails user) {
		String token = UUID.randomUUID().toString();
		tokens.put(token, new TokenEntry(user, Instant.now().plusSeconds(EXPIRY_SECONDS)));
		return token;
	}

	public Optional<AppUserDetails> findUser(String token) {
		if (token == null || token.isBlank()) {
			return Optional.empty();
		}
		TokenEntry entry = tokens.get(token);
		if (entry == null) {
			return Optional.empty();
		}
		if (Instant.now().isAfter(entry.expiresAt)) {
			tokens.remove(token);
			return Optional.empty();
		}
		return Optional.of(entry.user);
	}

	private static class TokenEntry {
		final AppUserDetails user;
		final Instant expiresAt;

		TokenEntry(AppUserDetails user, Instant expiresAt) {
			this.user = user;
			this.expiresAt = expiresAt;
		}
	}
}
