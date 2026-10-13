package com.optistock.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.optistock.dto.AlertsResponse;
import com.optistock.dto.ForecastItem;
import com.optistock.dto.ProductMixResponse;
import com.optistock.dto.RankingItem;
import com.optistock.dto.SummaryResponse;
import com.optistock.service.ManagerService;

@RestController
@RequestMapping("/api/manager")
public class ManagerController {

	private final ManagerService managerService;

	public ManagerController(ManagerService managerService) {
		this.managerService = managerService;
	}

	@GetMapping("/forecast")
	public ResponseEntity<List<ForecastItem>> getForecast() {
		return ResponseEntity.ok(managerService.getForecast());
	}

	@GetMapping("/reorder")
	public ResponseEntity<List<ForecastItem>> getReorder() {
		return ResponseEntity.ok(managerService.getReorder());
	}

	@GetMapping("/alerts")
	public ResponseEntity<AlertsResponse> getAlerts() {
		return ResponseEntity.ok(managerService.getAlerts());
	}

	@GetMapping("/summary")
	public ResponseEntity<SummaryResponse> getSummary(
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
		return ResponseEntity.ok(managerService.getSummary(from, to));
	}

	@GetMapping("/ranking")
	public ResponseEntity<List<RankingItem>> getRanking(
			@RequestParam(defaultValue = "30") int days) {
		return ResponseEntity.ok(managerService.getRanking(days));
	}

	@GetMapping("/product-mix")
	public ResponseEntity<List<ProductMixResponse>> getProductMix(
			@RequestParam(defaultValue = "30") int days) {
		return ResponseEntity.ok(managerService.getProductMix(days));
	}

	@GetMapping("/demand-forecast")
	public ResponseEntity<com.optistock.dto.DemandForecastResponse> getDemandForecast(
			@RequestParam(defaultValue = "30") int days,
			@RequestParam(required = false) String category,
			@RequestParam(required = false) String productType) {
		return ResponseEntity.ok(managerService.getDemandForecast(days, category, productType));
	}

	@GetMapping("/demand-forecast/{productId}")
	public ResponseEntity<com.optistock.dto.DemandForecastResponse.ProductDemandForecast> getProductDemandForecast(
			@PathVariable Long productId,
			@RequestParam(defaultValue = "30") int days) {
		return ResponseEntity.ok(managerService.getProductDemandForecast(productId, days));
	}

	@GetMapping("/pareto")
	public ResponseEntity<com.optistock.dto.ParetoResponse> getPareto(
			@RequestParam(defaultValue = "30") int days) {
		return ResponseEntity.ok(managerService.getParetoAnalysis(days));
	}

	@GetMapping("/expiring-discounted")
	public ResponseEntity<com.optistock.dto.ExpiringDiscountedResponse> getExpiringDiscounted(
			@RequestParam(defaultValue = "3") int daysBeforeExpiry) {
		return ResponseEntity.ok(managerService.getExpiringDiscounted(daysBeforeExpiry));
	}

	@org.springframework.web.bind.annotation.PutMapping("/products/{id}/discount")
	public ResponseEntity<Void> updateDiscount(
			@org.springframework.web.bind.annotation.PathVariable Long id,
			@org.springframework.web.bind.annotation.RequestBody java.util.Map<String, java.math.BigDecimal> body) {
		java.math.BigDecimal discount = body.get("discountPercent");
		managerService.updateProductDiscount(id, discount);
		return ResponseEntity.ok().build();
	}

	@org.springframework.web.bind.annotation.PostMapping("/products/{id}/mark-cleared")
	public ResponseEntity<Void> markCleared(
			@org.springframework.web.bind.annotation.PathVariable Long id) {
		managerService.clearProductStock(id);
		return ResponseEntity.ok().build();
	}
}
