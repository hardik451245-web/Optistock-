package com.optistock.service;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mockito;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.optistock.dto.LoginRequest;
import com.optistock.dto.RegisterRequest;
import com.optistock.entity.Role;
import com.optistock.entity.User;
import com.optistock.exception.DuplicateEmailException;
import com.optistock.exception.RateLimitException;
import com.optistock.repository.UserRepository;
import com.optistock.security.AuthTokenService;

public class AuthServiceTest {

	private AuthenticationManager authenticationManager;
	private AuthTokenService authTokenService;
	private UserRepository userRepository;
	private PasswordEncoder passwordEncoder;
	private AuthService authService;

	@BeforeEach
	void setUp() {
		authenticationManager = Mockito.mock(AuthenticationManager.class);
		authTokenService = new AuthTokenService();
		userRepository = Mockito.mock(UserRepository.class);
		passwordEncoder = Mockito.mock(PasswordEncoder.class);
		authService = new AuthService(authenticationManager, authTokenService, userRepository, passwordEncoder);
	}

	@Test
	@DisplayName("Register successful cashier with encoded password")
	void testRegisterCashierSuccess() {
		RegisterRequest req = new RegisterRequest("Cashier Test", "cashier@store.com", "pass1234", Role.CASHIER, null);
		when(userRepository.existsByEmailIgnoreCase("cashier@store.com")).thenReturn(false);
		when(passwordEncoder.encode("pass1234")).thenReturn("hashedPass1234");

		Map<String, String> response = authService.register(req);
		assertEquals("User registered successfully", response.get("message"));
		verify(userRepository).save(any(User.class));
	}

	@Test
	@DisplayName("Register duplicate email case-insensitive throws DuplicateEmailException")
	void testRegisterDuplicateEmail() {
		RegisterRequest req = new RegisterRequest("Cashier Test", "CASHIER@store.com", "pass1234", Role.CASHIER, null);
		when(userRepository.existsByEmailIgnoreCase("CASHIER@store.com")).thenReturn(true);

		assertThrows(DuplicateEmailException.class, () -> authService.register(req));
		verify(userRepository, never()).save(any(User.class));
	}

	@Test
	@DisplayName("Register weak password throws IllegalArgumentException")
	void testRegisterWeakPassword() {
		RegisterRequest reqShort = new RegisterRequest("Test", "t@store.com", "pass1", Role.CASHIER, null);
		assertThrows(IllegalArgumentException.class, () -> authService.register(reqShort));

		RegisterRequest reqNoNum = new RegisterRequest("Test", "t@store.com", "passwordonly", Role.CASHIER, null);
		assertThrows(IllegalArgumentException.class, () -> authService.register(reqNoNum));
	}

	@Test
	@DisplayName("Register manager without matching code throws IllegalArgumentException")
	void testRegisterManagerWithoutCode() {
		RegisterRequest req = new RegisterRequest("Manager Test", "mgr@store.com", "pass1234", Role.MANAGER, "wrongcode");
		assertThrows(IllegalArgumentException.class, () -> authService.register(req));
	}

	@Test
	@DisplayName("Login rate limiting locks after 5 failed attempts")
	void testLoginRateLimiting() {
		LoginRequest req = new LoginRequest("user@test.com", "wrongpass");
		when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad credentials"));

		for (int i = 0; i < 5; i++) {
			assertThrows(BadCredentialsException.class, () -> authService.login(req));
		}

		// 6th attempt is locked immediately without calling authenticationManager
		Mockito.clearInvocations(authenticationManager);
		assertThrows(RateLimitException.class, () -> authService.login(req));
		verify(authenticationManager, never()).authenticate(any());
	}
}
