package com.optistock.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.optistock.dto.CreateDiscountRequestRequest;
import com.optistock.dto.DiscountRequestResponse;
import com.optistock.entity.DiscountRequest;
import com.optistock.entity.DiscountRequestStatus;
import com.optistock.exception.ResourceNotFoundException;
import com.optistock.repository.DiscountRequestRepository;
import com.optistock.repository.ProductRepository;

@Service
public class DiscountRequestService {

	private final DiscountRequestRepository discountRequestRepository;
	private final ProductRepository productRepository;

	public DiscountRequestService(DiscountRequestRepository discountRequestRepository,
			ProductRepository productRepository) {
		this.discountRequestRepository = discountRequestRepository;
		this.productRepository = productRepository;
	}

	@Transactional
	public DiscountRequestResponse createRequest(Long cashierId, CreateDiscountRequestRequest request) {
		if (request.getProductId() == null) {
			throw new IllegalArgumentException("productId is required");
		}
		if (request.getRequestedPercent() == null || request.getRequestedPercent().compareTo(java.math.BigDecimal.ZERO) <= 0) {
			throw new IllegalArgumentException("requestedPercent must be greater than 0");
		}
		if (!productRepository.existsById(request.getProductId())) {
			throw new ResourceNotFoundException("Product " + request.getProductId() + " not found");
		}

		DiscountRequest discountRequest = new DiscountRequest();
		discountRequest.setCashierId(cashierId);
		discountRequest.setProductId(request.getProductId());
		discountRequest.setRequestedPercent(request.getRequestedPercent());
		discountRequest.setStatus(DiscountRequestStatus.PENDING);
		discountRequest = discountRequestRepository.save(discountRequest);

		return toResponse(discountRequest);
	}

	@Transactional(readOnly = true)
	public List<DiscountRequestResponse> getPendingRequests() {
		return discountRequestRepository.findByStatus(DiscountRequestStatus.PENDING)
				.stream()
				.map(this::toResponse)
				.collect(Collectors.toList());
	}

	@Transactional
	public DiscountRequestResponse approveRequest(Long id, Long managerId) {
		DiscountRequest discountRequest = discountRequestRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Discount request not found: " + id));

		discountRequest.setStatus(DiscountRequestStatus.APPROVED);
		discountRequest.setDecidedBy(managerId);
		discountRequest.setDecidedAt(LocalDateTime.now());
		discountRequest = discountRequestRepository.save(discountRequest);

		return toResponse(discountRequest);
	}

	@Transactional
	public DiscountRequestResponse rejectRequest(Long id, Long managerId) {
		DiscountRequest discountRequest = discountRequestRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Discount request not found: " + id));

		discountRequest.setStatus(DiscountRequestStatus.REJECTED);
		discountRequest.setDecidedBy(managerId);
		discountRequest.setDecidedAt(LocalDateTime.now());
		discountRequest = discountRequestRepository.save(discountRequest);

		return toResponse(discountRequest);
	}

	@Transactional(readOnly = true)
	public DiscountRequestResponse getRequestById(Long id) {
		DiscountRequest discountRequest = discountRequestRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Discount request not found: " + id));
		return toResponse(discountRequest);
	}

	private DiscountRequestResponse toResponse(DiscountRequest req) {
		return new DiscountRequestResponse(
				req.getId(),
				req.getCashierId(),
				req.getProductId(),
				req.getRequestedPercent(),
				req.getStatus(),
				req.getDecidedBy(),
				req.getCreatedAt(),
				req.getDecidedAt());
	}
}
