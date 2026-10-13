package com.optistock.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ExpiringProductItem {

	private Long id;
	private String name;
	private String category;
	private String brand;
	private String batchNumber;
	private LocalDate expiryDate;
	private long daysLeft;
	private Integer stockQuantity;
	private BigDecimal costPrice;
	private BigDecimal originalPrice;
	private BigDecimal discountPercent;
	private BigDecimal discountedPrice;
	private BigDecimal suggestedDiscount;
	private BigDecimal riskValue;

	public ExpiringProductItem() {
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getCategory() {
		return category;
	}

	public void setCategory(String category) {
		this.category = category;
	}

	public String getBrand() {
		return brand;
	}

	public void setBrand(String brand) {
		this.brand = brand;
	}

	public String getBatchNumber() {
		return batchNumber;
	}

	public void setBatchNumber(String batchNumber) {
		this.batchNumber = batchNumber;
	}

	public LocalDate getExpiryDate() {
		return expiryDate;
	}

	public void setExpiryDate(LocalDate expiryDate) {
		this.expiryDate = expiryDate;
	}

	public long getDaysLeft() {
		return daysLeft;
	}

	public void setDaysLeft(long daysLeft) {
		this.daysLeft = daysLeft;
	}

	public Integer getStockQuantity() {
		return stockQuantity;
	}

	public void setStockQuantity(Integer stockQuantity) {
		this.stockQuantity = stockQuantity;
	}

	public BigDecimal getCostPrice() {
		return costPrice;
	}

	public void setCostPrice(BigDecimal costPrice) {
		this.costPrice = costPrice;
	}

	public BigDecimal getOriginalPrice() {
		return originalPrice;
	}

	public void setOriginalPrice(BigDecimal originalPrice) {
		this.originalPrice = originalPrice;
	}

	public BigDecimal getDiscountPercent() {
		return discountPercent;
	}

	public void setDiscountPercent(BigDecimal discountPercent) {
		this.discountPercent = discountPercent;
	}

	public BigDecimal getDiscountedPrice() {
		return discountedPrice;
	}

	public void setDiscountedPrice(BigDecimal discountedPrice) {
		this.discountedPrice = discountedPrice;
	}

	public BigDecimal getSuggestedDiscount() {
		return suggestedDiscount;
	}

	public void setSuggestedDiscount(BigDecimal suggestedDiscount) {
		this.suggestedDiscount = suggestedDiscount;
	}

	public BigDecimal getRiskValue() {
		return riskValue;
	}

	public void setRiskValue(BigDecimal riskValue) {
		this.riskValue = riskValue;
	}
}
