package com.optistock.dto;

import java.time.LocalDateTime;

import com.optistock.entity.StockMovementType;

public class StockMovementResponse {

	private Long id;
	private Long productId;
	private String productName;
	private StockMovementType type;
	private Integer quantityChange;
	private String reference;
	private String createdBy;
	private LocalDateTime createdAt;

	public StockMovementResponse() {
	}

	public StockMovementResponse(Long id, Long productId, String productName, StockMovementType type,
			Integer quantityChange, String reference, String createdBy, LocalDateTime createdAt) {
		this.id = id;
		this.productId = productId;
		this.productName = productName;
		this.type = type;
		this.quantityChange = quantityChange;
		this.reference = reference;
		this.createdBy = createdBy;
		this.createdAt = createdAt;
	}

	public Long getId() {
		return id;
	}

	public Long getProductId() {
		return productId;
	}

	public String getProductName() {
		return productName;
	}

	public StockMovementType getType() {
		return type;
	}

	public Integer getQuantityChange() {
		return quantityChange;
	}

	public String getReference() {
		return reference;
	}

	public String getCreatedBy() {
		return createdBy;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}
}
