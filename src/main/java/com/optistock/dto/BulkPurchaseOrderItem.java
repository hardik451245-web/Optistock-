package com.optistock.dto;

public class BulkPurchaseOrderItem {

	private Long productId;
	private Integer quantity;
	private String supplier;

	public BulkPurchaseOrderItem() {
	}

	public BulkPurchaseOrderItem(Long productId, Integer quantity, String supplier) {
		this.productId = productId;
		this.quantity = quantity;
		this.supplier = supplier;
	}

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

	public String getSupplier() {
		return supplier;
	}

	public void setSupplier(String supplier) {
		this.supplier = supplier;
	}
}
