package com.optistock.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.optistock.dto.CreatePurchaseOrderRequest;
import com.optistock.dto.PurchaseOrderResponse;
import com.optistock.entity.Product;
import com.optistock.entity.PurchaseOrder;
import com.optistock.entity.Supplier;
import com.optistock.repository.ProductRepository;
import com.optistock.repository.PurchaseOrderRepository;
import com.optistock.repository.StockMovementRepository;
import com.optistock.repository.SupplierRepository;

@ExtendWith(MockitoExtension.class)
class PurchaseOrderSupplierTest {

	@Mock
	private PurchaseOrderRepository purchaseOrderRepository;

	@Mock
	private ProductRepository productRepository;

	@Mock
	private StockMovementRepository stockMovementRepository;

	@Mock
	private SupplierRepository supplierRepository;

	private PurchaseOrderService purchaseOrderService;

	private final Clock fixedClock = Clock.fixed(Instant.parse("2026-10-13T10:00:00Z"), ZoneId.of("Asia/Kolkata"));

	@BeforeEach
	void setUp() {
		purchaseOrderService = new PurchaseOrderService(
				purchaseOrderRepository,
				productRepository,
				stockMovementRepository,
				supplierRepository,
				fixedClock);
	}

	@Test
	void testCreateAndListOrdersWithTwoDifferentSuppliers() {
		Product product1 = new Product();
		product1.setId(101L);
		product1.setName("Fresh Milk 500ml");
		product1.setActive(true);
		product1.setCostPrice(BigDecimal.valueOf(25.00));

		Product product2 = new Product();
		product2.setId(102L);
		product2.setName("Farm Fresh Onions 1kg");
		product2.setActive(true);
		product2.setCostPrice(BigDecimal.valueOf(35.00));

		Supplier amul = new Supplier("Amul Dairy Cooperative", "Vikram Shah", "+91 9699380848", "9699380848", "supply@amuldairy.com", "Anand", "Dairy");
		amul.setId(2L);

		Supplier kisan = new Supplier("Kisan Fresh Agro", "Ramesh Patel", "+91 98201 12345", "919820112345", "orders@kisanagro.com", "Vashi", "Vegetables");
		kisan.setId(1L);

		when(productRepository.findById(101L)).thenReturn(Optional.of(product1));
		when(productRepository.findById(102L)).thenReturn(Optional.of(product2));
		when(supplierRepository.findById(2L)).thenReturn(Optional.of(amul));
		when(supplierRepository.findById(1L)).thenReturn(Optional.of(kisan));
		when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(inv -> {
			PurchaseOrder po = inv.getArgument(0);
			if (po.getId() == null) po.setId(501L);
			return po;
		});

		// 1. Create PO for Supplier 2 (Amul)
		CreatePurchaseOrderRequest req1 = new CreatePurchaseOrderRequest();
		req1.setProductId(101L);
		req1.setQuantity(50);
		req1.setSupplierId(2L);
		PurchaseOrderResponse res1 = purchaseOrderService.createOrder(req1, "manager@optistock.com");

		assertEquals(2L, res1.getSupplierId());
		assertEquals("Amul Dairy Cooperative", res1.getSupplier());
		assertEquals("+91 9699380848", res1.getSupplierPhone());
		assertEquals("9699380848", res1.getSupplierWhatsapp());
		assertEquals("supply@amuldairy.com", res1.getSupplierEmail());

		// 2. Create PO for Supplier 1 (Kisan Fresh)
		CreatePurchaseOrderRequest req2 = new CreatePurchaseOrderRequest();
		req2.setProductId(102L);
		req2.setQuantity(30);
		req2.setSupplierId(1L);
		PurchaseOrderResponse res2 = purchaseOrderService.createOrder(req2, "manager@optistock.com");

		assertEquals(1L, res2.getSupplierId());
		assertEquals("Kisan Fresh Agro", res2.getSupplier());
		assertEquals("+91 98201 12345", res2.getSupplierPhone());
		assertEquals("919820112345", res2.getSupplierWhatsapp());
		assertEquals("orders@kisanagro.com", res2.getSupplierEmail());
	}
}
