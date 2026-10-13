package com.optistock.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class ProductMixResponse {

	private String productType;
	private String category;
	private int period = 30;
	private int groupForecast30;
	private int groupStock;
	private int groupOnOrder;
	private int groupNeed;
	private String recommendation;
	private String sentence;
	private List<ProductMixItem> brands = new ArrayList<>();

	public ProductMixResponse() {
	}

	public ProductMixResponse(String productType, String category, int groupForecast30,
			String recommendation, List<ProductMixItem> brands) {
		this(productType, category, 30, groupForecast30, 0, 0, 0, recommendation, brands);
	}

	public ProductMixResponse(String productType, String category, int period, int groupForecast30,
			int groupStock, int groupOnOrder, int groupNeed, String sentence, List<ProductMixItem> brands) {
		this(productType, category, period, groupForecast30, groupStock, groupOnOrder, groupNeed, sentence, sentence, brands);
	}

	public ProductMixResponse(String productType, String category, int period, int groupForecast30,
			int groupStock, int groupOnOrder, int groupNeed, String recommendation, String sentence, List<ProductMixItem> brands) {
		this.productType = productType;
		this.category = category;
		this.period = period;
		this.groupForecast30 = groupForecast30;
		this.groupStock = groupStock;
		this.groupOnOrder = groupOnOrder;
		this.groupNeed = groupNeed;
		this.recommendation = recommendation;
		this.sentence = sentence;
		this.brands = brands != null ? brands : new ArrayList<>();
	}

	public String getProductType() {
		return productType;
	}

	public void setProductType(String productType) {
		this.productType = productType;
	}

	public String getCategory() {
		return category;
	}

	public void setCategory(String category) {
		this.category = category;
	}

	public int getPeriod() {
		return period;
	}

	public void setPeriod(int period) {
		this.period = period;
	}

	public int getGroupForecast30() {
		return groupForecast30;
	}

	public void setGroupForecast30(int groupForecast30) {
		this.groupForecast30 = groupForecast30;
	}

	public int getGroupStock() {
		return groupStock;
	}

	public void setGroupStock(int groupStock) {
		this.groupStock = groupStock;
	}

	public int getGroupOnOrder() {
		return groupOnOrder;
	}

	public void setGroupOnOrder(int groupOnOrder) {
		this.groupOnOrder = groupOnOrder;
	}

	public int getGroupNeed() {
		return groupNeed;
	}

	public void setGroupNeed(int groupNeed) {
		this.groupNeed = groupNeed;
	}

	public String getRecommendation() {
		return recommendation != null ? recommendation : sentence;
	}

	public void setRecommendation(String recommendation) {
		this.recommendation = recommendation;
		if (this.sentence == null) {
			this.sentence = recommendation;
		}
	}

	public String getSentence() {
		return sentence != null ? sentence : recommendation;
	}

	public void setSentence(String sentence) {
		this.sentence = sentence;
		if (this.recommendation == null) {
			this.recommendation = sentence;
		}
	}

	public List<ProductMixItem> getBrands() {
		return brands;
	}

	public void setBrands(List<ProductMixItem> brands) {
		this.brands = brands;
	}

	public List<ProductMixItem> getItems() {
		return brands;
	}

	public void setItems(List<ProductMixItem> items) {
		this.brands = items;
	}

	public static class ProductMixItem {
		private Long productId;
		private String name;
		private String brand;
		private long unitsSold;
		private BigDecimal profit;
		private BigDecimal profitPerUnit;
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
			this(productId, name, brand, unitsSold, profit, BigDecimal.ZERO, marginPercent, currentSharePercent,
					suggestedSharePercent, targetUnits, unitsToOrder, stock, onOrderQuantity);
		}

		public ProductMixItem(Long productId, String name, String brand, long unitsSold,
				BigDecimal profit, BigDecimal profitPerUnit, BigDecimal marginPercent, BigDecimal currentSharePercent,
				BigDecimal suggestedSharePercent, int targetUnits, int unitsToOrder,
				int stock, int onOrderQuantity) {
			this.productId = productId;
			this.name = name;
			this.brand = brand;
			this.unitsSold = unitsSold;
			this.profit = profit;
			this.profitPerUnit = profitPerUnit;
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

		public void setProductId(Long productId) {
			this.productId = productId;
		}

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

		public long getUnitsSold() {
			return unitsSold;
		}

		public void setUnitsSold(long unitsSold) {
			this.unitsSold = unitsSold;
		}

		public long getQtySold() {
			return unitsSold;
		}

		public BigDecimal getProfit() {
			return profit;
		}

		public void setProfit(BigDecimal profit) {
			this.profit = profit;
		}

		public BigDecimal getProfitPerUnit() {
			return profitPerUnit != null ? profitPerUnit : BigDecimal.ZERO;
		}

		public void setProfitPerUnit(BigDecimal profitPerUnit) {
			this.profitPerUnit = profitPerUnit;
		}

		public BigDecimal getMarginPercent() {
			return marginPercent;
		}

		public void setMarginPercent(BigDecimal marginPercent) {
			this.marginPercent = marginPercent;
		}

		public BigDecimal getCurrentSharePercent() {
			return currentSharePercent;
		}

		public void setCurrentSharePercent(BigDecimal currentSharePercent) {
			this.currentSharePercent = currentSharePercent;
		}

		public BigDecimal getSuggestedSharePercent() {
			return suggestedSharePercent;
		}

		public void setSuggestedSharePercent(BigDecimal suggestedSharePercent) {
			this.suggestedSharePercent = suggestedSharePercent;
		}

		public int getTargetUnits() {
			return targetUnits;
		}

		public void setTargetUnits(int targetUnits) {
			this.targetUnits = targetUnits;
		}

		public int getUnitsToOrder() {
			return unitsToOrder;
		}

		public void setUnitsToOrder(int unitsToOrder) {
			this.unitsToOrder = unitsToOrder;
		}

		public int getStock() {
			return stock;
		}

		public void setStock(int stock) {
			this.stock = stock;
		}

		public int getOnOrderQuantity() {
			return onOrderQuantity;
		}

		public void setOnOrderQuantity(int onOrderQuantity) {
			this.onOrderQuantity = onOrderQuantity;
		}
	}
}
