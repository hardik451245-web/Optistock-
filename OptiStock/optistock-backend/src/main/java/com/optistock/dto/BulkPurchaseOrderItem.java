package com.optistock.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class BulkPurchaseOrderItem {

	private Long productId;
	private Integer quantity;
	private String supplier;
	private Long supplierId;
	private BigDecimal unitCost;
	private BigDecimal totalCost;
	private LocalDate expectedDeliveryDate;
	private String notes;
	private Boolean isSuggested = false;

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

	public Long getSupplierId() {
		return supplierId;
	}

	public void setSupplierId(Long supplierId) {
		this.supplierId = supplierId;
	}

	public BigDecimal getUnitCost() {
		return unitCost;
	}

	public void setUnitCost(BigDecimal unitCost) {
		this.unitCost = unitCost;
	}

	public BigDecimal getTotalCost() {
		return totalCost;
	}

	public void setTotalCost(BigDecimal totalCost) {
		this.totalCost = totalCost;
	}

	public LocalDate getExpectedDeliveryDate() {
		return expectedDeliveryDate;
	}

	public void setExpectedDeliveryDate(LocalDate expectedDeliveryDate) {
		this.expectedDeliveryDate = expectedDeliveryDate;
	}

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

	public Boolean getIsSuggested() {
		return isSuggested;
	}

	public void setIsSuggested(Boolean isSuggested) {
		this.isSuggested = isSuggested;
	}

	public String getSupplierName() {
		return supplier;
	}

	public void setSupplierName(String supplierName) {
		if (this.supplier == null || this.supplier.isBlank()) {
			this.supplier = supplierName;
		}
	}

	public BigDecimal getUnitCostPrice() {
		return unitCost;
	}

	public void setUnitCostPrice(BigDecimal unitCostPrice) {
		if (this.unitCost == null) {
			this.unitCost = unitCostPrice;
		}
	}
}
