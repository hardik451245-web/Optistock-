package com.optistock.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.optistock.dto.StockAdjustRequest;
import com.optistock.dto.StockMovementResponse;
import com.optistock.dto.StockWriteoffRequest;
import com.optistock.entity.StockMovementType;
import com.optistock.service.StockService;

@RestController
@RequestMapping("/api/stock")
public class StockController {

	private final StockService stockService;

	public StockController(StockService stockService) {
		this.stockService = stockService;
	}

	@PostMapping("/adjust")
	public ResponseEntity<StockMovementResponse> adjustStock(
			@RequestBody StockAdjustRequest request,
			Authentication authentication) {
		String user = authentication != null ? authentication.getName() : "Manager";
		return ResponseEntity.ok(stockService.adjustStock(request, user));
	}

	@PostMapping({"/writeoff", "/write-off"})
	public ResponseEntity<StockMovementResponse> writeOffStock(
			@RequestBody StockWriteoffRequest request,
			Authentication authentication) {
		String user = authentication != null ? authentication.getName() : "Manager";
		return ResponseEntity.ok(stockService.writeOffStock(request, user));
	}

	@GetMapping("/movements")
	public ResponseEntity<List<StockMovementResponse>> getMovements(
			@RequestParam(required = false) Long productId,
			@RequestParam(required = false) StockMovementType type,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
		return ResponseEntity.ok(stockService.getMovements(productId, type, from, to));
	}
}
