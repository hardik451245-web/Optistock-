package com.optistock.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CreatePurchaseOrderRequest {

	private Long productId;
	private Integer quantity;
	private String supplier;
	private Long supplierId;
	private String supplierPhone;
	private String supplierWhatsapp;
	private String supplierEmail;
	private BigDecimal unitCost;
	private BigDecimal totalCost;
	private LocalDate expectedDeliveryDate;
	private String notes;
	private Boolean isSuggested = false;

	public CreatePurchaseOrderRequest() {
	}

	public CreatePurchaseOrderRequest(Long productId, Integer quantity, String supplier) {
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

	public String getSupplierPhone() {
		return supplierPhone;
	}

	public void setSupplierPhone(String supplierPhone) {
		this.supplierPhone = supplierPhone;
	}

	public String getSupplierWhatsapp() {
		return supplierWhatsapp;
	}

	public void setSupplierWhatsapp(String supplierWhatsapp) {
		this.supplierWhatsapp = supplierWhatsapp;
	}

	public String getSupplierEmail() {
		return supplierEmail;
	}

	public void setSupplierEmail(String supplierEmail) {
		this.supplierEmail = supplierEmail;
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
		return isSuggested != null ? isSuggested : false;
	}

	public void setIsSuggested(Boolean isSuggested) {
		this.isSuggested = isSuggested;
	}
}
