package com.optistock.service;

import java.math.BigDecimal;
import java.util.List;
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

import com.optistock.config.DiscountProperties;
import com.optistock.config.MarkdownProperties;
import com.optistock.dto.BillLineRequest;
import com.optistock.dto.BillResponse;
import com.optistock.dto.CreateBillRequest;
import com.optistock.entity.Bill;
import com.optistock.entity.BillItem;
import com.optistock.entity.BillStatus;
import com.optistock.entity.DiscountRequest;
import com.optistock.entity.DiscountRequestStatus;
import com.optistock.entity.Product;
import com.optistock.exception.ProfitWarningException;
import com.optistock.repository.BillItemRepository;
import com.optistock.repository.BillRepository;
import com.optistock.repository.DiscountRequestRepository;
import com.optistock.repository.ProductRepository;

public class BillServiceTest {

	private BillRepository billRepository;
	private BillItemRepository billItemRepository;
	private ProductRepository productRepository;
	private ExpiryPricingService expiryPricingService;
	private DiscountProperties discountProperties;
	private DiscountRequestRepository discountRequestRepository;
	private BillService billService;

	@BeforeEach
	void setUp() {
		billRepository = Mockito.mock(BillRepository.class);
		billItemRepository = Mockito.mock(BillItemRepository.class);
		productRepository = Mockito.mock(ProductRepository.class);
		MarkdownProperties markdownProperties = new MarkdownProperties();
		expiryPricingService = new ExpiryPricingService(markdownProperties);
		discountProperties = new DiscountProperties();
		discountProperties.setMinMarginPercent(10);
		discountRequestRepository = Mockito.mock(DiscountRequestRepository.class);

		billService = new BillService(billRepository, billItemRepository, productRepository,
				expiryPricingService, discountProperties, discountRequestRepository);
	}

	private Product createProduct(Long id, String name, String brand, String category,
			String cost, String selling, int stock, int threshold) {
		Product p = new Product();
		p.setId(id);
		p.setName(name);
		p.setBrand(brand);
		p.setCategory(category);
		p.setCostPrice(new BigDecimal(cost));
		p.setSellingPrice(new BigDecimal(selling));
		p.setStockQuantity(stock);
		p.setReorderThreshold(threshold);
		return p;
	}

	@Test
	@DisplayName("Create bill deducts product stock correctly")
	void testCreateBillDeductsStock() {
		Product product = createProduct(1L, "Rice", "Tata", "Staples", "40.00", "60.00", 10, 2);

		when(productRepository.findById(1L)).thenReturn(Optional.of(product));
		when(billRepository.save(any(Bill.class))).thenAnswer(inv -> inv.getArgument(0));
		when(billItemRepository.save(any(BillItem.class))).thenAnswer(inv -> inv.getArgument(0));

		CreateBillRequest req = new CreateBillRequest();
		BillLineRequest line = new BillLineRequest();
		line.setProductId(1L);
		line.setQuantity(3);
		req.setItems(List.of(line));

		BillResponse response = billService.createBill(1L, req);

		assertNotNull(response);
		assertEquals(7, product.getStockQuantity());
		verify(productRepository).save(product);
	}

	@Test
	@DisplayName("Cancel bill restores stock and updates status")
	void testCancelBillRestoresStock() {
		Bill bill = new Bill();
		bill.setId(100L);
		bill.setCashierId(1L);
		bill.setStatus(BillStatus.COMPLETED);

		BillItem item = new BillItem();
		item.setBillId(100L);
		item.setProductId(1L);
		item.setQuantity(4);
		item.setPrice(new BigDecimal("60.00"));

		Product product = createProduct(1L, "Rice", "Tata", "Staples", "40.00", "60.00", 6, 2);

		when(billRepository.findById(100L)).thenReturn(Optional.of(bill));
		when(billItemRepository.findByBillId(100L)).thenReturn(List.of(item));
		when(productRepository.findById(1L)).thenReturn(Optional.of(product));
		when(billRepository.save(any(Bill.class))).thenAnswer(inv -> inv.getArgument(0));

		BillResponse response = billService.cancelBill(100L);

		assertEquals(BillStatus.CANCELLED, response.getStatus());
		assertEquals(10, product.getStockQuantity());
		verify(productRepository).save(product);
	}

	@Test
	@DisplayName("Double cancel throws IllegalArgumentException")
	void testDoubleCancelRejects() {
		Bill bill = new Bill();
		bill.setId(101L);
		bill.setStatus(BillStatus.CANCELLED);

		when(billRepository.findById(101L)).thenReturn(Optional.of(bill));

		IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> billService.cancelBill(101L));
		assertEquals("Bill is already cancelled", ex.getMessage());
	}

	@Test
	@DisplayName("Profit warning throws 409 Conflict when manual discount violates minimum margin without approval")
	void testProfitWarningWithoutApprovalThrowsConflict() {
		Product product = createProduct(2L, "Expensive Item", "Brand", "General", "90.00", "100.00", 10, 2);

		when(productRepository.findById(2L)).thenReturn(Optional.of(product));
		when(billRepository.save(any(Bill.class))).thenAnswer(inv -> inv.getArgument(0));

		CreateBillRequest req = new CreateBillRequest();
		BillLineRequest line = new BillLineRequest();
		line.setProductId(2L);
		line.setQuantity(1);
		// 30% discount on 100 gives 70. Cost is 90 -> margin is negative (< 10%)
		line.setManualDiscountPercent(new BigDecimal("30.00"));
		req.setItems(List.of(line));

		assertThrows(ProfitWarningException.class, () -> billService.createBill(1L, req));
	}

	@Test
	@DisplayName("Bill creation succeeds when approved discount request ID is provided")
	void testProfitWarningWithApprovedRequestSucceeds() {
		Product product = createProduct(2L, "Expensive Item", "Brand", "General", "90.00", "100.00", 10, 2);

		DiscountRequest approvedReq = new DiscountRequest();
		approvedReq.setId(555L);
		approvedReq.setProductId(2L);
		approvedReq.setRequestedPercent(new BigDecimal("30.00"));
		approvedReq.setStatus(DiscountRequestStatus.APPROVED);

		when(productRepository.findById(2L)).thenReturn(Optional.of(product));
		when(discountRequestRepository.findById(555L)).thenReturn(Optional.of(approvedReq));
		when(billRepository.save(any(Bill.class))).thenAnswer(inv -> inv.getArgument(0));
		when(billItemRepository.save(any(BillItem.class))).thenAnswer(inv -> inv.getArgument(0));

		CreateBillRequest req = new CreateBillRequest();
		BillLineRequest line = new BillLineRequest();
		line.setProductId(2L);
		line.setQuantity(1);
		line.setManualDiscountPercent(new BigDecimal("30.00"));
		line.setApprovedRequestId(555L);
		req.setItems(List.of(line));

		BillResponse response = billService.createBill(1L, req);
		assertNotNull(response);
		assertEquals(new BigDecimal("70.00"), response.getTotalAmount());
	}
}
