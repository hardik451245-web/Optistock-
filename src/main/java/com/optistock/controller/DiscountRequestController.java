package com.optistock.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.optistock.dto.CreateDiscountRequestRequest;
import com.optistock.dto.DiscountRequestResponse;
import com.optistock.security.AppUserDetails;
import com.optistock.service.DiscountRequestService;

@RestController
@RequestMapping("/api/discount-requests")
public class DiscountRequestController {

	private final DiscountRequestService discountRequestService;

	public DiscountRequestController(DiscountRequestService discountRequestService) {
		this.discountRequestService = discountRequestService;
	}

	@PostMapping
	public ResponseEntity<DiscountRequestResponse> createRequest(
			@RequestBody CreateDiscountRequestRequest request,
			Authentication authentication) {
		AppUserDetails user = (AppUserDetails) authentication.getPrincipal();
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(discountRequestService.createRequest(user.getId(), request));
	}

	@GetMapping("/pending")
	public ResponseEntity<List<DiscountRequestResponse>> getPendingRequests() {
		return ResponseEntity.ok(discountRequestService.getPendingRequests());
	}

	@PutMapping("/{id}/approve")
	public ResponseEntity<DiscountRequestResponse> approveRequest(
			@PathVariable Long id,
			Authentication authentication) {
		AppUserDetails user = (AppUserDetails) authentication.getPrincipal();
		return ResponseEntity.ok(discountRequestService.approveRequest(id, user.getId()));
	}

	@PutMapping("/{id}/reject")
	public ResponseEntity<DiscountRequestResponse> rejectRequest(
			@PathVariable Long id,
			Authentication authentication) {
		AppUserDetails user = (AppUserDetails) authentication.getPrincipal();
		return ResponseEntity.ok(discountRequestService.rejectRequest(id, user.getId()));
	}

	@GetMapping("/{id}")
	public ResponseEntity<DiscountRequestResponse> getRequestById(@PathVariable Long id) {
		return ResponseEntity.ok(discountRequestService.getRequestById(id));
	}
}
