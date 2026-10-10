package com.optistock.service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.optistock.dto.LoginRequest;
import com.optistock.dto.LoginResponse;
import com.optistock.security.AppUserDetails;
import com.optistock.security.AuthTokenService;

@Service
public class AuthService {

	private final AuthenticationManager authenticationManager;
	private final AuthTokenService authTokenService;

	public AuthService(AuthenticationManager authenticationManager, AuthTokenService authTokenService) {
		this.authenticationManager = authenticationManager;
		this.authTokenService = authTokenService;
	}

	public LoginResponse login(LoginRequest request) {
		Authentication authentication = authenticationManager.authenticate(
				new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
		AppUserDetails user = (AppUserDetails) authentication.getPrincipal();
		String token = authTokenService.issueToken(user);
		return new LoginResponse(token, user.getId(), user.getName(), user.getUsername(), user.getRole());
	}
}
