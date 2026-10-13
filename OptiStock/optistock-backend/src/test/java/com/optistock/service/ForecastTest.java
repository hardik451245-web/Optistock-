package com.optistock.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mockito;
import static org.mockito.Mockito.when;

import com.optistock.config.MarkdownProperties;
import com.optistock.dto.ForecastItem;
import com.optistock.entity.Product;
import com.optistock.repository.BillItemRepository;
import com.optistock.repository.BillRepository;
import com.optistock.repository.ProductRepository;

public class ForecastTest {

	private ProductRepository productRepository;
	private BillRepository billRepository;
	private BillItemRepository billItemRepository;
	private ExpiryPricingService expiryPricingService;
	private ManagerService managerService;

	@BeforeEach
	void setUp() {
		productRepository = Mockito.mock(ProductRepository.class);
		billRepository = Mockito.mock(BillRepository.class);
		billItemRepository = Mockito.mock(BillItemRepository.class);
		expiryPricingService = new ExpiryPricingService(new MarkdownProperties());
		managerService = new ManagerService(productRepository, billRepository, billItemRepository, expiryPricingService);
	}

	private Product createProduct(Long id, String name, String brand, String category,
			String cost, String selling, int stock, int threshold, LocalDate expiry) {
		Product p = new Product();
		p.setId(id);
		p.setName(name);
		p.setBrand(brand);
		p.setCategory(category);
		p.setCostPrice(new BigDecimal(cost));
		p.setSellingPrice(new BigDecimal(selling));
		p.setStockQuantity(stock);
		p.setReorderThreshold(threshold);
		p.setExpiryDate(expiry);
		return p;
	}

	@Test
	@DisplayName("Weighted moving average weighs last 7 days double and days 8-30 once")
	void testWeightedMovingAverageSales() {
		Product product = createProduct(1L, "Rice", "Basmati", "Staples", "80.00", "100.00", 50, 20, null);
		when(productRepository.findByActiveTrue()).thenReturn(List.of(product));

		List<Object[]> r1 = new ArrayList<>();
		r1.add(new Object[]{1L, 14L});
		List<Object[]> r2 = new ArrayList<>();
		r2.add(new Object[]{1L, 23L});

		when(billItemRepository.sumQuantityByProductBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
				.thenReturn(r1)
				.thenReturn(r2);

		List<ForecastItem> forecast = managerService.getForecast();
		assertEquals(1, forecast.size());
		ForecastItem item = forecast.get(0);

		// weightedSum = 14*2 + 23 = 51. avgDailySales = 51 / 37 = 1.38
		BigDecimal expectedDaily = new BigDecimal("51").divide(new BigDecimal("37"), 2, RoundingMode.HALF_UP);
		assertEquals(expectedDaily, item.getAvgDailySales());

		// forecast30 = ceil(1.38 * 30) = ceil(41.4) = 42
		int expectedForecast30 = (int) Math.ceil(expectedDaily.doubleValue() * 30);
		assertEquals(expectedForecast30, item.getForecast30());
	}

	@Test
	@DisplayName("Suggested reorder quantity accounts for buffer and stock")
	void testSuggestedReorderQtyStandardProduct() {
		Product product = createProduct(2L, "Oil", "Fortune", "Staples", "100.00", "120.00", 10, 15, null);
		when(productRepository.findByActiveTrue()).thenReturn(List.of(product));

		List<Object[]> r1 = new ArrayList<>();
		r1.add(new Object[]{2L, 20L});
		List<Object[]> r2 = new ArrayList<>();
		r2.add(new Object[]{2L, 34L});

		when(billItemRepository.sumQuantityByProductBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
				.thenReturn(r1)
				.thenReturn(r2);

		List<ForecastItem> forecast = managerService.getForecast();
		ForecastItem item = forecast.get(0);

		assertEquals(new BigDecimal("2.00"), item.getAvgDailySales());
		assertEquals(60, item.getForecast30());
		assertEquals(56, item.getSuggestedReorderQty());
	}

	@Test
	@DisplayName("Expiring product reorder qty is capped by days left")
	void testSuggestedReorderQtyCappedByExpiry() {
		LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
		Product product = createProduct(3L, "Milk", "Amul", "Dairy", "25.00", "30.00", 5, 10, today.plusDays(4));
		when(productRepository.findByActiveTrue()).thenReturn(List.of(product));

		List<Object[]> r1 = new ArrayList<>();
		r1.add(new Object[]{3L, 20L});
		List<Object[]> r2 = new ArrayList<>();
		r2.add(new Object[]{3L, 34L});

		when(billItemRepository.sumQuantityByProductBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
				.thenReturn(r1)
				.thenReturn(r2);

		List<ForecastItem> forecast = managerService.getForecast();
		ForecastItem item = forecast.get(0);

		assertEquals(8, item.getSuggestedReorderQty());
	}

	@Test
	@DisplayName("Expired product reorder qty is 0")
	void testSuggestedReorderQtyZeroWhenExpired() {
		LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
		Product product = createProduct(4L, "Dahi", "Nestle", "Dairy", "20.00", "25.00", 2, 5, today.minusDays(1));
		when(productRepository.findByActiveTrue()).thenReturn(List.of(product));

		List<Object[]> r1 = new ArrayList<>();
		r1.add(new Object[]{4L, 20L});
		List<Object[]> r2 = new ArrayList<>();
		r2.add(new Object[]{4L, 34L});

		when(billItemRepository.sumQuantityByProductBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
				.thenReturn(r1)
				.thenReturn(r2);

		List<ForecastItem> forecast = managerService.getForecast();
		ForecastItem item = forecast.get(0);
		assertEquals(0, item.getSuggestedReorderQty());
	}
}
