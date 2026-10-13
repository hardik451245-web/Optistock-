package com.optistock.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.optistock.config.DiscountProperties;
import com.optistock.dto.BillItemResponse;
import com.optistock.dto.BillLineRequest;
import com.optistock.dto.BillResponse;
import com.optistock.dto.CreateBillRequest;
import com.optistock.dto.PriceQuote;
import com.optistock.entity.Bill;
import com.optistock.entity.BillItem;
import com.optistock.entity.BillStatus;
import com.optistock.entity.DiscountRequest;
import com.optistock.entity.DiscountRequestStatus;
import com.optistock.entity.ExpiryStatus;
import com.optistock.entity.Product;
import com.optistock.exception.ProfitWarningException;
import com.optistock.exception.ResourceNotFoundException;
import com.optistock.exception.StockConflictException;
import com.optistock.repository.BillItemRepository;
import com.optistock.repository.BillRepository;
import com.optistock.repository.DiscountRequestRepository;
import com.optistock.repository.ProductRepository;

import com.optistock.entity.StockMovement;
import com.optistock.entity.StockMovementType;
import com.optistock.repository.StockMovementRepository;

@Service
public class BillService {

	private final BillRepository billRepository;
	private final BillItemRepository billItemRepository;
	private final ProductRepository productRepository;
	private final ExpiryPricingService expiryPricingService;
	private final DiscountProperties discountProperties;
	private final DiscountRequestRepository discountRequestRepository;
	private final StockMovementRepository stockMovementRepository;
	private final java.time.Clock clock;

	@org.springframework.beans.factory.annotation.Autowired
	public BillService(BillRepository billRepository, BillItemRepository billItemRepository,
			ProductRepository productRepository, ExpiryPricingService expiryPricingService,
			DiscountProperties discountProperties, DiscountRequestRepository discountRequestRepository,
			StockMovementRepository stockMovementRepository, java.time.Clock clock) {
		this.billRepository = billRepository;
		this.billItemRepository = billItemRepository;
		this.productRepository = productRepository;
		this.expiryPricingService = expiryPricingService;
		this.discountProperties = discountProperties;
		this.discountRequestRepository = discountRequestRepository;
		this.stockMovementRepository = stockMovementRepository;
		this.clock = clock != null ? clock : java.time.Clock.system(java.time.ZoneId.of("Asia/Kolkata"));
	}

	public BillService(BillRepository billRepository, BillItemRepository billItemRepository,
			ProductRepository productRepository, ExpiryPricingService expiryPricingService,
			DiscountProperties discountProperties, DiscountRequestRepository discountRequestRepository,
			StockMovementRepository stockMovementRepository) {
		this(billRepository, billItemRepository, productRepository, expiryPricingService,
				discountProperties, discountRequestRepository, stockMovementRepository, java.time.Clock.system(java.time.ZoneId.of("Asia/Kolkata")));
	}

	public BillService(BillRepository billRepository, BillItemRepository billItemRepository,
			ProductRepository productRepository, ExpiryPricingService expiryPricingService,
			DiscountProperties discountProperties, DiscountRequestRepository discountRequestRepository) {
		this(billRepository, billItemRepository, productRepository, expiryPricingService,
				discountProperties, discountRequestRepository, null, java.time.Clock.system(java.time.ZoneId.of("Asia/Kolkata")));
	}

	@Transactional
	public BillResponse createBill(Long cashierId, CreateBillRequest request) {
		if (request.getItems() == null || request.getItems().isEmpty()) {
			throw new IllegalArgumentException("Bill must contain at least one item");
		}

		LocalDate today = LocalDate.now(clock);

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
					.orElseThrow(() -> new ResourceNotFoundException("Product " + line.getProductId() + " not found"));

			if (!Boolean.TRUE.equals(product.getActive())) {
				throw new IllegalArgumentException("Product " + product.getId() + " is inactive and cannot be sold");
			}

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

			BigDecimal basePrice = quote.getBasePrice();
			BigDecimal expiryDiscount = quote.getDiscountPercent() != null ? quote.getDiscountPercent() : BigDecimal.ZERO;
			BigDecimal manualDiscount = line.getManualDiscountPercent() != null ? line.getManualDiscountPercent() : BigDecimal.ZERO;

			if (manualDiscount.compareTo(BigDecimal.ZERO) < 0 || manualDiscount.compareTo(new BigDecimal("100")) > 0) {
				throw new IllegalArgumentException("Manual discount must be between 0 and 100");
			}

			BigDecimal effectiveDiscount = expiryDiscount.max(manualDiscount).setScale(2, RoundingMode.HALF_UP);

			BigDecimal factor = BigDecimal.ONE.subtract(effectiveDiscount.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));
			BigDecimal effectivePrice = basePrice.multiply(factor).setScale(2, RoundingMode.HALF_UP);

			boolean isMarkdownLine = expiryDiscount.compareTo(BigDecimal.ZERO) > 0;
			if (!isMarkdownLine && product.getCostPrice() != null) {
				BigDecimal minMargin = BigDecimal.valueOf(discountProperties.getMinMarginPercent());
				BigDecimal marginPercent;
				if (effectivePrice.compareTo(BigDecimal.ZERO) > 0) {
					marginPercent = effectivePrice.subtract(product.getCostPrice())
							.multiply(new BigDecimal("100"))
							.divide(effectivePrice, 4, RoundingMode.HALF_UP);
				} else {
					marginPercent = new BigDecimal("-100.00");
				}

				if (marginPercent.compareTo(minMargin) < 0) {
					if (line.getApprovedRequestId() == null) {
						throw new ProfitWarningException("Profit warning: manager approval required");
					}
					DiscountRequest req = discountRequestRepository.findById(line.getApprovedRequestId())
							.orElseThrow(() -> new ProfitWarningException("Profit warning: manager approval required"));
					if (req.getStatus() != DiscountRequestStatus.APPROVED
							|| !req.getProductId().equals(product.getId())
							|| req.getRequestedPercent().compareTo(manualDiscount) != 0) {
						throw new ProfitWarningException("Profit warning: manager approval required");
					}
				}
			}

			BigDecimal lineOriginal = basePrice.multiply(BigDecimal.valueOf(line.getQuantity()))
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
			if (effectiveDiscount.compareTo(BigDecimal.ZERO) > 0) {
				if (manualDiscount.compareTo(expiryDiscount) > 0) {
					discountReason = "Manual discount (" + manualDiscount.setScale(2, RoundingMode.HALF_UP) + "%)";
				} else {
					discountReason = "Expiry markdown (" + quote.getStatus().name() + ")";
				}
			}

			boolean belowCost = product.getCostPrice() != null && effectivePrice.compareTo(product.getCostPrice()) < 0;

			BillItem item = new BillItem();
			item.setBillId(bill.getId());
			item.setProductId(product.getId());
			item.setQuantity(line.getQuantity());
			item.setPrice(effectivePrice);
			item.setOriginalPrice(basePrice);
			item.setDiscountPercent(effectiveDiscount);
			item.setDiscountReason(discountReason);
			item.setBelowCost(belowCost);
			item = billItemRepository.save(item);

			if (stockMovementRepository != null) {
				stockMovementRepository.save(new StockMovement(
						product.getId(),
						StockMovementType.SALE,
						-line.getQuantity(),
						"Bill #" + bill.getId(),
						"Cashier #" + cashierId,
						LocalDateTime.now(ZoneId.of("Asia/Kolkata"))));
			}

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

	@Transactional
	public BillResponse cancelBill(Long billId) {
		Bill bill = billRepository.findById(billId)
				.orElseThrow(() -> new ResourceNotFoundException("Bill not found: " + billId));

		if (bill.getStatus() == BillStatus.CANCELLED) {
			throw new IllegalArgumentException("Bill is already cancelled");
		}

		bill.setStatus(BillStatus.CANCELLED);
		bill.setCancelledAt(LocalDateTime.now(ZoneId.of("Asia/Kolkata")));
		bill = billRepository.save(bill);

		List<BillItem> items = billItemRepository.findByBillId(bill.getId());
		List<BillItemResponse> itemResponses = new ArrayList<>();

		for (BillItem item : items) {
			Product product = productRepository.findById(item.getProductId())
					.orElseThrow(() -> new ResourceNotFoundException("Product " + item.getProductId() + " not found"));
			int currentStock = product.getStockQuantity() == null ? 0 : product.getStockQuantity();
			product.setStockQuantity(currentStock + item.getQuantity());
			try {
				productRepository.save(product);
			} catch (org.springframework.orm.ObjectOptimisticLockingFailureException ex) {
				throw new StockConflictException("Stock changed, please retry");
			}

			if (stockMovementRepository != null) {
				stockMovementRepository.save(new StockMovement(
						product.getId(),
						StockMovementType.CANCEL_RESTORE,
						item.getQuantity(),
						"Bill #" + bill.getId() + " cancellation",
						"Manager",
						LocalDateTime.now(ZoneId.of("Asia/Kolkata"))));
			}

			itemResponses.add(new BillItemResponse(item.getId(), item.getProductId(), item.getQuantity(),
					item.getPrice(), item.getOriginalPrice(), item.getDiscountPercent(),
					item.getDiscountReason(), item.getBelowCost()));
		}

		return new BillResponse(bill.getId(), bill.getCashierId(), bill.getTotalAmount(),
				bill.getSubtotal(), bill.getTotalDiscount(), bill.getStatus(),
				bill.getCancelledAt(), bill.getCreatedAt(), itemResponses);
	}

	@Transactional(readOnly = true)
	public List<BillResponse> getBills(LocalDate date, Long cashierId, boolean isManager) {
		if (date == null) {
			date = LocalDate.now(clock);
		}
		LocalDateTime from = date.atStartOfDay();
		LocalDateTime to = date.plusDays(1).atStartOfDay();

		List<Bill> bills;
		if (isManager) {
			bills = billRepository.findByCreatedAtBetween(from, to);
		} else {
			bills = billRepository.findByCreatedAtBetweenAndCashierId(from, to, cashierId);
		}

		return bills.stream().map(bill -> {
			List<BillItem> items = billItemRepository.findByBillId(bill.getId());
			List<BillItemResponse> itemResponses = items.stream()
					.map(item -> new BillItemResponse(item.getId(), item.getProductId(), item.getQuantity(),
							item.getPrice(), item.getOriginalPrice(), item.getDiscountPercent(),
							item.getDiscountReason(), item.getBelowCost()))
					.collect(Collectors.toList());
			return new BillResponse(bill.getId(), bill.getCashierId(), bill.getTotalAmount(),
					bill.getSubtotal(), bill.getTotalDiscount(), bill.getStatus(),
					bill.getCancelledAt(), bill.getCreatedAt(), itemResponses);
		}).collect(Collectors.toList());
	}
}
