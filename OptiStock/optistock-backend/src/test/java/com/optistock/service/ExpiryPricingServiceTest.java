package com.optistock.service;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.optistock.config.MarkdownProperties;
import com.optistock.dto.PriceQuote;
import com.optistock.entity.ExpiryStatus;
import com.optistock.entity.Product;

class ExpiryPricingServiceTest {

	private ExpiryPricingService service;
	private final LocalDate today = LocalDate.of(2026, 10, 10);

	@BeforeEach
	void setUp() {
		MarkdownProperties props = new MarkdownProperties();
		service = new ExpiryPricingService(props);
	}

	@Test
	@DisplayName("No expiry date or 5+ days left returns NORMAL status with no discount")
	void testNormalAndNoExpiry() {
		Product noExp = new Product();
		noExp.setSellingPrice(new BigDecimal("100.00"));
		PriceQuote qNoExp = service.quote(noExp, today);
		assertEquals(ExpiryStatus.NO_EXPIRY, qNoExp.getStatus());
		assertEquals(new BigDecimal("100.00"), qNoExp.getEffectivePrice());
		assertEquals(new BigDecimal("0.00"), qNoExp.getDiscountPercent());

		Product normal = new Product();
		normal.setSellingPrice(new BigDecimal("100.00"));
		normal.setExpiryDate(today.plusDays(5));
		PriceQuote qNormal = service.quote(normal, today);
		assertEquals(ExpiryStatus.NORMAL, qNormal.getStatus());
		assertEquals(new BigDecimal("100.00"), qNormal.getEffectivePrice());
		assertEquals(new BigDecimal("0.00"), qNormal.getDiscountPercent());
	}

	@Test
	@DisplayName("3 to 4 days left returns EXPIRING_SOON status with full base price")
	void testExpiringSoonTier() {
		for (int days = 3; days <= 4; days++) {
			Product p = new Product();
			p.setSellingPrice(new BigDecimal("100.00"));
			p.setExpiryDate(today.plusDays(days));
			PriceQuote q = service.quote(p, today);
			assertEquals(ExpiryStatus.EXPIRING_SOON, q.getStatus());
			assertEquals(new BigDecimal("100.00"), q.getEffectivePrice());
			assertEquals(new BigDecimal("0.00"), q.getDiscountPercent());
		}
	}

	@Test
	@DisplayName("1 to 2 days left returns MARKDOWN status with 50% discount")
	void testMarkdownTier() {
		for (int days = 1; days <= 2; days++) {
			Product p = new Product();
			p.setSellingPrice(new BigDecimal("100.00"));
			p.setExpiryDate(today.plusDays(days));
			PriceQuote q = service.quote(p, today);
			assertEquals(ExpiryStatus.MARKDOWN, q.getStatus());
			assertEquals(new BigDecimal("50.00"), q.getEffectivePrice());
			assertEquals(new BigDecimal("50.00"), q.getDiscountPercent());
		}
	}

	@Test
	@DisplayName("Last day returns 70% discount and expired returns EXPIRED status with 0 price")
	void testLastDayAndExpired() {
		Product lastDay = new Product();
		lastDay.setSellingPrice(new BigDecimal("100.00"));
		lastDay.setExpiryDate(today);
		PriceQuote qLast = service.quote(lastDay, today);
		assertEquals(ExpiryStatus.LAST_DAY, qLast.getStatus());
		assertEquals(new BigDecimal("70.00"), qLast.getDiscountPercent());
		assertEquals(new BigDecimal("30.00"), qLast.getEffectivePrice());

		Product expired = new Product();
		expired.setSellingPrice(new BigDecimal("100.00"));
		expired.setExpiryDate(today.minusDays(1));
		PriceQuote qExp = service.quote(expired, today);
		assertEquals(ExpiryStatus.EXPIRED, qExp.getStatus());
		assertEquals(new BigDecimal("0.00"), qExp.getEffectivePrice());
	}

	@Test
	@DisplayName("Markdown goes below cost price when effective price is less than cost price")
	void testMarkdownGoesBelowCostPrice() {
		Product p = new Product();
		p.setCostPrice(new BigDecimal("60.00"));
		p.setSellingPrice(new BigDecimal("100.00"));
		p.setExpiryDate(today.plusDays(2)); // 50% markdown -> effective 50.00 < cost 60.00

		PriceQuote quote = service.quote(p, today);
		assertEquals(new BigDecimal("50.00"), quote.getEffectivePrice());
		assertTrue(quote.isBelowCost());
	}
}
