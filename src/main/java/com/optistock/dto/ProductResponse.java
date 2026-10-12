package com.optistock.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.optistock.entity.ExpiryStatus;

public class ProductResponse {

	private Long id;
	private String name;
	private String brand;
	private String category;
	private String productType;
	private boolean needsProductTypeFix;
	private BigDecimal costPrice;
	private BigDecimal sellingPrice;
	private Integer stockQuantity;
	private Integer reorderThreshold;
	private LocalDate expiryDate;
	private BigDecimal effectivePrice;
	private BigDecimal discountPercent;
	private long daysLeft;
	private ExpiryStatus expiryStatus;
	private Integer onOrderQuantity;

	public ProductResponse(Long id, String name, String brand, String category, BigDecimal costPrice,
			BigDecimal sellingPrice, Integer stockQuantity, Integer reorderThreshold, LocalDate expiryDate,
			BigDecimal effectivePrice, BigDecimal discountPercent, long daysLeft, ExpiryStatus expiryStatus) {
		this(id, name, brand, category, category, costPrice, sellingPrice, stockQuantity, reorderThreshold, expiryDate,
				effectivePrice, discountPercent, daysLeft, expiryStatus, 0);
	}

	public ProductResponse(Long id, String name, String brand, String category, BigDecimal costPrice,
			BigDecimal sellingPrice, Integer stockQuantity, Integer reorderThreshold, LocalDate expiryDate,
			BigDecimal effectivePrice, BigDecimal discountPercent, long daysLeft, ExpiryStatus expiryStatus,
			Integer onOrderQuantity) {
		this(id, name, brand, category, category, costPrice, sellingPrice, stockQuantity, reorderThreshold, expiryDate,
				effectivePrice, discountPercent, daysLeft, expiryStatus, onOrderQuantity);
	}

	public ProductResponse(Long id, String name, String brand, String category, String productType, BigDecimal costPrice,
			BigDecimal sellingPrice, Integer stockQuantity, Integer reorderThreshold, LocalDate expiryDate,
			BigDecimal effectivePrice, BigDecimal discountPercent, long daysLeft, ExpiryStatus expiryStatus,
			Integer onOrderQuantity) {
		this.id = id;
		this.name = name;
		this.brand = brand;
		this.category = category;
		this.productType = (productType != null && !productType.isBlank()) ? productType : category;
		this.needsProductTypeFix = productType == null || productType.trim().equalsIgnoreCase(category != null ? category.trim() : "");
		this.costPrice = costPrice;
		this.sellingPrice = sellingPrice;
		this.stockQuantity = stockQuantity;
		this.reorderThreshold = reorderThreshold;
		this.expiryDate = expiryDate;
		this.effectivePrice = effectivePrice;
		this.discountPercent = discountPercent;
		this.daysLeft = daysLeft;
		this.expiryStatus = expiryStatus;
		this.onOrderQuantity = onOrderQuantity != null ? onOrderQuantity : 0;
	}

	public String getProductType() {
		return productType;
	}

	public boolean isNeedsProductTypeFix() {
		return needsProductTypeFix;
	}

	public Integer getOnOrderQuantity() {
		return onOrderQuantity != null ? onOrderQuantity : 0;
	}

	public Long getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	public String getBrand() {
		return brand;
	}

	public String getCategory() {
		return category;
	}

	public BigDecimal getCostPrice() {
		return costPrice;
	}

	public BigDecimal getSellingPrice() {
		return sellingPrice;
	}

	public Integer getStockQuantity() {
		return stockQuantity;
	}

	public Integer getReorderThreshold() {
		return reorderThreshold;
	}

	public LocalDate getExpiryDate() {
		return expiryDate;
	}

	public BigDecimal getEffectivePrice() {
		return effectivePrice;
	}

	public BigDecimal getDiscountPercent() {
		return discountPercent;
	}

	public long getDaysLeft() {
		return daysLeft;
	}

	public ExpiryStatus getExpiryStatus() {
		return expiryStatus;
	}
}
