package com.optistock.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.optistock.dto.BillItemResponse;
import com.optistock.dto.BillLineRequest;
import com.optistock.dto.BillResponse;
import com.optistock.dto.CreateBillRequest;
import com.optistock.dto.PriceQuote;
import com.optistock.entity.Bill;
import com.optistock.entity.BillItem;
import com.optistock.entity.ExpiryStatus;
import com.optistock.entity.Product;
import com.optistock.exception.ResourceNotFoundException;
import com.optistock.exception.StockConflictException;
import com.optistock.repository.BillItemRepository;
import com.optistock.repository.BillRepository;
import com.optistock.repository.ProductRepository;

@Service
public class BillService {

	private final BillRepository billRepository;
	private final BillItemRepository billItemRepository;
	private final ProductRepository productRepository;
	private final ExpiryPricingService expiryPricingService;

	public BillService(BillRepository billRepository, BillItemRepository billItemRepository,
			ProductRepository productRepository, ExpiryPricingService expiryPricingService) {
		this.billRepository = billRepository;
		this.billItemRepository = billItemRepository;
		this.productRepository = productRepository;
		this.expiryPricingService = expiryPricingService;
	}

	@Transactional
	public BillResponse createBill(Long cashierId, CreateBillRequest request) {
		if (request.getItems() == null || request.getItems().isEmpty()) {
			throw new IllegalArgumentException("Bill must contain at least one item");
		}

		LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));

		Bill bill = new Bill();
		bill.setCashierId(cashierId);
		bill.setTotalAmount(BigDecimal.ZERO);
		bill = billRepository.save(bill);

		BigDecimal totalCharged = BigDecimal.ZERO;
		BigDecimal totalOriginal = BigDecimal.ZERO;
		List<BillItemResponse> itemResponses = new ArrayList<>();

		for (BillLineRequest line : request.getItems()) {
			if (line.getProductId() == null) {
				throw new IllegalArgumentException("productId is required");
			}
			if (line.getQuantity() == null || line.getQuantity() <= 0) {
				throw new IllegalArgumentException("quantity must be greater than 0");
			}

			Product product = productRepository.findById(line.getProductId())
					.orElseThrow(() -> new ResourceNotFoundException("Product not found: " + line.getProductId()));

			PriceQuote quote = expiryPricingService.quote(product, today);

			if (quote.getStatus() == ExpiryStatus.EXPIRED) {
				throw new IllegalArgumentException(
						"Product " + product.getId() + " (" + product.getName() + ") is expired and cannot be sold");
			}

			int available = product.getStockQuantity() == null ? 0 : product.getStockQuantity();
			if (available < line.getQuantity()) {
				throw new IllegalArgumentException(
						"Insufficient stock for product " + product.getId() + " (available: " + available + ")");
			}

			BigDecimal originalPrice = quote.getBasePrice();
			BigDecimal effectivePrice = quote.getEffectivePrice();
			BigDecimal lineOriginal = originalPrice.multiply(BigDecimal.valueOf(line.getQuantity()))
					.setScale(2, RoundingMode.HALF_UP);
			BigDecimal lineCharged = effectivePrice.multiply(BigDecimal.valueOf(line.getQuantity()))
					.setScale(2, RoundingMode.HALF_UP);

			totalOriginal = totalOriginal.add(lineOriginal);
			totalCharged = totalCharged.add(lineCharged);

			product.setStockQuantity(available - line.getQuantity());
			try {
				productRepository.save(product);
			} catch (org.springframework.orm.ObjectOptimisticLockingFailureException ex) {
				throw new StockConflictException("Stock changed, please retry");
			}

			String discountReason = null;
			if (quote.getDiscountPercent().compareTo(BigDecimal.ZERO) > 0) {
				discountReason = "Expiry markdown (" + quote.getStatus().name() + ")";
			}

			BillItem item = new BillItem();
			item.setBillId(bill.getId());
			item.setProductId(product.getId());
			item.setQuantity(line.getQuantity());
			item.setPrice(effectivePrice);
			item.setOriginalPrice(originalPrice);
			item.setDiscountPercent(quote.getDiscountPercent());
			item.setDiscountReason(discountReason);
			item.setBelowCost(quote.isBelowCost());
			item = billItemRepository.save(item);

			itemResponses.add(new BillItemResponse(item.getId(), item.getProductId(), item.getQuantity(),
					item.getPrice(), item.getOriginalPrice(), item.getDiscountPercent(),
					item.getDiscountReason(), item.getBelowCost()));
		}

		BigDecimal totalDiscount = totalOriginal.subtract(totalCharged).setScale(2, RoundingMode.HALF_UP);

		bill.setSubtotal(totalOriginal);
		bill.setTotalDiscount(totalDiscount);
		bill.setTotalAmount(totalCharged);
		bill = billRepository.save(bill);

		return new BillResponse(bill.getId(), bill.getCashierId(), bill.getTotalAmount(),
				bill.getSubtotal(), bill.getTotalDiscount(), bill.getStatus(),
				bill.getCancelledAt(), bill.getCreatedAt(), itemResponses);
	}
}
