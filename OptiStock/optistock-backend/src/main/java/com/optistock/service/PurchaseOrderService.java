package com.optistock.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.optistock.dto.BulkPurchaseOrderItem;
import com.optistock.dto.CreatePurchaseOrderRequest;
import com.optistock.dto.PurchaseOrderResponse;
import com.optistock.dto.ReceivePurchaseOrderRequest;
import com.optistock.entity.Product;
import com.optistock.entity.PurchaseOrder;
import com.optistock.entity.PurchaseOrderStatus;
import com.optistock.entity.StockMovement;
import com.optistock.entity.StockMovementType;
import com.optistock.entity.Supplier;
import com.optistock.exception.ResourceNotFoundException;
import com.optistock.exception.StockConflictException;
import com.optistock.repository.ProductRepository;
import com.optistock.repository.PurchaseOrderRepository;
import com.optistock.repository.StockMovementRepository;
import com.optistock.repository.SupplierRepository;

@Service
public class PurchaseOrderService {

	private final PurchaseOrderRepository purchaseOrderRepository;
	private final ProductRepository productRepository;
	private final StockMovementRepository stockMovementRepository;
	private final SupplierRepository supplierRepository;
	private final java.time.Clock clock;

	@org.springframework.beans.factory.annotation.Autowired
	public PurchaseOrderService(PurchaseOrderRepository purchaseOrderRepository,
			ProductRepository productRepository, StockMovementRepository stockMovementRepository,
			SupplierRepository supplierRepository,
			java.time.Clock clock) {
		this.purchaseOrderRepository = purchaseOrderRepository;
		this.productRepository = productRepository;
		this.stockMovementRepository = stockMovementRepository;
		this.supplierRepository = supplierRepository;
		this.clock = clock != null ? clock : java.time.Clock.system(java.time.ZoneId.of("Asia/Kolkata"));
	}

	public PurchaseOrderService(PurchaseOrderRepository purchaseOrderRepository,
			ProductRepository productRepository, StockMovementRepository stockMovementRepository,
			SupplierRepository supplierRepository) {
		this(purchaseOrderRepository, productRepository, stockMovementRepository, supplierRepository, java.time.Clock.system(java.time.ZoneId.of("Asia/Kolkata")));
	}

	public PurchaseOrderService(PurchaseOrderRepository purchaseOrderRepository,
			ProductRepository productRepository, StockMovementRepository stockMovementRepository) {
		this(purchaseOrderRepository, productRepository, stockMovementRepository, null, java.time.Clock.system(java.time.ZoneId.of("Asia/Kolkata")));
	}

	@Transactional
	public PurchaseOrderResponse createOrder(CreatePurchaseOrderRequest request, String orderedBy) {
		if (request.getProductId() == null) {
			throw new IllegalArgumentException("productId is required");
		}
		if (request.getQuantity() == null || request.getQuantity() <= 0) {
			throw new IllegalArgumentException("Quantity must be greater than 0");
		}

		Product product = productRepository.findById(request.getProductId())
				.orElseThrow(() -> new ResourceNotFoundException("Product " + request.getProductId() + " not found"));

		if (!Boolean.TRUE.equals(product.getActive())) {
			throw new IllegalArgumentException("Cannot create purchase order for inactive product");
		}

		PurchaseOrder po = new PurchaseOrder();
		po.setProductId(product.getId());
		po.setQuantity(request.getQuantity());

		Long requestedSupplierId = request.getSupplierId();
		po.setSupplierId(requestedSupplierId);

		Supplier supplier = null;
		if (requestedSupplierId != null && supplierRepository != null) {
			supplier = supplierRepository.findById(requestedSupplierId).orElse(null);
		}

		if (supplier != null) {
			po.setSupplier(supplier.getName());
			po.setSupplierPhone(supplier.getPhone());
			po.setSupplierWhatsapp(supplier.getWhatsappNumber() != null && !supplier.getWhatsappNumber().isBlank()
					? supplier.getWhatsappNumber()
					: supplier.getPhone());
			po.setSupplierEmail(supplier.getEmail());
		} else if (request.getSupplier() != null && !request.getSupplier().isBlank()) {
			po.setSupplier(request.getSupplier());
			po.setSupplierPhone(request.getSupplierPhone());
			po.setSupplierWhatsapp(request.getSupplierWhatsapp());
			po.setSupplierEmail(request.getSupplierEmail());
		} else {
			po.setSupplier("General Supplier");
		}

		po.setUnitCost(request.getUnitCost() != null ? request.getUnitCost() : product.getCostPrice());

		BigDecimal totalCost = request.getTotalCost();
		if (totalCost == null && po.getUnitCost() != null) {
			totalCost = po.getUnitCost().multiply(BigDecimal.valueOf(request.getQuantity()));
		}
		po.setTotalCost(totalCost);
		po.setExpectedDeliveryDate(request.getExpectedDeliveryDate());
		po.setNotes(request.getNotes());

		if (Boolean.TRUE.equals(request.getIsSuggested())
				|| request.getStatus() == PurchaseOrderStatus.PENDING
				|| request.getStatus() == PurchaseOrderStatus.SUGGESTED) {
			po.setStatus(PurchaseOrderStatus.PENDING);
		} else {
			po.setStatus(PurchaseOrderStatus.ORDERED);
		}

		po.setOrderedBy(orderedBy);
		po.setOrderedAt(LocalDateTime.now(clock));

		po = purchaseOrderRepository.save(po);
		if (po.getPoNumber() == null || po.getPoNumber().startsWith("PO-PENDING")) {
			po.setPoNumber("PO-" + (1000 + po.getId()));
			po = purchaseOrderRepository.save(po);
		}

		return toResponse(po, product.getName());
	}

	@Transactional
	public PurchaseOrderResponse approveOrder(Long id, Long supplierId, String approvedBy) {
		PurchaseOrder po = purchaseOrderRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Purchase order not found: " + id));

		po.setStatus(PurchaseOrderStatus.ORDERED);
		po.setApprovedAt(LocalDateTime.now(clock));
		po.setApprovedBy(approvedBy);

		if (supplierId != null) {
			po.setSupplierId(supplierId);
		}

		if (po.getSupplierId() != null && supplierRepository != null) {
			Supplier sup = supplierRepository.findById(po.getSupplierId()).orElse(null);
			if (sup != null) {
				po.setSupplier(sup.getName());
				if (sup.getPhone() != null && !sup.getPhone().isBlank()) {
					po.setSupplierPhone(sup.getPhone());
				}
				if (sup.getWhatsappNumber() != null && !sup.getWhatsappNumber().isBlank()) {
					po.setSupplierWhatsapp(sup.getWhatsappNumber());
				} else if (sup.getPhone() != null && !sup.getPhone().isBlank()) {
					po.setSupplierWhatsapp(sup.getPhone());
				}
				if (sup.getEmail() != null && !sup.getEmail().isBlank()) {
					po.setSupplierEmail(sup.getEmail());
				}
			}
		}

		po = purchaseOrderRepository.save(po);

		Product product = productRepository.findById(po.getProductId()).orElse(null);
		return toResponse(po, product != null ? product.getName() : "Product #" + po.getProductId());
	}

	@Transactional
	public PurchaseOrderResponse approveOrder(Long id, String approvedBy) {
		return approveOrder(id, null, approvedBy);
	}

	@Transactional
	public PurchaseOrderResponse markOrdered(Long id, String channel, String orderedBy) {
		PurchaseOrder po = purchaseOrderRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Purchase order not found: " + id));

		po.setStatus(PurchaseOrderStatus.ORDERED);
		po.setSentAt(LocalDateTime.now(clock));
		po.setSentChannel(channel != null ? channel : "MANUAL");
		if (orderedBy != null) {
			po.setOrderedBy(orderedBy);
		}
		if (po.getPoNumber() == null) {
			po.setPoNumber("PO-" + (1000 + po.getId()));
		}
		po = purchaseOrderRepository.save(po);

		Product product = productRepository.findById(po.getProductId()).orElse(null);
		return toResponse(po, product != null ? product.getName() : "Product #" + po.getProductId());
	}

	@Transactional
	public List<PurchaseOrderResponse> createBulkOrders(List<BulkPurchaseOrderItem> items, String orderedBy) {
		if (items == null || items.isEmpty()) {
			throw new IllegalArgumentException("Items list cannot be empty");
		}

		List<PurchaseOrderResponse> responses = new ArrayList<>();
		for (BulkPurchaseOrderItem item : items) {
			if (item.getProductId() != null && item.getQuantity() != null && item.getQuantity() > 0) {
				CreatePurchaseOrderRequest req = new CreatePurchaseOrderRequest(
						item.getProductId(), item.getQuantity(), item.getSupplier());
				req.setSupplierId(item.getSupplierId());
				req.setUnitCost(item.getUnitCost());
				req.setTotalCost(item.getTotalCost());
				req.setExpectedDeliveryDate(item.getExpectedDeliveryDate());
				req.setNotes(item.getNotes());
				req.setIsSuggested(item.getIsSuggested());
				responses.add(createOrder(req, orderedBy));
			}
		}
		return responses;
	}

	@Transactional(readOnly = true)
	public List<PurchaseOrderResponse> listOrders(PurchaseOrderStatus status) {
		List<PurchaseOrder> orders;
		if (status == PurchaseOrderStatus.PENDING || status == PurchaseOrderStatus.SUGGESTED) {
			orders = purchaseOrderRepository.findAllByOrderByOrderedAtDesc().stream()
					.filter(o -> o.getStatus() == PurchaseOrderStatus.PENDING || o.getStatus() == PurchaseOrderStatus.SUGGESTED)
					.collect(Collectors.toList());
		} else if (status == PurchaseOrderStatus.ORDERED || status == PurchaseOrderStatus.APPROVED) {
			orders = purchaseOrderRepository.findAllByOrderByOrderedAtDesc().stream()
					.filter(o -> o.getStatus() == PurchaseOrderStatus.ORDERED || o.getStatus() == PurchaseOrderStatus.APPROVED)
					.collect(Collectors.toList());
		} else if (status != null) {
			orders = purchaseOrderRepository.findByStatusOrderByOrderedAtDesc(status);
		} else {
			orders = purchaseOrderRepository.findAllByOrderByOrderedAtDesc();
		}

		Map<Long, String> productNames = productRepository.findAll().stream()
				.collect(Collectors.toMap(Product::getId, Product::getName, (a, b) -> a));

		Map<Long, Supplier> suppliersById = supplierRepository != null
				? supplierRepository.findAll().stream().collect(Collectors.toMap(Supplier::getId, s -> s, (a, b) -> a))
				: java.util.Collections.emptyMap();

		return orders.stream()
				.map(po -> {
					if (po.getSupplierId() != null && suppliersById.containsKey(po.getSupplierId())) {
						Supplier s = suppliersById.get(po.getSupplierId());
						if (po.getSupplier() == null || po.getSupplier().isBlank() || "General Supplier".equals(po.getSupplier())) {
							po.setSupplier(s.getName());
						}
						if (po.getSupplierPhone() == null || po.getSupplierPhone().isBlank()) {
							po.setSupplierPhone(s.getPhone());
						}
						if (po.getSupplierWhatsapp() == null || po.getSupplierWhatsapp().isBlank()) {
							po.setSupplierWhatsapp(s.getWhatsappNumber() != null && !s.getWhatsappNumber().isBlank()
									? s.getWhatsappNumber()
									: s.getPhone());
						}
						if (po.getSupplierEmail() == null || po.getSupplierEmail().isBlank()) {
							po.setSupplierEmail(s.getEmail());
						}
					}
					return toResponse(po, productNames.getOrDefault(po.getProductId(), "Unknown Product"));
				})
				.collect(Collectors.toList());
	}

	@Transactional
	public PurchaseOrderResponse receiveOrder(Long id, ReceivePurchaseOrderRequest request, String receivedBy) {
		PurchaseOrder po = purchaseOrderRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Purchase order not found: " + id));

		if (po.getStatus() == PurchaseOrderStatus.RECEIVED) {
			throw new StockConflictException("Purchase order is already received");
		}
		if (po.getStatus() == PurchaseOrderStatus.CANCELLED) {
			throw new IllegalArgumentException("Cannot receive a cancelled purchase order");
		}

		Long targetProductId = po.getProductId();
		Product product = productRepository.findById(targetProductId)
				.orElseThrow(() -> new ResourceNotFoundException("Product " + targetProductId + " not found"));

		int qtyToReceive = (request != null && request.getReceivedQuantity() != null && request.getReceivedQuantity() > 0)
				? request.getReceivedQuantity()
				: po.getQuantity();

		LocalDate today = LocalDate.now(clock);

		// Perishables batch expiry rule
		if (product.getExpiryDate() != null) {
			LocalDate newExpiry = (request != null && request.getNewExpiryDate() != null)
					? request.getNewExpiryDate()
					: (product.getExpiryDate().isBefore(today) ? today.plusDays(30) : product.getExpiryDate());

			int currentStock = product.getStockQuantity() == null ? 0 : product.getStockQuantity();
			boolean isExpired = product.getExpiryDate().isBefore(today);

			if (currentStock <= 0 || isExpired) {
				product.setExpiryDate(newExpiry);
			} else {
				if (newExpiry.isBefore(product.getExpiryDate())) {
					product.setExpiryDate(newExpiry);
				}
			}
		}

		int currentStock = product.getStockQuantity() == null ? 0 : product.getStockQuantity();
		product.setStockQuantity(currentStock + qtyToReceive);
		productRepository.save(product);

		LocalDateTime now = LocalDateTime.now(clock);
		po.setStatus(PurchaseOrderStatus.RECEIVED);
		po.setReceivedQuantity(qtyToReceive);
		po.setReceivedAt(now);
		po = purchaseOrderRepository.save(po);

		// Record PURCHASE stock movement
		StockMovement movement = new StockMovement(
				product.getId(),
				StockMovementType.PURCHASE,
				qtyToReceive,
				"PO #" + (po.getPoNumber() != null ? po.getPoNumber() : po.getId()),
				receivedBy,
				now);
		stockMovementRepository.save(movement);

		return toResponse(po, product.getName());
	}

	@Transactional
	public PurchaseOrderResponse cancelOrder(Long id) {
		PurchaseOrder po = purchaseOrderRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Purchase order not found: " + id));

		if (po.getStatus() == PurchaseOrderStatus.RECEIVED) {
			throw new StockConflictException("Cannot cancel an already received purchase order");
		}

		po.setStatus(PurchaseOrderStatus.CANCELLED);
		po = purchaseOrderRepository.save(po);

		Product product = productRepository.findById(po.getProductId()).orElse(null);
		String productName = product != null ? product.getName() : "Unknown Product";
		return toResponse(po, productName);
	}

	private PurchaseOrderResponse toResponse(PurchaseOrder po, String productName) {
		PurchaseOrderResponse res = new PurchaseOrderResponse(
				po.getId(),
				po.getProductId(),
				productName,
				po.getQuantity(),
				po.getSupplier(),
				po.getStatus(),
				po.getOrderedBy(),
				po.getOrderedAt(),
				po.getReceivedAt(),
				po.getReceivedQuantity());

		res.setPoNumber(po.getPoNumber() != null ? po.getPoNumber() : ("PO-" + (1000 + po.getId())));
		res.setExpectedDeliveryDate(po.getExpectedDeliveryDate());
		res.setUnitCost(po.getUnitCost());
		res.setTotalCost(po.getTotalCost());
		res.setNotes(po.getNotes());
		res.setSupplierId(po.getSupplierId());
		res.setSupplierPhone(po.getSupplierPhone());
		res.setSupplierWhatsapp(po.getSupplierWhatsapp());
		res.setSupplierEmail(po.getSupplierEmail());
		res.setSentAt(po.getSentAt());
		res.setSentChannel(po.getSentChannel());
		res.setApprovedAt(po.getApprovedAt());
		res.setApprovedBy(po.getApprovedBy());

		// Ensure supplier fields are loaded from supplier relation if supplierId is present
		if (po.getSupplierId() != null && supplierRepository != null
				&& (res.getSupplierPhone() == null || res.getSupplierEmail() == null || "General Supplier".equals(res.getSupplier()))) {
			supplierRepository.findById(po.getSupplierId()).ifPresent(sup -> {
				res.setSupplier(sup.getName());
				if (res.getSupplierPhone() == null || res.getSupplierPhone().isBlank()) {
					res.setSupplierPhone(sup.getPhone());
				}
				if (res.getSupplierWhatsapp() == null || res.getSupplierWhatsapp().isBlank()) {
					res.setSupplierWhatsapp(sup.getWhatsappNumber() != null && !sup.getWhatsappNumber().isBlank()
							? sup.getWhatsappNumber()
							: sup.getPhone());
				}
				if (res.getSupplierEmail() == null || res.getSupplierEmail().isBlank()) {
					res.setSupplierEmail(sup.getEmail());
				}
			});
		}

		return res;
	}
}
