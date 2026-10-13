package com.optistock.dto;

public class StockAdjustRequest {

	private Long productId;
	private Integer delta;
	private String reason;

	public StockAdjustRequest() {
	}

	public StockAdjustRequest(Long productId, Integer delta, String reason) {
		this.productId = productId;
		this.delta = delta;
		this.reason = reason;
	}

	public Long getProductId() {
		return productId;
	}

	public void setProductId(Long productId) {
		this.productId = productId;
	}

	public Integer getDelta() {
		return delta;
	}

	public void setDelta(Integer delta) {
		this.delta = delta;
	}

	public String getReason() {
		return reason;
	}

	public void setReason(String reason) {
		this.reason = reason;
	}
}
