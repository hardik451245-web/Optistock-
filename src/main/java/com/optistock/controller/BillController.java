package com.optistock.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.optistock.dto.BillResponse;
import com.optistock.dto.CreateBillRequest;
import com.optistock.entity.Role;
import com.optistock.security.AppUserDetails;
import com.optistock.service.BillService;

@RestController
@RequestMapping("/api/bills")
public class BillController {

	private final BillService billService;

	public BillController(BillService billService) {
		this.billService = billService;
	}

	@PostMapping
	public ResponseEntity<BillResponse> createBill(@RequestBody CreateBillRequest request, Authentication authentication) {
		AppUserDetails user = (AppUserDetails) authentication.getPrincipal();
		return ResponseEntity.status(HttpStatus.CREATED).body(billService.createBill(user.getId(), request));
	}

	@PutMapping("/{id}/cancel")
	public ResponseEntity<BillResponse> cancelBill(@PathVariable Long id) {
		return ResponseEntity.ok(billService.cancelBill(id));
	}

	@GetMapping
	public ResponseEntity<List<BillResponse>> getBills(
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
			Authentication authentication) {
		AppUserDetails user = (AppUserDetails) authentication.getPrincipal();
		boolean isManager = user.getRole() == Role.MANAGER;
		return ResponseEntity.ok(billService.getBills(date, user.getId(), isManager));
	}
}
