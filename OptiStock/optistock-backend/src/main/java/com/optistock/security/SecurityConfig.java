package com.optistock.security;

import java.io.IOException;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Configuration
public class SecurityConfig {

	private final TokenAuthenticationFilter tokenAuthenticationFilter;

	public SecurityConfig(TokenAuthenticationFilter tokenAuthenticationFilter) {
		this.tokenAuthenticationFilter = tokenAuthenticationFilter;
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
		return configuration.getAuthenticationManager();
	}

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http.csrf(csrf -> csrf.disable())
				.cors(cors -> cors.configurationSource(corsConfigurationSource()))
				.httpBasic(basic -> basic.disable())
				.formLogin(form -> form.disable())
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(auth -> auth
						.requestMatchers(HttpMethod.POST, "/api/users/login").permitAll()
						.requestMatchers(HttpMethod.POST, "/api/users/register").permitAll()
						.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
						.requestMatchers("/error").permitAll()
						.requestMatchers("/health").permitAll()
						.requestMatchers("/api/manager/**").hasRole("MANAGER")
						.requestMatchers("/api/purchase-orders/**").hasRole("MANAGER")
						.requestMatchers("/api/stock/**").hasRole("MANAGER")
						.requestMatchers(HttpMethod.GET, "/api/products/**").authenticated()
						.requestMatchers(HttpMethod.POST, "/api/products/**").hasRole("MANAGER")
						.requestMatchers(HttpMethod.PUT, "/api/products/**").hasRole("MANAGER")
						.requestMatchers(HttpMethod.DELETE, "/api/products/**").hasRole("MANAGER")
						.requestMatchers(HttpMethod.PUT, "/api/bills/*/cancel").hasRole("MANAGER")
						.requestMatchers(HttpMethod.GET, "/api/discount-requests/pending").hasRole("MANAGER")
						.requestMatchers(HttpMethod.PUT, "/api/discount-requests/**").hasRole("MANAGER")
						.requestMatchers(HttpMethod.POST, "/api/discount-requests/**").authenticated()
						.requestMatchers(HttpMethod.GET, "/api/discount-requests/**").authenticated()
						.requestMatchers(HttpMethod.POST, "/api/bills/**").authenticated()
						.requestMatchers(HttpMethod.GET, "/api/bills/**").authenticated()
						.anyRequest().authenticated())
				.exceptionHandling(ex -> ex
						.authenticationEntryPoint(this::handleUnauthorized)
						.accessDeniedHandler(this::handleAccessDenied))
				.addFilterBefore(tokenAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
		return http.build();
	}

	private void handleUnauthorized(HttpServletRequest request, HttpServletResponse response,
			org.springframework.security.core.AuthenticationException authException) throws IOException {
		response.setStatus(HttpStatus.UNAUTHORIZED.value());
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.getWriter().write("{\"error\":\"Please log in\"}");
	}

	private void handleAccessDenied(HttpServletRequest request, HttpServletResponse response,
			org.springframework.security.access.AccessDeniedException accessDeniedException) throws IOException {
		response.setStatus(HttpStatus.FORBIDDEN.value());
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.getWriter().write("{\"error\":\"Access denied\"}");
	}

	@Bean
	CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuration = new CorsConfiguration();
		String corsEnv = System.getenv("CORS_ALLOWED_ORIGINS");
		List<String> origins = new java.util.ArrayList<>(List.of(
				"http://localhost:*",
				"http://127.0.0.1:*",
				"https://*.vercel.app",
				"https://*.netlify.app",
				"https://*.onrender.com",
				"https://*.pages.dev"
		));
		if (corsEnv != null && !corsEnv.trim().isEmpty()) {
			origins.addAll(java.util.Arrays.stream(corsEnv.split(",")).map(String::trim).toList());
		}
		configuration.setAllowedOriginPatterns(origins);
		configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
		configuration.setAllowedHeaders(List.of("*"));
		configuration.setAllowCredentials(true);
		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}
}
