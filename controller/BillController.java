package com.optistock.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.optistock.dto.BillResponse;
import com.optistock.dto.CreateBillRequest;
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
}
