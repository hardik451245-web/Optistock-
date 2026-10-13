package com.optistock.service;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import static org.mockito.Mockito.when;

import com.optistock.config.MarkdownProperties;
import com.optistock.dto.AlertsResponse;
import com.optistock.entity.Product;
import com.optistock.repository.BillItemRepository;
import com.optistock.repository.BillRepository;
import com.optistock.repository.ProductRepository;

public class ClockConsistencyTest {

	@Test
	@DisplayName("Fixed clock at 2026-10-13T00:03+05:30 evaluates date as 2026-10-13 regardless of UTC offset")
	void fixedClockEvaluatesToKolkataDate() {
		// UTC time: 2026-10-12T18:33:00Z -> IST time: 2026-10-13T00:03:00+05:30
		Instant instant = Instant.parse("2026-10-12T18:33:00Z");
		Clock istClock = Clock.fixed(instant, ZoneId.of("Asia/Kolkata"));

		LocalDate today = LocalDate.now(istClock);
		assertEquals(LocalDate.of(2026, 10, 13), today);

		ProductRepository productRepo = Mockito.mock(ProductRepository.class);
		BillRepository billRepo = Mockito.mock(BillRepository.class);
		BillItemRepository billItemRepo = Mockito.mock(BillItemRepository.class);
		ExpiryPricingService expiryPricingService = new ExpiryPricingService(new MarkdownProperties());
		ManagerService managerService = new ManagerService(productRepo, billRepo, billItemRepo, expiryPricingService, null, istClock);

		Product p = new Product();
		p.setId(101L);
		p.setName("Fresh Curd 400g");
		p.setStockQuantity(15);
		p.setReorderThreshold(10);
		p.setSellingPrice(new BigDecimal("40.00"));
		p.setCostPrice(new BigDecimal("30.00"));
		p.setExpiryDate(LocalDate.of(2026, 10, 17)); // 4 days ahead of 2026-10-13 -> EXPIRING_SOON
		p.setActive(true);

		when(productRepo.findByActiveTrue()).thenReturn(List.of(p));
		when(billItemRepo.dailyUnitsByProductBetween(Mockito.any(), Mockito.any())).thenReturn(Collections.emptyList());

		AlertsResponse alerts = managerService.getAlerts();
		assertFalse(alerts.getExpiringSoon().isEmpty(), "Product expiring in 4 days should be in expiringSoon");
		assertEquals(101L, alerts.getExpiringSoon().get(0).getId());
	}
}
