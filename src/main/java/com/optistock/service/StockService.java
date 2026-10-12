package com.optistock.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.optistock.dto.StockAdjustRequest;
import com.optistock.dto.StockMovementResponse;
import com.optistock.dto.StockWriteoffRequest;
import com.optistock.entity.Product;
import com.optistock.entity.StockMovement;
import com.optistock.entity.StockMovementType;
import com.optistock.exception.ResourceNotFoundException;
import com.optistock.repository.ProductRepository;
import com.optistock.repository.StockMovementRepository;

import jakarta.persistence.criteria.Predicate;

@Service
public class StockService {

	private final StockMovementRepository stockMovementRepository;
	private final ProductRepository productRepository;

	public StockService(StockMovementRepository stockMovementRepository, ProductRepository productRepository) {
		this.stockMovementRepository = stockMovementRepository;
		this.productRepository = productRepository;
	}

	@Transactional
	public StockMovementResponse adjustStock(StockAdjustRequest request, String createdBy) {
		if (request.getProductId() == null) {
			throw new IllegalArgumentException("productId is required");
		}
		if (request.getDelta() == null || request.getDelta() == 0) {
			throw new IllegalArgumentException("delta must not be zero");
		}
		if (request.getReason() == null || request.getReason().isBlank()) {
			throw new IllegalArgumentException("reason is required");
		}

		Product product = productRepository.findById(request.getProductId())
				.orElseThrow(() -> new ResourceNotFoundException("Product " + request.getProductId() + " not found"));

		int currentStock = product.getStockQuantity() == null ? 0 : product.getStockQuantity();
		int newStock = currentStock + request.getDelta();
		if (newStock < 0) {
			throw new IllegalArgumentException("Adjustment would cause stock to be negative (current: "
					+ currentStock + ", delta: " + request.getDelta() + ")");
		}

		product.setStockQuantity(newStock);
		productRepository.save(product);

		LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
		StockMovement movement = new StockMovement(
				product.getId(),
				StockMovementType.ADJUSTMENT,
				request.getDelta(),
				request.getReason().trim(),
				createdBy,
				now);
		movement = stockMovementRepository.save(movement);

		return toResponse(movement, product.getName());
	}

	@Transactional
	public StockMovementResponse writeOffStock(StockWriteoffRequest request, String createdBy) {
		if (request.getProductId() == null) {
			throw new IllegalArgumentException("productId is required");
		}
		if (request.getReason() == null || request.getReason().isBlank()) {
			throw new IllegalArgumentException("reason is required");
		}

		Product product = productRepository.findById(request.getProductId())
				.orElseThrow(() -> new ResourceNotFoundException("Product " + request.getProductId() + " not found"));

		int currentStock = product.getStockQuantity() == null ? 0 : product.getStockQuantity();
		product.setStockQuantity(0);
		productRepository.save(product);

		LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
		StockMovement movement = new StockMovement(
				product.getId(),
				StockMovementType.WRITE_OFF,
				-currentStock,
				request.getReason().trim(),
				createdBy,
				now);
		movement = stockMovementRepository.save(movement);

		return toResponse(movement, product.getName());
	}

	@Transactional(readOnly = true)
	public List<StockMovementResponse> getMovements(Long productId, StockMovementType type, LocalDate from, LocalDate to) {
		Specification<StockMovement> spec = (root, query, cb) -> {
			List<Predicate> predicates = new ArrayList<>();

			if (productId != null) {
				predicates.add(cb.equal(root.get("productId"), productId));
			}
			if (type != null) {
				predicates.add(cb.equal(root.get("type"), type));
			}
			if (from != null) {
				predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from.atStartOfDay()));
			}
			if (to != null) {
				predicates.add(cb.lessThan(root.get("createdAt"), to.plusDays(1).atStartOfDay()));
			}

			query.orderBy(cb.desc(root.get("createdAt")));
			return cb.and(predicates.toArray(new Predicate[0]));
		};

		List<StockMovement> movements = stockMovementRepository.findAll(spec);
		Map<Long, String> productNames = productRepository.findAll().stream()
				.collect(Collectors.toMap(Product::getId, Product::getName, (a, b) -> a));

		return movements.stream()
				.map(m -> toResponse(m, productNames.getOrDefault(m.getProductId(), "Unknown Product")))
				.collect(Collectors.toList());
	}

	private StockMovementResponse toResponse(StockMovement m, String productName) {
		return new StockMovementResponse(
				m.getId(),
				m.getProductId(),
				productName,
				m.getType(),
				m.getQuantityChange(),
				m.getReference(),
				m.getCreatedBy(),
				m.getCreatedAt());
	}
}
