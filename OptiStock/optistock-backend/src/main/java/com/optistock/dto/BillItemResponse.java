package com.optistock.dto;

import java.math.BigDecimal;

public class BillItemResponse {

	private Long id;
	private Long productId;
	private Integer quantity;
	private BigDecimal price;
	private BigDecimal originalPrice;
	private BigDecimal discountPercent;
	private String discountReason;
	private Boolean belowCost;

	public BillItemResponse(Long id, Long productId, Integer quantity, BigDecimal price,
			BigDecimal originalPrice, BigDecimal discountPercent, String discountReason, Boolean belowCost) {
		this.id = id;
		this.productId = productId;
		this.quantity = quantity;
		this.price = price;
		this.originalPrice = originalPrice;
		this.discountPercent = discountPercent;
		this.discountReason = discountReason;
		this.belowCost = belowCost;
	}

	public Long getId() {
		return id;
	}

	public Long getProductId() {
		return productId;
	}

	public Integer getQuantity() {
		return quantity;
	}

	public BigDecimal getPrice() {
		return price;
	}

	public BigDecimal getOriginalPrice() {
		return originalPrice;
	}

	public BigDecimal getDiscountPercent() {
		return discountPercent;
	}

	public String getDiscountReason() {
		return discountReason;
	}

	public Boolean getBelowCost() {
		return belowCost;
	}
}
