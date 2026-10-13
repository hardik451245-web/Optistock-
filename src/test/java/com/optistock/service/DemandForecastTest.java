package com.optistock.service;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mockito;
import static org.mockito.Mockito.when;

import com.optistock.config.MarkdownProperties;
import com.optistock.dto.DemandForecastResponse;
import com.optistock.dto.DemandForecastResponse.ProductDemandForecast;
import com.optistock.entity.Product;
import com.optistock.repository.BillItemRepository;
import com.optistock.repository.BillRepository;
import com.optistock.repository.ProductRepository;

public class DemandForecastTest {

	private ProductRepository productRepository;
	private BillRepository billRepository;
	private BillItemRepository billItemRepository;
	private ExpiryPricingService expiryPricingService;
	private ManagerService managerService;
	private Clock fixedClock;

	@BeforeEach
	void setUp() {
		productRepository = Mockito.mock(ProductRepository.class);
		billRepository = Mockito.mock(BillRepository.class);
		billItemRepository = Mockito.mock(BillItemRepository.class);
		expiryPricingService = new ExpiryPricingService(new MarkdownProperties());
		fixedClock = Clock.fixed(Instant.parse("2026-10-13T00:03:00Z"), ZoneId.of("Asia/Kolkata"));
		managerService = new ManagerService(productRepository, billRepository, billItemRepository, expiryPricingService, null, fixedClock);
	}

	@Test
	@DisplayName("Baseline A weights last 7 days at 2 and earlier days at 1 divided by 37")
	void baselineACalculationWithWeightedMovingAverage() {
		LocalDate today = LocalDate.now(fixedClock); // 2026-10-13

		Product p = new Product();
		p.setId(1L);
		p.setName("Amul Milk 1L");
		p.setBrand("Amul");
		p.setProductType("Milk 1L");
		p.setCategory("Dairy");
		p.setStockQuantity(20);
		p.setReorderThreshold(15);
		p.setCostPrice(new BigDecimal("50.00"));
		p.setSellingPrice(new BigDecimal("64.00"));
		p.setActive(true);

		when(productRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(p));
		when(productRepository.findByActiveTrue()).thenReturn(List.of(p));

		// Mock 35 days of sales: 10 units every day
		List<Object[]> rows = new ArrayList<>();
		for (int i = 1; i <= 35; i++) {
			LocalDate d = today.minusDays(i);
			rows.add(new Object[]{1L, d, 10L});
		}
		when(billItemRepository.dailyUnitsByProductBetween(any(), any())).thenReturn(rows);

		ProductDemandForecast forecast = managerService.getProductDemandForecast(1L, 30);
		assertNotNull(forecast);

		// With 10 units each day:
		// weightedSum = 23*10*1 + 7*10*2 = 230 + 140 = 370
		// baselineA = 370 / 37 = 10.00
		assertEquals(new BigDecimal("10.00"), forecast.getCalcDetails().getBaselineA());
		assertEquals(300, forecast.getForecastTotal()); // 30 days * 10/day = 300
	}

	@Test
	@DisplayName("Suggested order caps at expiry threshold when expiry is closer than horizon")
	void suggestedOrderCapsAtExpiryThreshold() {
		LocalDate today = LocalDate.now(fixedClock); // 2026-10-13

		Product p = new Product();
		p.setId(2L);
		p.setName("Fresh Curd 400g");
		p.setBrand("Amul");
		p.setProductType("Curd 400g");
		p.setCategory("Dairy");
		p.setStockQuantity(5);
		p.setReorderThreshold(10);
		p.setCostPrice(new BigDecimal("30.00"));
		p.setSellingPrice(new BigDecimal("40.00"));
		p.setExpiryDate(today.plusDays(5)); // expires in 5 days
		p.setActive(true);

		when(productRepository.findByIdAndActiveTrue(2L)).thenReturn(Optional.of(p));
		when(productRepository.findByActiveTrue()).thenReturn(List.of(p));

		// 10 units sold every day
		List<Object[]> rows = new ArrayList<>();
		for (int i = 1; i <= 35; i++) {
			LocalDate d = today.minusDays(i);
			rows.add(new Object[]{2L, d, 10L});
		}
		when(billItemRepository.dailyUnitsByProductBetween(any(), any())).thenReturn(rows);

		ProductDemandForecast forecast = managerService.getProductDemandForecast(2L, 30);
		// Suggested order must not exceed demand up to expiry
		assertTrue(forecast.getSuggestedOrder() <= 50, "Order must be capped around expiry horizon");
	}

	@Test
	@DisplayName("Overall accuracy reports percentage when backtest product history exists")
	void overallAccuracyCalculatedFromBacktest() {
		LocalDate today = LocalDate.now(fixedClock);

		Product p = new Product();
		p.setId(3L);
		p.setName("Biscuits 100g");
		p.setStockQuantity(50);
		p.setReorderThreshold(20);
		p.setCostPrice(new BigDecimal("10.00"));
		p.setSellingPrice(new BigDecimal("15.00"));
		p.setActive(true);

		when(productRepository.findByActiveTrue()).thenReturn(List.of(p));

		List<Object[]> rows = new ArrayList<>();
		for (int i = 1; i <= 35; i++) {
			LocalDate d = today.minusDays(i);
			rows.add(new Object[]{3L, d, 15L});
		}
		when(billItemRepository.dailyUnitsByProductBetween(any(), any())).thenReturn(rows);

		DemandForecastResponse resp = managerService.getDemandForecast(30, null, null);
		assertNotNull(resp);
		assertTrue(resp.getOverallAccuracy().endsWith("%"), "Accuracy should end with %");
	}
}
