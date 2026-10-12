package com.optistock.dto;

import java.math.BigDecimal;

public class BillLineRequest {

	private Long productId;
	private Integer quantity;
	private BigDecimal manualDiscountPercent;
	private Long approvedRequestId;

	public Long getProductId() {
		return productId;
	}

	public void setProductId(Long productId) {
		this.productId = productId;
	}

	public Integer getQuantity() {
		return quantity;
	}

	public void setQuantity(Integer quantity) {
		this.quantity = quantity;
	}

	public BigDecimal getManualDiscountPercent() {
		return manualDiscountPercent;
	}

	public void setManualDiscountPercent(BigDecimal manualDiscountPercent) {
		this.manualDiscountPercent = manualDiscountPercent;
	}

	public Long getApprovedRequestId() {
		return approvedRequestId;
	}

	public void setApprovedRequestId(Long approvedRequestId) {
		this.approvedRequestId = approvedRequestId;
	}
}
