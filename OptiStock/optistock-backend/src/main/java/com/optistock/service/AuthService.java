package com.optistock.service;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.optistock.dto.LoginRequest;
import com.optistock.dto.LoginResponse;
import com.optistock.dto.RegisterRequest;
import com.optistock.entity.Role;
import com.optistock.entity.User;
import com.optistock.exception.DuplicateEmailException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.optistock.exception.RateLimitException;
import com.optistock.repository.UserRepository;
import com.optistock.security.AppUserDetails;
import com.optistock.security.AuthTokenService;

@Service
public class AuthService {

	private static final Logger log = LoggerFactory.getLogger(AuthService.class);

	private final AuthenticationManager authenticationManager;
	private final AuthTokenService authTokenService;
	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;

	private final ConcurrentHashMap<String, LoginAttempt> attempts = new ConcurrentHashMap<>();
	private static final int MAX_ATTEMPTS = 5;
	private static final long WINDOW_MS = 10 * 60 * 1000L;
	private static final long LOCK_MS = 10 * 60 * 1000L;

	private static class LoginAttempt {
		int count;
		long windowStart;
		long lockedUntil;
	}

	public AuthService(AuthenticationManager authenticationManager,
			AuthTokenService authTokenService,
			UserRepository userRepository,
			PasswordEncoder passwordEncoder) {
		this.authenticationManager = authenticationManager;
		this.authTokenService = authTokenService;
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
	}

	public Map<String, String> register(RegisterRequest request) {
		if (request.getName() == null || request.getName().trim().isEmpty()) {
			throw new IllegalArgumentException("Name is required");
		}
		if (request.getEmail() == null || !request.getEmail().trim().matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {
			throw new IllegalArgumentException("Invalid email format");
		}
		String cleanEmail = request.getEmail().trim().toLowerCase();
		if (userRepository.existsByEmailIgnoreCase(request.getEmail().trim()) || userRepository.existsByEmailIgnoreCase(cleanEmail)) {
			throw new DuplicateEmailException("Email already in use");
		}
		if (request.getPassword() == null || !request.getPassword().matches("^(?=.*[A-Za-z])(?=.*\\d).{8,}$")) {
			throw new IllegalArgumentException("Password must be at least 8 characters and contain at least one letter and one number");
		}
		if (request.getRole() == null) {
			throw new IllegalArgumentException("Role is required");
		}
		if (request.getRole() == Role.MANAGER) {
			String envCode = System.getenv("OPTISTOCK_MANAGER_CODE");
			if (envCode == null || envCode.trim().isEmpty()) {
				throw new IllegalArgumentException("Manager registration is disabled");
			}
			if (request.getManagerCode() == null || !envCode.equals(request.getManagerCode().trim())) {
				throw new IllegalArgumentException("Invalid manager code");
			}
		}

		User user = new User(request.getName().trim(), cleanEmail, passwordEncoder.encode(request.getPassword()), request.getRole());
		userRepository.save(user);

		return Map.of("message", "User registered successfully");
	}

	public LoginResponse login(LoginRequest request) {
		if (request.getEmail() == null || request.getPassword() == null) {
			throw new BadCredentialsException("Invalid email or password");
		}
		String key = request.getEmail().trim().toLowerCase();
		long now = System.currentTimeMillis();

		LoginAttempt attempt = attempts.get(key);
		if (attempt != null && attempt.lockedUntil > now) {
			long minutesLeft = Math.max(1, (attempt.lockedUntil - now + 59999) / 60000);
			throw new RateLimitException("Too many attempts, try again in " + minutesLeft + " minutes");
		}

		Optional<User> userOpt = userRepository.findByEmailIgnoreCase(key);
		if (userOpt.isEmpty()) {
			log.warn("Login failed for email {}: user not found", key);
		} else if (!passwordEncoder.matches(request.getPassword(), userOpt.get().getPassword())) {
			log.warn("Login failed for email {}: incorrect password", key);
		}

		try {
			Authentication authentication = authenticationManager.authenticate(
					new UsernamePasswordAuthenticationToken(key, request.getPassword()));
			attempts.remove(key);
			AppUserDetails user = (AppUserDetails) authentication.getPrincipal();
			String token = authTokenService.issueToken(user);
			return new LoginResponse(token, user.getId(), user.getName(), user.getUsername(), user.getRole());
		} catch (AuthenticationException ex) {
			attempts.compute(key, (k, existing) -> {
				if (existing == null || (now - existing.windowStart > WINDOW_MS && existing.lockedUntil <= now)) {
					LoginAttempt fresh = new LoginAttempt();
					fresh.count = 1;
					fresh.windowStart = now;
					return fresh;
				} else {
					existing.count++;
					if (existing.count >= MAX_ATTEMPTS) {
						existing.lockedUntil = now + LOCK_MS;
					}
					return existing;
				}
			});
			throw new BadCredentialsException("Invalid email or password");
		}
	}
}

