package com.optistock.dto;

import java.math.BigDecimal;
import java.util.List;

public class ProductMixResponse {

	private String productType;
	private String category;
	private int groupForecast30;
	private String recommendation;
	private List<ProductMixItem> items;

	public ProductMixResponse() {
	}

	public ProductMixResponse(String productType, String category, int groupForecast30,
			String recommendation, List<ProductMixItem> items) {
		this.productType = productType;
		this.category = category;
		this.groupForecast30 = groupForecast30;
		this.recommendation = recommendation;
		this.items = items;
	}

	public String getProductType() {
		return productType;
	}

	public String getCategory() {
		return category;
	}

	public int getGroupForecast30() {
		return groupForecast30;
	}

	public String getRecommendation() {
		return recommendation;
	}

	public List<ProductMixItem> getItems() {
		return items;
	}

	public static class ProductMixItem {
		private Long productId;
		private String name;
		private String brand;
		private long unitsSold;
		private BigDecimal profit;
		private BigDecimal marginPercent;
		private BigDecimal currentSharePercent;
		private BigDecimal suggestedSharePercent;
		private int targetUnits;
		private int unitsToOrder;
		private int stock;
		private int onOrderQuantity;

		public ProductMixItem() {
		}

		public ProductMixItem(Long productId, String name, String brand, long unitsSold,
				BigDecimal profit, BigDecimal marginPercent, BigDecimal currentSharePercent,
				BigDecimal suggestedSharePercent, int targetUnits, int unitsToOrder,
				int stock, int onOrderQuantity) {
			this.productId = productId;
			this.name = name;
			this.brand = brand;
			this.unitsSold = unitsSold;
			this.profit = profit;
			this.marginPercent = marginPercent;
			this.currentSharePercent = currentSharePercent;
			this.suggestedSharePercent = suggestedSharePercent;
			this.targetUnits = targetUnits;
			this.unitsToOrder = unitsToOrder;
			this.stock = stock;
			this.onOrderQuantity = onOrderQuantity;
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

		public long getUnitsSold() {
			return unitsSold;
		}

		public long getQtySold() {
			return unitsSold;
		}

		public BigDecimal getProfit() {
			return profit;
		}

		public BigDecimal getMarginPercent() {
			return marginPercent;
		}

		public BigDecimal getCurrentSharePercent() {
			return currentSharePercent;
		}

		public BigDecimal getSuggestedSharePercent() {
			return suggestedSharePercent;
		}

		public int getTargetUnits() {
			return targetUnits;
		}

		public int getUnitsToOrder() {
			return unitsToOrder;
		}

		public int getStock() {
			return stock;
		}

		public int getOnOrderQuantity() {
			return onOrderQuantity;
		}
	}
}
