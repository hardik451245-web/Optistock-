package com.optistock.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "discount_requests")
public class DiscountRequest {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private Long cashierId;

	@Column(nullable = false)
	private Long productId;

	@Column(nullable = false, precision = 5, scale = 2)
	private BigDecimal requestedPercent;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private DiscountRequestStatus status = DiscountRequestStatus.PENDING;

	private Long decidedBy;

	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	private LocalDateTime decidedAt;

	public DiscountRequest() {
	}

	@PrePersist
	void onCreate() {
		if (createdAt == null) {
			createdAt = LocalDateTime.now();
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Long getCashierId() {
		return cashierId;
	}

	public void setCashierId(Long cashierId) {
		this.cashierId = cashierId;
	}

	public Long getProductId() {
		return productId;
	}

	public void setProductId(Long productId) {
		this.productId = productId;
	}

	public BigDecimal getRequestedPercent() {
		return requestedPercent;
	}

	public void setRequestedPercent(BigDecimal requestedPercent) {
		this.requestedPercent = requestedPercent;
	}

	public DiscountRequestStatus getStatus() {
		return status;
	}

	public void setStatus(DiscountRequestStatus status) {
		this.status = status;
	}

	public Long getDecidedBy() {
		return decidedBy;
	}

	public void setDecidedBy(Long decidedBy) {
		this.decidedBy = decidedBy;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}

	public LocalDateTime getDecidedAt() {
		return decidedAt;
	}

	public void setDecidedAt(LocalDateTime decidedAt) {
		this.decidedAt = decidedAt;
	}
}
