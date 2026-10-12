package com.optistock.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.optistock.entity.DiscountRequestStatus;

public class DiscountRequestResponse {

	private Long id;
	private Long cashierId;
	private Long productId;
	private BigDecimal requestedPercent;
	private DiscountRequestStatus status;
	private Long decidedBy;
	private LocalDateTime createdAt;
	private LocalDateTime decidedAt;

	public DiscountRequestResponse(Long id, Long cashierId, Long productId, BigDecimal requestedPercent,
			DiscountRequestStatus status, Long decidedBy, LocalDateTime createdAt, LocalDateTime decidedAt) {
		this.id = id;
		this.cashierId = cashierId;
		this.productId = productId;
		this.requestedPercent = requestedPercent;
		this.status = status;
		this.decidedBy = decidedBy;
		this.createdAt = createdAt;
		this.decidedAt = decidedAt;
	}

	public Long getId() {
		return id;
	}

	public Long getCashierId() {
		return cashierId;
	}

	public Long getProductId() {
		return productId;
	}

	public BigDecimal getRequestedPercent() {
		return requestedPercent;
	}

	public DiscountRequestStatus getStatus() {
		return status;
	}

	public Long getDecidedBy() {
		return decidedBy;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public LocalDateTime getDecidedAt() {
		return decidedAt;
	}
}
