package com.optistock.dto;

import java.math.BigDecimal;

public class CreateDiscountRequestRequest {

	private Long productId;
	private BigDecimal requestedPercent;

	public CreateDiscountRequestRequest() {
	}

	public CreateDiscountRequestRequest(Long productId, BigDecimal requestedPercent) {
		this.productId = productId;
		this.requestedPercent = requestedPercent;
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
}
