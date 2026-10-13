package com.optistock.dto;

import java.math.BigDecimal;

public class RankingItem {

	private int rank;
	private Long productId;
	private String name;
	private String brand;
	private String category;
	private long qtySold;
	private BigDecimal revenue;
	private BigDecimal profit;
	private BigDecimal marginPercent;

	public RankingItem(int rank, Long productId, String name, String brand, String category,
			long qtySold, BigDecimal revenue, BigDecimal profit, BigDecimal marginPercent) {
		this.rank = rank;
		this.productId = productId;
		this.name = name;
		this.brand = brand;
		this.category = category;
		this.qtySold = qtySold;
		this.revenue = revenue;
		this.profit = profit;
		this.marginPercent = marginPercent;
	}

	public int getRank() {
		return rank;
	}

	public Long getId() {
		return productId;
	}

	public Long getProductId() {
		return productId;
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

	public long getQtySold() {
		return qtySold;
	}

	public BigDecimal getRevenue() {
		return revenue;
	}

	public BigDecimal getProfit() {
		return profit;
	}

	public BigDecimal getMarginPercent() {
		return marginPercent;
	}
}
