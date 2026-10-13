package com.optistock.exception;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.persistence.OptimisticLockException;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(ResourceNotFoundException.class)
	public ResponseEntity<Map<String, String>> handleNotFound(ResourceNotFoundException ex) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
	}

	@ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
	public ResponseEntity<Map<String, String>> handleNoResourceFound(
			org.springframework.web.servlet.resource.NoResourceFoundException ex,
			jakarta.servlet.http.HttpServletRequest request) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND)
				.body(Map.of("error", "No endpoint: " + request.getMethod() + " " + request.getRequestURI()));
	}

	@ExceptionHandler(org.springframework.web.servlet.NoHandlerFoundException.class)
	public ResponseEntity<Map<String, String>> handleNoHandlerFound(
			org.springframework.web.servlet.NoHandlerFoundException ex,
			jakarta.servlet.http.HttpServletRequest request) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND)
				.body(Map.of("error", "No endpoint: " + request.getMethod() + " " + request.getRequestURI()));
	}

	@ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
	public ResponseEntity<Map<String, String>> handleMethodNotSupported(
			org.springframework.web.HttpRequestMethodNotSupportedException ex,
			jakarta.servlet.http.HttpServletRequest request) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND)
				.body(Map.of("error", "No endpoint: " + request.getMethod() + " " + request.getRequestURI()));
	}

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
	}

	@ExceptionHandler(BadCredentialsException.class)
	public ResponseEntity<Map<String, String>> handleBadCredentials(BadCredentialsException ex) {
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid email or password"));
	}

	@ExceptionHandler(RateLimitException.class)
	public ResponseEntity<Map<String, String>> handleRateLimit(RateLimitException ex) {
		return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of("error", ex.getMessage()));
	}

	@ExceptionHandler(DuplicateEmailException.class)
	public ResponseEntity<Map<String, String>> handleDuplicateEmail(DuplicateEmailException ex) {
		return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", ex.getMessage()));
	}

	@ExceptionHandler(StockConflictException.class)
	public ResponseEntity<Map<String, String>> handleStockConflict(StockConflictException ex) {
		return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", ex.getMessage()));
	}

	@ExceptionHandler(OptimisticLockException.class)
	public ResponseEntity<Map<String, String>> handleOptimisticLock(OptimisticLockException ex) {
		return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Stock changed, please retry"));
	}

	@ExceptionHandler(org.hibernate.StaleObjectStateException.class)
	public ResponseEntity<Map<String, String>> handleStaleObject(org.hibernate.StaleObjectStateException ex) {
		return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Stock changed, please retry"));
	}

	@ExceptionHandler(org.springframework.orm.ObjectOptimisticLockingFailureException.class)
	public ResponseEntity<Map<String, String>> handleSpringOptimisticLock(
			org.springframework.orm.ObjectOptimisticLockingFailureException ex) {
		return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Stock changed, please retry"));
	}

	@ExceptionHandler(ProfitWarningException.class)
	public ResponseEntity<Map<String, String>> handleProfitWarning(ProfitWarningException ex) {
		return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", ex.getMessage(), "code", ex.getCode()));
	}
}

