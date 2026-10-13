package com.optistock.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mockito;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.optistock.dto.CreatePurchaseOrderRequest;
import com.optistock.dto.PurchaseOrderResponse;
import com.optistock.dto.ReceivePurchaseOrderRequest;
import com.optistock.dto.StockAdjustRequest;
import com.optistock.dto.StockMovementResponse;
import com.optistock.dto.StockWriteoffRequest;
import com.optistock.entity.Product;
import com.optistock.entity.PurchaseOrder;
import com.optistock.entity.PurchaseOrderStatus;
import com.optistock.entity.StockMovement;
import com.optistock.entity.StockMovementType;
import com.optistock.exception.StockConflictException;
import com.optistock.repository.ProductRepository;
import com.optistock.repository.PurchaseOrderRepository;
import com.optistock.repository.StockMovementRepository;

public class StockAndReorderTest {

	private PurchaseOrderRepository purchaseOrderRepository;
	private ProductRepository productRepository;
	private StockMovementRepository stockMovementRepository;
	private PurchaseOrderService purchaseOrderService;
	private StockService stockService;

	@BeforeEach
	void setUp() {
		purchaseOrderRepository = Mockito.mock(PurchaseOrderRepository.class);
		productRepository = Mockito.mock(ProductRepository.class);
		stockMovementRepository = Mockito.mock(StockMovementRepository.class);
		purchaseOrderService = new PurchaseOrderService(purchaseOrderRepository, productRepository, stockMovementRepository);
		stockService = new StockService(stockMovementRepository, productRepository);
	}

	private Product createProduct(Long id, String name, int stock, LocalDate expiry) {
		Product p = new Product();
		p.setId(id);
		p.setName(name);
		p.setCostPrice(new BigDecimal("10.00"));
		p.setSellingPrice(new BigDecimal("20.00"));
		p.setStockQuantity(stock);
		p.setExpiryDate(expiry);
		p.setActive(true);
		return p;
	}

	@Test
	@DisplayName("Create purchase order sets status ORDERED")
	void testCreatePurchaseOrder() {
		Product p = createProduct(1L, "Bread", 5, null);
		when(productRepository.findById(1L)).thenReturn(Optional.of(p));
		when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(inv -> {
			PurchaseOrder order = inv.getArgument(0);
			order.setId(10L);
			return order;
		});

		PurchaseOrderResponse resp = purchaseOrderService.createOrder(new CreatePurchaseOrderRequest(1L, 20, "Supplier A"), "manager@test.com");
		assertNotNull(resp);
		assertEquals(PurchaseOrderStatus.ORDERED, resp.getStatus());
		assertEquals(20, resp.getQuantity());
	}

	@Test
	@DisplayName("Receiving order updates stock, writes PURCHASE movement, and sets status RECEIVED")
	void testReceiveOrderSuccess() {
		Product p = createProduct(1L, "Soap", 10, null);
		PurchaseOrder po = new PurchaseOrder();
		po.setId(100L);
		po.setProductId(1L);
		po.setQuantity(25);
		po.setStatus(PurchaseOrderStatus.ORDERED);

		when(purchaseOrderRepository.findById(100L)).thenReturn(Optional.of(po));
		when(productRepository.findById(1L)).thenReturn(Optional.of(p));
		when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(inv -> inv.getArgument(0));

		ReceivePurchaseOrderRequest req = new ReceivePurchaseOrderRequest(25, null);
		PurchaseOrderResponse resp = purchaseOrderService.receiveOrder(100L, req, "manager@test.com");

		assertEquals(PurchaseOrderStatus.RECEIVED, resp.getStatus());
		assertEquals(35, p.getStockQuantity());
		verify(stockMovementRepository).save(any(StockMovement.class));
	}

	@Test
	@DisplayName("Receiving already received order rejects with 409 conflict")
	void testReceiveOrderTwiceRejects() {
		PurchaseOrder po = new PurchaseOrder();
		po.setId(101L);
		po.setStatus(PurchaseOrderStatus.RECEIVED);

		when(purchaseOrderRepository.findById(101L)).thenReturn(Optional.of(po));

		assertThrows(StockConflictException.class, () -> purchaseOrderService.receiveOrder(101L, new ReceivePurchaseOrderRequest(), "manager@test.com"));
	}

	@Test
	@DisplayName("Perishable receiving updates expiry if stock is 0, keeps earlier date if stock > 0")
	void testPerishableReceivingExpiryLogic() {
		LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));

		// Case A: stock is 0 -> adopts new expiry date
		Product pZero = createProduct(2L, "Milk A", 0, today.plusDays(2));
		PurchaseOrder po1 = new PurchaseOrder();
		po1.setId(201L);
		po1.setProductId(2L);
		po1.setQuantity(10);
		po1.setStatus(PurchaseOrderStatus.ORDERED);

		when(purchaseOrderRepository.findById(201L)).thenReturn(Optional.of(po1));
		when(productRepository.findById(2L)).thenReturn(Optional.of(pZero));
		when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(inv -> inv.getArgument(0));

		LocalDate freshBatchDate = today.plusDays(10);
		purchaseOrderService.receiveOrder(201L, new ReceivePurchaseOrderRequest(10, freshBatchDate), "manager@test.com");
		assertEquals(freshBatchDate, pZero.getExpiryDate());

		// Case B: stock > 0 with earlier expiry date -> keeps earlier date conservatively
		Product pStock = createProduct(3L, "Milk B", 5, today.plusDays(3));
		PurchaseOrder po2 = new PurchaseOrder();
		po2.setId(202L);
		po2.setProductId(3L);
		po2.setQuantity(10);
		po2.setStatus(PurchaseOrderStatus.ORDERED);

		when(purchaseOrderRepository.findById(202L)).thenReturn(Optional.of(po2));
		when(productRepository.findById(3L)).thenReturn(Optional.of(pStock));

		purchaseOrderService.receiveOrder(202L, new ReceivePurchaseOrderRequest(10, today.plusDays(8)), "manager@test.com");
		assertEquals(today.plusDays(3), pStock.getExpiryDate());
	}

	@Test
	@DisplayName("Stock adjust updates stock and writes ADJUSTMENT movement")
	void testStockAdjust() {
		Product p = createProduct(4L, "Rice", 20, null);
		when(productRepository.findById(4L)).thenReturn(Optional.of(p));
		when(stockMovementRepository.save(any(StockMovement.class))).thenAnswer(inv -> inv.getArgument(0));

		StockMovementResponse resp = stockService.adjustStock(new StockAdjustRequest(4L, -5, "Damaged bag"), "manager@test.com");
		assertEquals(15, p.getStockQuantity());
		assertEquals(-5, resp.getQuantityChange());
		assertEquals(StockMovementType.ADJUSTMENT, resp.getType());
	}

	@Test
	@DisplayName("Stock writeoff sets stock to 0 and writes WRITE_OFF movement")
	void testStockWriteoff() {
		Product p = createProduct(5L, "Dahi", 8, null);
		when(productRepository.findById(5L)).thenReturn(Optional.of(p));
		when(stockMovementRepository.save(any(StockMovement.class))).thenAnswer(inv -> inv.getArgument(0));

		StockMovementResponse resp = stockService.writeOffStock(new StockWriteoffRequest(5L, "Expired spoilage"), "manager@test.com");
		assertEquals(0, p.getStockQuantity());
		assertEquals(-8, resp.getQuantityChange());
		assertEquals(StockMovementType.WRITE_OFF, resp.getType());
	}
}
