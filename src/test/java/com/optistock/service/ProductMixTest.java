package com.optistock.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mockito;
import static org.mockito.Mockito.when;

import com.optistock.config.MarkdownProperties;
import com.optistock.dto.ProductMixResponse;
import com.optistock.entity.Product;
import com.optistock.repository.BillItemRepository;
import com.optistock.repository.BillRepository;
import com.optistock.repository.ProductRepository;

public class ProductMixTest {

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

	private Product createProduct(Long id, String name, String brand, String category, String productType,
			String cost, String selling, int stock, int threshold) {
		Product p = new Product();
		p.setId(id);
		p.setName(name);
		p.setBrand(brand);
		p.setCategory(category);
		p.setProductType(productType);
		p.setCostPrice(new BigDecimal(cost));
		p.setSellingPrice(new BigDecimal(selling));
		p.setStockQuantity(stock);
		p.setReorderThreshold(threshold);
		return p;
	}

	@Test
	@DisplayName("Two brands equal units sold with different profit gives 80/20 to higher profit brand")
	void twoBrandsEqualUnitsDifferentProfitGives8020ToHigherProfitBrand() {
		// Both sold 10 units, but BrandA had higher margin/profit per unit
		Product p1 = createProduct(1L, "Amul Milk 1L", "Amul", "Dairy", "Milk 1L", "50.00", "70.00", 30, 10);
		Product p2 = createProduct(2L, "Milky Mist Milk 1L", "Milky Mist", "Dairy", "Milk 1L", "50.00", "60.00", 30, 10);

		when(productRepository.findByActiveTrue()).thenReturn(List.of(p1, p2));

		List<Object[]> sales = new ArrayList<>();
		// p1 sold 10 units for 700.00 (profit = 200.00)
		sales.add(new Object[]{1L, 10L, new BigDecimal("700.00")});
		// p2 sold 10 units for 600.00 (profit = 100.00)
		sales.add(new Object[]{2L, 10L, new BigDecimal("600.00")});

		when(billItemRepository.salesByProductBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
				.thenReturn(sales);

		List<ProductMixResponse> responses = managerService.getProductMix(30);
		assertEquals(1, responses.size());
		ProductMixResponse mix = responses.get(0);
		assertEquals("Milk 1L", mix.getProductType());
		assertEquals(2, mix.getItems().size());

		// Amul gets 80% because it had higher profit
		assertEquals("Amul Milk 1L", mix.getItems().get(0).getName());
		assertEquals(new BigDecimal("80.00"), mix.getItems().get(0).getSuggestedSharePercent());
		assertEquals("Milky Mist Milk 1L", mix.getItems().get(1).getName());
		assertEquals(new BigDecimal("20.00"), mix.getItems().get(1).getSuggestedSharePercent());
		assertTrue(mix.getRecommendation().contains("Keep 80% Amul and 20% Milky Mist because Amul earned more profit."));
	}

	@Test
	@DisplayName("Milk and curd are never in the same group")
	void milkAndCurdAreNeverInSameGroup() {
		Product milk1 = createProduct(1L, "Amul Milk 1L", "Amul", "Dairy", "Milk 1L", "50.00", "64.00", 30, 10);
		Product milk2 = createProduct(2L, "Milky Mist Milk 1L", "Milky Mist", "Dairy", "Milk 1L", "52.00", "62.00", 30, 10);
		Product curd1 = createProduct(3L, "Amul Curd 400g", "Amul", "Dairy", "Curd 400g", "30.00", "40.00", 25, 8);
		Product curd2 = createProduct(4L, "Milky Mist Curd 400g", "Milky Mist", "Dairy", "Curd 400g", "32.00", "45.00", 20, 8);

		when(productRepository.findByActiveTrue()).thenReturn(List.of(milk1, milk2, curd1, curd2));
		when(billItemRepository.salesByProductBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
				.thenReturn(new ArrayList<>());

		List<ProductMixResponse> responses = managerService.getProductMix(30);
		assertEquals(2, responses.size());

		// Verify milk and curd are in separate groups
		List<String> types = responses.stream().map(ProductMixResponse::getProductType).toList();
		assertTrue(types.contains("Milk 1L"));
		assertTrue(types.contains("Curd 400g"));
		assertNotEquals(responses.get(0).getProductType(), responses.get(1).getProductType());
	}

	@Test
	@DisplayName("A one-brand group gives no split and says only one brand, nothing to compare")
	void oneBrandGroupGivesNoSplit() {
		Product p1 = createProduct(10L, "Amul Ghee 500ml", "Amul", "Dairy", "Ghee 500ml", "250.00", "320.00", 15, 5);

		when(productRepository.findByActiveTrue()).thenReturn(List.of(p1));
		when(billItemRepository.salesByProductBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
				.thenReturn(new ArrayList<>());

		List<ProductMixResponse> responses = managerService.getProductMix(30);
		assertEquals(1, responses.size());
		ProductMixResponse mix = responses.get(0);
		assertEquals("Only one brand, nothing to compare", mix.getRecommendation());
	}

	@Test
	@DisplayName("Three brands give 80% to top and 20% shared among others")
	void threeBrandsGive80And20Shared() {
		Product p1 = createProduct(1L, "Amul Butter 100g", "Amul", "Dairy", "Butter 100g", "40.00", "55.00", 30, 10);
		Product p2 = createProduct(2L, "Nandini Butter 100g", "Nandini", "Dairy", "Butter 100g", "40.00", "52.00", 20, 10);
		Product p3 = createProduct(3L, "Britannia Butter 100g", "Britannia", "Dairy", "Butter 100g", "42.00", "54.00", 20, 10);

		when(productRepository.findByActiveTrue()).thenReturn(List.of(p1, p2, p3));

		List<Object[]> sales = new ArrayList<>();
		// p1 profit = 300, p2 profit = 120, p3 profit = 120
		sales.add(new Object[]{1L, 20L, new BigDecimal("1100.00")});
		sales.add(new Object[]{2L, 10L, new BigDecimal("520.00")});
		sales.add(new Object[]{3L, 10L, new BigDecimal("540.00")});

		when(billItemRepository.salesByProductBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
				.thenReturn(sales);

		List<ProductMixResponse> responses = managerService.getProductMix(30);
		assertEquals(1, responses.size());
		ProductMixResponse mix = responses.get(0);
		assertEquals(3, mix.getItems().size());

		assertEquals(new BigDecimal("80.00"), mix.getItems().get(0).getSuggestedSharePercent());
		// Remaining 20% shared between Nandini and Britannia
		BigDecimal totalShare = mix.getItems().stream()
				.map(ProductMixResponse.ProductMixItem::getSuggestedSharePercent)
				.reduce(BigDecimal.ZERO, BigDecimal::add);
		assertEquals(new BigDecimal("100.00"), totalShare);
		assertTrue(mix.getRecommendation().contains("distribute 20% among alternatives"));
	}
}
