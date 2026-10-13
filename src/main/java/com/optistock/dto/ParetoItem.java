package com.optistock.dto;

import java.math.BigDecimal;

public class ParetoItem {

	private Long productId;
	private String name;
	private String category;
	private String brand;
	private Integer currentStock;
	private Integer reorderThreshold;
	private Integer qtySold;
	private BigDecimal revenue;
	private BigDecimal profit;
	private BigDecimal marginPercent;
	private BigDecimal sharePercent;
	private BigDecimal cumulativePercent;
	private String classification; // "A", "B", "C"
	private Boolean isUnderstocked;
	private Boolean isOverstocked;
	private Integer suggestedReorderQty;

	public ParetoItem() {
	}

	public ParetoItem(Long productId, String name, String brand, String category, Integer currentStock,
			Integer reorderThreshold, long qtySold, BigDecimal revenue, BigDecimal profit, BigDecimal marginPercent) {
		this.productId = productId;
		this.name = name;
		this.brand = brand;
		this.category = category;
		this.currentStock = currentStock;
		this.reorderThreshold = reorderThreshold;
		this.qtySold = (int) qtySold;
		this.revenue = revenue;
		this.profit = profit;
		this.marginPercent = marginPercent;
	}

	public void setCumulativeProfitPercent(BigDecimal cumulativePercent) {
		this.cumulativePercent = cumulativePercent;
	}

	public void setRecommendation(String recommendation) {
	}

	public Long getProductId() {
		return productId;
	}

	public void setProductId(Long productId) {
		this.productId = productId;
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

	public Integer getCurrentStock() {
		return currentStock;
	}

	public void setCurrentStock(Integer currentStock) {
		this.currentStock = currentStock;
	}

	public Integer getReorderThreshold() {
		return reorderThreshold;
	}

	public void setReorderThreshold(Integer reorderThreshold) {
		this.reorderThreshold = reorderThreshold;
	}

	public Integer getQtySold() {
		return qtySold;
	}

	public void setQtySold(Integer qtySold) {
		this.qtySold = qtySold;
	}

	public BigDecimal getRevenue() {
		return revenue;
	}

	public void setRevenue(BigDecimal revenue) {
		this.revenue = revenue;
	}

	public BigDecimal getProfit() {
		return profit;
	}

	public void setProfit(BigDecimal profit) {
		this.profit = profit;
	}

	public BigDecimal getMarginPercent() {
		return marginPercent;
	}

	public void setMarginPercent(BigDecimal marginPercent) {
		this.marginPercent = marginPercent;
	}

	public BigDecimal getSharePercent() {
		return sharePercent;
	}

	public void setSharePercent(BigDecimal sharePercent) {
		this.sharePercent = sharePercent;
	}

	public BigDecimal getCumulativePercent() {
		return cumulativePercent;
	}

	public void setCumulativePercent(BigDecimal cumulativePercent) {
		this.cumulativePercent = cumulativePercent;
	}

	public String getClassification() {
		return classification;
	}

	public void setClassification(String classification) {
		this.classification = classification;
	}

	public Boolean getIsUnderstocked() {
		return isUnderstocked != null ? isUnderstocked : false;
	}

	public void setIsUnderstocked(Boolean isUnderstocked) {
		this.isUnderstocked = isUnderstocked;
	}

	public Boolean getIsOverstocked() {
		return isOverstocked != null ? isOverstocked : false;
	}

	public void setIsOverstocked(Boolean isOverstocked) {
		this.isOverstocked = isOverstocked;
	}

	public Integer getSuggestedReorderQty() {
		return suggestedReorderQty != null ? suggestedReorderQty : 0;
	}

	public void setSuggestedReorderQty(Integer suggestedReorderQty) {
		this.suggestedReorderQty = suggestedReorderQty;
	}
}
