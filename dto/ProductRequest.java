package com.optistock.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ProductRequest {

	private String name;
	private String brand;
	private String category;
	private BigDecimal costPrice;
	private BigDecimal sellingPrice;
	private Integer stockQuantity;
	private Integer reorderThreshold;
	private LocalDate expiryDate;

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getBrand() {
		return brand;
	}

	public void setBrand(String brand) {
		this.brand = brand;
	}

	public String getCategory() {
		return category;
	}

	public void setCategory(String category) {
		this.category = category;
	}

	public BigDecimal getCostPrice() {
		return costPrice;
	}

	public void setCostPrice(BigDecimal costPrice) {
		this.costPrice = costPrice;
	}

	public BigDecimal getSellingPrice() {
		return sellingPrice;
	}

	public void setSellingPrice(BigDecimal sellingPrice) {
		this.sellingPrice = sellingPrice;
	}

	public Integer getStockQuantity() {
		return stockQuantity;
	}

	public void setStockQuantity(Integer stockQuantity) {
		this.stockQuantity = stockQuantity;
	}

	public Integer getReorderThreshold() {
		return reorderThreshold;
	}

	public void setReorderThreshold(Integer reorderThreshold) {
		this.reorderThreshold = reorderThreshold;
	}

	public LocalDate getExpiryDate() {
		return expiryDate;
	}

	public void setExpiryDate(LocalDate expiryDate) {
		this.expiryDate = expiryDate;
	}
}
