package com.optistock.dto;

import java.math.BigDecimal;

public class ForecastItem {

	private Long productId;
	private String name;
	private String brand;
	private String category;
	private Integer stock;
	private BigDecimal avgDailySales;
	private int forecast30;
	private BigDecimal daysOfCover;
	private int suggestedReorderQty;
	private Integer onOrderQuantity;

	public ForecastItem(Long productId, String name, String brand, String category, Integer stock,
			BigDecimal avgDailySales, int forecast30, BigDecimal daysOfCover, int suggestedReorderQty) {
		this(productId, name, brand, category, stock, avgDailySales, forecast30, daysOfCover, suggestedReorderQty, 0);
	}

	public ForecastItem(Long productId, String name, String brand, String category, Integer stock,
			BigDecimal avgDailySales, int forecast30, BigDecimal daysOfCover, int suggestedReorderQty, Integer onOrderQuantity) {
		this.productId = productId;
		this.name = name;
		this.brand = brand;
		this.category = category;
		this.stock = stock;
		this.avgDailySales = avgDailySales;
		this.forecast30 = forecast30;
		this.daysOfCover = daysOfCover;
		this.suggestedReorderQty = suggestedReorderQty;
		this.onOrderQuantity = onOrderQuantity != null ? onOrderQuantity : 0;
	}

	public Integer getOnOrderQuantity() { return onOrderQuantity != null ? onOrderQuantity : 0; }

	public Long getId() { return productId; }
	public Long getProductId() { return productId; }
	public String getName() { return name; }
	public String getBrand() { return brand; }
	public String getCategory() { return category; }
	public Integer getStock() { return stock; }
	public BigDecimal getAvgDailySales() { return avgDailySales; }
	public int getForecast30() { return forecast30; }
	public BigDecimal getDaysOfCover() { return daysOfCover; }
	public int getSuggestedReorderQty() { return suggestedReorderQty; }
}
