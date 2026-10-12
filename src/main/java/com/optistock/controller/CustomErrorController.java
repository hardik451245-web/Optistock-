package com.optistock.controller;

import java.util.Map;

import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;

@RestController
public class CustomErrorController implements ErrorController {

	@RequestMapping("/error")
	public ResponseEntity<Map<String, String>> handleError(HttpServletRequest request) {
		Object status = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
		String originalUri = (String) request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI);
		if (originalUri == null) {
			originalUri = request.getRequestURI();
		}
		int statusCode = status != null ? Integer.parseInt(status.toString()) : 500;
		if (statusCode == 404) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND)
					.body(Map.of("error", "No endpoint: " + request.getMethod() + " " + originalUri));
		}
		Object message = request.getAttribute(RequestDispatcher.ERROR_MESSAGE);
		String errorMsg = message != null && !message.toString().isBlank() ? message.toString() : "Internal server error";
		return ResponseEntity.status(statusCode).body(Map.of("error", errorMsg));
	}
}
